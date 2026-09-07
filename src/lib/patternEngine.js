import { subDays, format, differenceInCalendarDays, parseISO } from 'date-fns'

// Reads the user's last 30-60 days of real data and finds actual
// correlations — not generic AI text. Caches results in pattern_insights
// so it only computes once per day, not on every page load.
export async function computeAndStorePatterns(supabase, userId) {
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const { data: already } = await supabase
    .from('pattern_insights')
    .select('id')
    .eq('user_id', userId)
    .eq('computed_at', todayStr)
    .limit(1)
  if (already && already.length) return // already computed today, skip

  const start30 = format(subDays(new Date(), 30), 'yyyy-MM-dd')
  const start60 = format(subDays(new Date(), 60), 'yyyy-MM-dd')

  const [{ data: checkins }, { data: focusSessions }, { data: healthLogs }, { data: habits }, { data: habitLogs }] = await Promise.all([
    supabase.from('checkins').select('mood, energy, date').eq('user_id', userId).gte('date', start30),
    supabase.from('focus_sessions').select('duration_minutes, date').eq('user_id', userId).gte('date', start30),
    supabase.from('health_logs').select('date, sleep_hours').eq('user_id', userId).gte('date', start30),
    supabase.from('habits').select('id, name, created_at').eq('user_id', userId),
    supabase.from('habit_logs').select('habit_id, completed_on').eq('user_id', userId).gte('completed_on', start60),
  ])

  const insights = []

  // 1. Sleep vs. focus time correlation
  const sleepByDate = new Map((healthLogs || []).filter(h => h.sleep_hours != null).map(h => [h.date, h.sleep_hours]))
  const focusByDate = new Map()
  ;(focusSessions || []).forEach(f => focusByDate.set(f.date, (focusByDate.get(f.date) || 0) + (f.duration_minutes || 0)))
  const lowSleepFocus = [], highSleepFocus = []
  sleepByDate.forEach((hrs, date) => {
    if (!focusByDate.has(date)) return
    const mins = focusByDate.get(date)
    if (hrs < 6) lowSleepFocus.push(mins)
    else highSleepFocus.push(mins)
  })
  if (lowSleepFocus.length >= 3 && highSleepFocus.length >= 3) {
    const avgLow = lowSleepFocus.reduce((a, b) => a + b, 0) / lowSleepFocus.length
    const avgHigh = highSleepFocus.reduce((a, b) => a + b, 0) / highSleepFocus.length
    if (avgHigh > 0) {
      const dropPct = Math.round(((avgHigh - avgLow) / avgHigh) * 100)
      if (dropPct >= 15) {
        insights.push({
          category: 'sleep_focus',
          insight_text: `Your focus time drops about ${dropPct}% on days following under 6 hours of sleep (${Math.round(avgLow)}min vs ${Math.round(avgHigh)}min on well-rested days).`,
        })
      }
    }
  }

  // 2. Mood dips by weekday
  const moodByWeekday = Array.from({ length: 7 }, () => [])
  ;(checkins || []).forEach(c => moodByWeekday[parseISO(c.date).getDay()].push(c.mood))
  const weekdayAvgs = moodByWeekday.map(arr => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null))
  const validAvgs = weekdayAvgs.filter(v => v !== null)
  if (validAvgs.length >= 4) {
    const overall = validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length
    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    weekdayAvgs.forEach((avg, i) => {
      if (avg !== null && moodByWeekday[i].length >= 2 && overall - avg >= 0.8) {
        insights.push({
          category: 'mood_cycle',
          insight_text: `Your mood tends to dip on ${names[i]}s — averaging ${avg.toFixed(1)}/5 vs your overall ${overall.toFixed(1)}/5.`,
        })
      }
    })
  }

  // 3. Habit dropout timing — when do habits actually die
  ;(habits || []).forEach(h => {
    const logs = (habitLogs || []).filter(l => l.habit_id === h.id).map(l => l.completed_on).sort()
    if (logs.length < 5) return
    const created = h.created_at ? new Date(h.created_at) : parseISO(logs[0])
    const lastLog = parseISO(logs[logs.length - 1])
    const daysSinceLast = differenceInCalendarDays(new Date(), lastLog)
    const dayOfLifeAtLastLog = differenceInCalendarDays(lastLog, created)
    if (daysSinceLast >= 5 && dayOfLifeAtLastLog >= 7 && dayOfLifeAtLastLog <= 21) {
      insights.push({
        category: 'habit_dropout',
        insight_text: `"${h.name}" logging stopped around day ${dayOfLifeAtLastLog} and hasn't been logged in ${daysSinceLast} days.`,
      })
    }
  })

  if (insights.length === 0) {
    insights.push({
      category: 'baseline',
      insight_text: 'Not enough data yet for strong patterns — keep logging check-ins, sleep, and habits daily and insights will sharpen within a couple weeks.',
    })
  }

  await supabase.from('pattern_insights').insert(
    insights.map(i => ({ user_id: userId, category: i.category, insight_text: i.insight_text, computed_at: todayStr }))
  )
}

export async function getRecentInsights(supabase, userId, limit = 5) {
  const { data } = await supabase
    .from('pattern_insights')
    .select('insight_text, category, computed_at')
    .eq('user_id', userId)
    .order('computed_at', { ascending: false })
    .limit(limit)
  return data || []
}