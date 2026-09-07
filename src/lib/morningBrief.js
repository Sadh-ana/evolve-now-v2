import { format } from 'date-fns'

// Generates (or returns the cached) morning brief for today. One Groq/Claude
// call per user per day max — cached in daily_briefs, not regenerated on
// every dashboard load.
export async function getMorningBrief(supabase, userId, facts) {
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const { data: cached } = await supabase
    .from('daily_briefs')
    .select('brief_text')
    .eq('user_id', userId)
    .eq('brief_date', todayStr)
    .maybeSingle()
  if (cached) return cached.brief_text

  const { profile, todaySleep, tasksDueToday, topHabitStreak, insight, mood, energy, checkinDone } = facts

  const factLine = [
    todaySleep != null ? `Slept ${todaySleep}h last night` : 'No sleep data logged',
    `${tasksDueToday} task(s) due today`,
    topHabitStreak ? `Longest active habit streak: ${topHabitStreak} days` : null,
    checkinDone ? `Checked in today — mood ${mood}/5, energy ${energy}/5` : 'Has not checked in yet today',
    insight ? `Recent pattern: ${insight}` : null,
  ].filter(Boolean).join('. ')

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: `You are EVOLVE, writing a 2-3 sentence morning brief for ${profile?.name || 'the user'}. Be specific to the real data given below — never generic filler. Do not say "good morning" or any greeting, the UI already shows one. Just the sharpest observation plus one concrete suggestion for today.`,
        messages: [{ role: 'user', content: factLine }],
      }),
    })
    const data = await res.json()
    const text = data.text || null
    if (text) await supabase.from('daily_briefs').insert({ user_id: userId, brief_date: todayStr, brief_text: text })
    return text
  } catch {
    return null
  }
}