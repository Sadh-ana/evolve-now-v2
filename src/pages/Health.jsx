import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { format, subDays, differenceInDays, parseISO, addDays } from 'date-fns'

const FOODS = [
  { name: 'Rice (1 cup cooked)', calories: 206, protein: 4.3, carbs: 45, fat: 0.4, fibre: 0.6, unit: 'cup' },
  { name: 'Chapati (1 medium)', calories: 104, protein: 3.1, carbs: 18, fat: 2.5, fibre: 1.9, unit: 'piece' },
  { name: 'Dal (1 cup)', calories: 230, protein: 17, carbs: 39, fat: 1, fibre: 15, unit: 'cup' },
  { name: 'Chicken breast (100g)', calories: 165, protein: 31, carbs: 0, fat: 3.6, fibre: 0, unit: 'g' },
  { name: 'Eggs (1 large)', calories: 72, protein: 6.3, carbs: 0.4, fat: 5, fibre: 0, unit: 'piece' },
  { name: 'Oats (1 cup dry)', calories: 307, protein: 10.7, carbs: 55, fat: 5.3, fibre: 8.2, unit: 'cup' },
  { name: 'Banana (1 medium)', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fibre: 2.6, unit: 'piece' },
  { name: 'Apple (1 medium)', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fibre: 4.4, unit: 'piece' },
  { name: 'Milk (1 cup)', calories: 149, protein: 8, carbs: 12, fat: 8, fibre: 0, unit: 'cup' },
  { name: 'Paneer (100g)', calories: 265, protein: 18.3, carbs: 1.2, fat: 20.8, fibre: 0, unit: 'g' },
  { name: 'Curd/Yogurt (1 cup)', calories: 100, protein: 8.5, carbs: 11, fat: 2.5, fibre: 0, unit: 'cup' },
  { name: 'Peanut butter (1 tbsp)', calories: 94, protein: 4, carbs: 3.1, fat: 8, fibre: 0.9, unit: 'tbsp' },
  { name: 'Dosa (1 medium)', calories: 133, protein: 3.4, carbs: 23, fat: 3.5, fibre: 1, unit: 'piece' },
  { name: 'Idli (1 piece)', calories: 39, protein: 1.7, carbs: 8, fat: 0.2, fibre: 0.5, unit: 'piece' },
  { name: 'Sambar (1 cup)', calories: 95, protein: 4.5, carbs: 15, fat: 2.5, fibre: 4, unit: 'cup' },
  { name: 'Almonds (10 pieces)', calories: 69, protein: 2.5, carbs: 2.5, fat: 6, fibre: 1.5, unit: 'piece' },
  { name: 'Whey protein (1 scoop)', calories: 120, protein: 25, carbs: 3, fat: 1.5, fibre: 0, unit: 'scoop' },
  { name: 'Brown rice (1 cup)', calories: 216, protein: 5, carbs: 45, fat: 1.8, fibre: 3.5, unit: 'cup' },
  { name: 'Pasta (1 cup cooked)', calories: 220, protein: 8, carbs: 43, fat: 1.3, fibre: 2.5, unit: 'cup' },
  { name: 'Tofu (100g)', calories: 76, protein: 8, carbs: 1.9, fat: 4.8, fibre: 0.3, unit: 'g' },
]

const PERIOD_SYMPTOMS = ['cramps', 'headache', 'bloating', 'fatigue', 'mood swings', 'back pain', 'nausea', 'breast tenderness', 'acne', 'cravings']
const ILLNESS_SYMPTOMS = ['fever', 'cough', 'cold', 'sore throat', 'headache', 'body ache', 'fatigue', 'nausea', 'vomiting', 'diarrhoea', 'loss of appetite', 'chills']
const PERIOD_MOODS = ['happy', 'anxious', 'irritable', 'sad', 'calm', 'energetic', 'low', 'neutral']

const TABS = ['today', 'nutrition', 'sleep', 'period', 'illness']

function AnimatedNumber({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const target = parseFloat(value) || 0
    const step = target / 30
    let current = 0
    const interval = setInterval(() => {
      current = Math.min(current + step, target)
      setDisplay(Math.round(current * 10) / 10)
      if (current >= target) clearInterval(interval)
    }, 20)
    return () => clearInterval(interval)
  }, [value])
  return <span>{display}{suffix}</span>
}

function WaterRing({ ml, goal = 2000 }) {
  const pct = Math.min(ml / goal, 1)
  const r = 54
  const circ = 2 * Math.PI * r
  const [animated, setAnimated] = useState(0)
  useEffect(() => { setTimeout(() => setAnimated(pct), 100) }, [pct])
  return (
    <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto' }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--base-700)" strokeWidth="8" />
        <circle cx="70" cy="70" r={r} fill="none" stroke="#7fc4b0" strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - animated)}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontStyle: 'italic', color: '#7fc4b0' }}>{ml}ml</div>
        <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>of {goal}ml</div>
      </div>
    </div>
  )
}

function MacroBar({ label, val, max, color }) {
  const [width, setWidth] = useState(0)
  useEffect(() => { setTimeout(() => setWidth(Math.min((val / max) * 100, 100)), 200) }, [val, max])
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '12px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)' }}>{label}</span>
        <span style={{ fontSize: '11px', color, fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{Math.round(val)}g</span>
      </div>
      <div style={{ height: '5px', background: 'var(--base-700)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${width}%`, background: color, borderRadius: '99px', transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

export default function Health({ session }) {
  const [tab, setTab] = useState('today')
  const [gender, setGender] = useState(null)
  const [loadingGender, setLoadingGender] = useState(true)
  const today = format(new Date(), 'yyyy-MM-dd')

  // Today's log
  const [healthLog, setHealthLog] = useState(null)
  const [water, setWater] = useState(0)
  const [steps, setSteps] = useState(0)
  const [caloriesBurned, setCaloriesBurned] = useState(0)

  // Food
  const [foodLogs, setFoodLogs] = useState([])
  const [foodSearch, setFoodSearch] = useState('')
  const [showFoodModal, setShowFoodModal] = useState(false)
  const [selectedFood, setSelectedFood] = useState(null)
  const [foodQty, setFoodQty] = useState(1)
  const [mealType, setMealType] = useState('lunch')

  // Sleep
  const [sleepLogs, setSleepLogs] = useState([])
  const [sleepForm, setSleepForm] = useState({ hours: 7.5, quality: 3, date: today })
  const [showSleepModal, setShowSleepModal] = useState(false)

  // Period
  const [periodLogs, setPeriodLogs] = useState([])
  const [showPeriodModal, setShowPeriodModal] = useState(false)
  const [periodForm, setPeriodForm] = useState({ date: today, flow: 'medium', symptoms: [], mood: 'neutral', notes: '' })

  // Illness
  const [illnessLogs, setIllnessLogs] = useState([])
  const [showIllnessModal, setShowIllnessModal] = useState(false)
  const [illnessForm, setIllnessForm] = useState({ date: today, symptoms: [], severity: 2, fever_temp: '', notes: '' })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const uid = session.user.id
    const { data: profile } = await supabase.from('profiles').select('gender').eq('id', uid).single()
    if (profile?.gender) setGender(profile.gender)
    setLoadingGender(false)

    const start = format(subDays(new Date(), 30), 'yyyy-MM-dd')

    const [{ data: hl }, { data: fl }, { data: sl }, { data: pl }, { data: il }] = await Promise.all([
      supabase.from('health_logs').select('*').eq('user_id', uid).eq('date', today).maybeSingle(),
      supabase.from('food_logs').select('*').eq('user_id', uid).eq('date', today).order('created_at'),
      supabase.from('health_logs').select('*').eq('user_id', uid).gte('date', start).order('date'),
      supabase.from('period_logs').select('*').eq('user_id', uid).gte('date', start).order('date', { ascending: false }),
      supabase.from('illness_logs').select('*').eq('user_id', uid).gte('date', start).order('date', { ascending: false }),
    ])

    if (hl) { setHealthLog(hl); setWater(hl.water_ml || 0); setSteps(hl.steps || 0); setCaloriesBurned(hl.calories_burned || 0) }
    setFoodLogs(fl || [])
    setSleepLogs(sl || [])
    setPeriodLogs(pl || [])
    setIllnessLogs(il || [])
  }

  async function saveGender(g) {
    setGender(g)
    await supabase.from('profiles').update({ gender: g }).eq('id', session.user.id)
  }

  async function updateHealthLog(updates) {
    const uid = session.user.id
    if (healthLog) {
      await supabase.from('health_logs').update(updates).eq('id', healthLog.id)
      setHealthLog(p => ({ ...p, ...updates }))
    } else {
      const { data } = await supabase.from('health_logs').insert({ user_id: uid, date: today, ...updates }).select().single()
      setHealthLog(data)
    }
  }

  async function addWater(amount) {
    const newVal = Math.max(0, water + amount)
    setWater(newVal)
    await updateHealthLog({ water_ml: newVal })
  }

  async function saveSteps() {
    await updateHealthLog({ steps, calories_burned: caloriesBurned })
  }

  async function addFood(e) {
    e.preventDefault()
    if (!selectedFood) return
    const multiplier = foodQty
    const entry = {
      user_id: session.user.id, date: today, meal_type: mealType,
      food_name: selectedFood.name, quantity: foodQty, unit: selectedFood.unit,
      calories: Math.round(selectedFood.calories * multiplier),
      protein_g: Math.round(selectedFood.protein * multiplier * 10) / 10,
      carbs_g: Math.round(selectedFood.carbs * multiplier * 10) / 10,
      fat_g: Math.round(selectedFood.fat * multiplier * 10) / 10,
      fibre_g: Math.round(selectedFood.fibre * multiplier * 10) / 10,
    }
    const { data } = await supabase.from('food_logs').insert(entry).select().single()
    if (data) setFoodLogs(p => [...p, data])
    setShowFoodModal(false); setSelectedFood(null); setFoodQty(1); setFoodSearch('')
  }

  async function removeFood(id) {
    await supabase.from('food_logs').delete().eq('id', id)
    setFoodLogs(p => p.filter(f => f.id !== id))
  }

  async function saveSleep(e) {
    e.preventDefault()
    const uid = session.user.id
    const { data } = await supabase.from('health_logs').upsert({
      user_id: uid, date: sleepForm.date,
      sleep_hours: sleepForm.hours, sleep_quality: sleepForm.quality
    }, { onConflict: 'user_id,date' }).select().single()
    if (data) setSleepLogs(p => {
      const exists = p.find(l => l.date === sleepForm.date)
      if (exists) return p.map(l => l.date === sleepForm.date ? { ...l, ...data } : l)
      return [...p, data].sort((a, b) => a.date.localeCompare(b.date))
    })
    setShowSleepModal(false)
  }

  async function savePeriod(e) {
    e.preventDefault()
    const uid = session.user.id
    const { data } = await supabase.from('period_logs').upsert({ user_id: uid, ...periodForm }, { onConflict: 'user_id,date' }).select().single()
    if (data) setPeriodLogs(p => {
      const exists = p.find(l => l.date === periodForm.date)
      if (exists) return p.map(l => l.date === periodForm.date ? data : l)
      return [data, ...p]
    })
    setShowPeriodModal(false)
  }

  async function saveIllness(e) {
    e.preventDefault()
    const uid = session.user.id
    const { data } = await supabase.from('illness_logs').upsert({ user_id: uid, ...illnessForm }, { onConflict: 'user_id,date' }).select().single()
    if (data) setIllnessLogs(p => {
      const exists = p.find(l => l.date === illnessForm.date)
      if (exists) return p.map(l => l.date === illnessForm.date ? data : l)
      return [data, ...p]
    })
    setShowIllnessModal(false)
  }

  // Totals
  const totalCal = foodLogs.reduce((s, f) => s + (f.calories || 0), 0)
  const totalProtein = foodLogs.reduce((s, f) => s + (f.protein_g || 0), 0)
  const totalCarbs = foodLogs.reduce((s, f) => s + (f.carbs_g || 0), 0)
  const totalFat = foodLogs.reduce((s, f) => s + (f.fat_g || 0), 0)
  const totalFibre = foodLogs.reduce((s, f) => s + (f.fibre_g || 0), 0)
  const netCal = totalCal - caloriesBurned
  const filteredFoods = FOODS.filter(f => f.name.toLowerCase().includes(foodSearch.toLowerCase()))

  const card = (extra = {}) => ({ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '14px', padding: '1.25rem', ...extra })
  const iStyle = { width: '100%', background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRadius: '10px', padding: '9px 14px', color: 'var(--cream-200)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }
  const lbl = { fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)' }

  // Gender selection screen
  // Allow changing gender — find the tab header div and add this button
  if (loadingGender) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-serif)', fontSize: '20px', fontStyle: 'italic' }}>loading...</p>
    </div>
  )

  if (!gender) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '8px' }}>One quick thing ✦</h2>
        <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)', marginBottom: '40px', lineHeight: 1.7 }}>
          This helps personalise your health modules — period tracking, nutrition goals, and more.
        </p>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { id: 'female', label: 'Female', icon: '◎', desc: 'Period tracker + female health' },
            { id: 'male', label: 'Male', icon: '◈', desc: 'Fitness + nutrition focused' },
            { id: 'prefer_not_to_say', label: 'Prefer not to say', icon: '◑', desc: 'All general modules' },
          ].map(g => (
            <button key={g.id} onClick={() => saveGender(g.id)} style={{
              padding: '20px 24px', background: 'var(--base-800)',
              border: '0.5px solid var(--base-600)', borderRadius: '16px',
              cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
              minWidth: '140px',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold-300)'; e.currentTarget.style.background = 'var(--base-700)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--base-600)'; e.currentTarget.style.background = 'var(--base-800)' }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px', color: 'var(--gold-300)' }}>{g.icon}</div>
              <div style={{ fontSize: '14px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontWeight: 500, marginBottom: '4px' }}>{g.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{g.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      {/* HEADER */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', fontWeight: 400, color: 'var(--cream-200)', marginBottom: '4px' }}>Health</h2>
          <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)' }}>{format(new Date(), 'EEEE, MMMM d')} ✦</p>
        </div>
        <button onClick={() => setGender(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '11px', fontFamily: 'var(--font-sans)' }}>change profile</button>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
        {TABS.filter(t => t !== 'period' || gender === 'female').map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', borderRadius: '9px', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: tab === t ? 500 : 400,
            background: tab === t ? 'var(--gold-300)' : 'transparent',
            color: tab === t ? 'var(--base-950)' : 'var(--muted)',
            transition: 'all 0.2s', textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </div>

      {/* TODAY TAB */}
      {tab === 'today' && (
        <div style={{ animation: 'pageFade 0.2s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '20px' }}>

            {/* WATER */}
            <div style={card()}>
              <p style={{ ...lbl, marginBottom: '16px' }}>Water intake</p>
              <WaterRing ml={water} />
              <div style={{ display: 'flex', gap: '6px', marginTop: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {[150, 250, 500].map(amt => (
                  <button key={amt} onClick={() => addWater(amt)} style={{
                    padding: '6px 12px', borderRadius: '99px', border: '0.5px solid #7fc4b066',
                    background: '#7fc4b011', color: '#7fc4b0', fontFamily: 'var(--font-sans)',
                    fontSize: '11px', cursor: 'pointer', transition: 'all 0.15s',
                  }}>+{amt}ml</button>
                ))}
                <button onClick={() => addWater(-250)} style={{
                  padding: '6px 12px', borderRadius: '99px', border: '0.5px solid var(--base-600)',
                  background: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-sans)',
                  fontSize: '11px', cursor: 'pointer',
                }}>−250</button>
              </div>
            </div>

            {/* STEPS & CALORIES */}
            <div style={card()}>
              <p style={lbl}>Steps & calories burned</p>
              <div style={{ marginBottom: '14px' }}>
                <label style={lbl}>Steps today</label>
                <input type="number" value={steps} onChange={e => setSteps(parseInt(e.target.value) || 0)}
                  style={iStyle} placeholder="0" />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={lbl}>Calories burned (workout)</label>
                <input type="number" value={caloriesBurned} onChange={e => setCaloriesBurned(parseInt(e.target.value) || 0)}
                  style={iStyle} placeholder="0" />
              </div>
              <button onClick={saveSteps} style={{ width: '100%', padding: '8px', background: 'var(--gold-300)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500, color: 'var(--base-950)' }}>Save</button>
              <div style={{ marginTop: '12px', padding: '10px', background: 'var(--base-700)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: netCal > 0 ? 'var(--gold-300)' : '#a8c4a0', fontStyle: 'italic' }}>{netCal > 0 ? '+' : ''}{netCal}</div>
                <div style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>net calories</div>
              </div>
            </div>

            {/* TODAY'S NUTRITION SUMMARY */}
            <div style={card()}>
              <p style={lbl}>Today's nutrition</p>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '40px', fontStyle: 'italic', color: 'var(--gold-300)', lineHeight: 1 }}>
                  <AnimatedNumber value={totalCal} />
                </div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>kcal consumed</div>
              </div>
              <MacroBar label="Protein" val={totalProtein} max={150} color="#d4a5a5" />
              <MacroBar label="Carbs" val={totalCarbs} max={300} color="#c9a87c" />
              <MacroBar label="Fibre" val={totalFibre} max={30} color="#a8c4a0" />
              <MacroBar label="Fat" val={totalFat} max={80} color="#9eb5d4" />
            </div>
          </div>

          {/* TODAY'S FOOD LOG */}
          <div style={card()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={lbl}>Today's food log</span>
              <button onClick={() => setShowFoodModal(true)} style={{ padding: '7px 16px', background: 'var(--gold-300)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500, color: 'var(--base-950)' }}>+ Log food</button>
            </div>
            {foodLogs.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>nothing logged yet ✦</p>
            ) : (
              <>
                {['breakfast', 'lunch', 'dinner', 'snack'].map(meal => {
                  const items = foodLogs.filter(f => f.meal_type === meal)
                  if (items.length === 0) return null
                  return (
                    <div key={meal} style={{ marginBottom: '16px' }}>
                      <p style={{ fontSize: '10px', color: 'var(--gold-300)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-sans)', marginBottom: '8px' }}>{meal}</p>
                      {items.map(f => (
                        <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '0.5px solid var(--base-700)' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '13px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)' }}>{f.food_name}</p>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                              <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{f.quantity} {f.unit}</span>
                              <span style={{ fontSize: '10px', color: '#d4a5a5', fontFamily: 'var(--font-sans)' }}>{f.protein_g}g protein</span>
                              <span style={{ fontSize: '10px', color: '#a8c4a0', fontFamily: 'var(--font-sans)' }}>{f.fibre_g}g fibre</span>
                            </div>
                          </div>
                          <span style={{ fontSize: '13px', color: 'var(--gold-300)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{f.calories} kcal</span>
                          <button onClick={() => removeFood(f.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--base-600)', fontSize: '14px' }}>×</button>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      )}

      {/* NUTRITION TAB */}
      {tab === 'nutrition' && (
        <div style={{ animation: 'pageFade 0.2s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div style={card()}>
              <p style={lbl}>7-day calorie trend</p>
              {(() => {
                const days = Array.from({ length: 7 }, (_, i) => {
                  const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
                  return { date: format(subDays(new Date(), 6 - i), 'EEE'), full: d, cal: 0 }
                })
                const max = Math.max(...days.map(d => d.cal), 500)
                return (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
                    {days.map((d, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                        <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: i === 6 ? 'var(--gold-300)' : 'var(--base-600)', height: `${Math.max((d.cal / max) * 100, 4)}%`, transition: 'height 0.6s ease' }} />
                        <span style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{d.date}</span>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
            <div style={card()}>
              <p style={lbl}>Macro breakdown today</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { label: 'Protein', val: totalProtein, unit: 'g', color: '#d4a5a5', goal: 150 },
                  { label: 'Carbs', val: totalCarbs, unit: 'g', color: '#c9a87c', goal: 300 },
                  { label: 'Fat', val: totalFat, unit: 'g', color: '#9eb5d4', goal: 80 },
                  { label: 'Fibre', val: totalFibre, unit: 'g', color: '#a8c4a0', goal: 30 },
                ].map((m, i) => (
                  <div key={i} style={{ background: 'var(--base-700)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: m.color, lineHeight: 1, marginBottom: '2px' }}>{Math.round(m.val)}</div>
                    <div style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label} / {m.goal}{m.unit}</div>
                    <div style={{ height: '3px', background: 'var(--base-600)', borderRadius: '99px', marginTop: '8px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min((m.val / m.goal) * 100, 100)}%`, background: m.color, borderRadius: '99px', transition: 'width 0.8s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={card()}>
            <p style={{ ...lbl, marginBottom: '16px' }}>Common foods reference</p>
            <input value={foodSearch} onChange={e => setFoodSearch(e.target.value)} placeholder="Search foods..." style={{ ...iStyle, marginBottom: '14px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
              {filteredFoods.slice(0, 12).map((f, i) => (
                <div key={i} style={{ background: 'var(--base-700)', borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', marginBottom: '2px' }}>{f.name}</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ fontSize: '10px', color: '#d4a5a5', fontFamily: 'var(--font-sans)' }}>{f.protein}g P</span>
                      <span style={{ fontSize: '10px', color: '#a8c4a0', fontFamily: 'var(--font-sans)' }}>{f.fibre}g F</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--gold-300)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{f.calories}kcal</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SLEEP TAB */}
      {tab === 'sleep' && (
        <div style={{ animation: 'pageFade 0.2s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => setShowSleepModal(true)} style={{ padding: '9px 20px', background: 'var(--gold-300)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)' }}>+ Log sleep</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            {[
              { val: sleepLogs.length > 0 ? `${sleepLogs[sleepLogs.length - 1]?.sleep_hours || '—'}h` : '—', label: 'Last night' },
              { val: sleepLogs.length > 0 ? `${Math.round(sleepLogs.reduce((s, l) => s + (l.sleep_hours || 0), 0) / sleepLogs.length * 10) / 10}h` : '—', label: '30-day average' },
              { val: sleepLogs.filter(l => (l.sleep_hours || 0) >= 7).length, label: 'Good sleep nights' },
            ].map((s, i) => (
              <div key={i} style={card({ textAlign: 'center' })}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', color: '#9eb5d4', fontStyle: 'italic', lineHeight: 1, marginBottom: '4px' }}>{s.val}</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={card()}>
            <p style={lbl}>Sleep history (30 days)</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px' }}>
              {sleepLogs.slice(-14).map((l, i) => {
                const pct = Math.min((l.sleep_hours || 0) / 10, 1)
                const color = (l.sleep_hours || 0) >= 7 ? '#9eb5d4' : (l.sleep_hours || 0) >= 6 ? '#c9a87c' : '#d4a5a5'
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '8px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{l.sleep_hours}h</span>
                    <div style={{ width: '100%', borderRadius: '3px 3px 0 0', background: color, height: `${pct * 100}%`, minHeight: '4px', transition: 'height 0.6s ease' }} />
                    <span style={{ fontSize: '7px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>{format(parseISO(l.date), 'MM/dd')}</span>
                  </div>
                )
              })}
              {sleepLogs.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)', fontStyle: 'italic', margin: 'auto' }}>no sleep data yet</p>}
            </div>
          </div>
        </div>
      )}

      {/* PERIOD TAB — female only */}
      {tab === 'period' && gender === 'female' && (
        <div style={{ animation: 'pageFade 0.2s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => setShowPeriodModal(true)} style={{ padding: '9px 20px', background: '#d4a5a5', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)' }}>+ Log today</button>
          </div>

          {/* Cycle calendar */}
          <div style={card({ marginBottom: '16px' })}>
            <p style={lbl}>Last 30 days</p>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {Array.from({ length: 30 }, (_, i) => {
                const d = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
                const log = periodLogs.find(l => l.date === d)
                const flowColor = log?.flow === 'heavy' ? '#d4a5a5' : log?.flow === 'medium' ? '#c9a87c88' : log?.flow === 'light' ? '#c9a87c44' : 'var(--base-700)'
                return (
                  <div key={i} title={d} style={{
                    width: '28px', height: '28px', borderRadius: '6px',
                    background: flowColor,
                    border: d === today ? '1.5px solid var(--gold-300)' : '0.5px solid var(--base-600)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '9px', color: log ? 'var(--base-950)' : 'var(--muted)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }} onClick={() => { setPeriodForm(p => ({ ...p, date: d })); setShowPeriodModal(true) }}>
                    {format(subDays(new Date(), 29 - i), 'd')}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '14px', flexWrap: 'wrap' }}>
              {[{ color: '#d4a5a5', label: 'Heavy' }, { color: '#c9a87c88', label: 'Medium' }, { color: '#c9a87c44', label: 'Light' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: l.color }} />
                  <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent logs */}
          <div style={card()}>
            <p style={lbl}>Recent entries</p>
            {periodLogs.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>no logs yet ✦</p>
            ) : periodLogs.slice(0, 7).map(log => (
              <div key={log.id} style={{ padding: '10px 0', borderBottom: '0.5px solid var(--base-700)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: log.flow === 'heavy' ? '#d4a5a5' : '#c9a87c', marginTop: '4px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', textTransform: 'capitalize' }}>{log.flow} flow · {log.mood}</span>
                    <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{log.date}</span>
                  </div>
                  {log.symptoms?.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {log.symptoms.map(s => (
                        <span key={s} style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '99px', background: '#d4a5a522', color: '#d4a5a5', fontFamily: 'var(--font-sans)' }}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ILLNESS TAB */}
      {tab === 'illness' && (
        <div style={{ animation: 'pageFade 0.2s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => setShowIllnessModal(true)} style={{ padding: '9px 20px', background: 'var(--gold-300)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)' }}>+ Log illness</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div style={card()}>
              <p style={lbl}>Sick days (30 days)</p>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '48px', fontStyle: 'italic', color: '#d4a5a5', lineHeight: 1, marginBottom: '4px' }}>{illnessLogs.length}</div>
              <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
                {illnessLogs.length === 0 ? 'Healthy streak! ✦' : illnessLogs.length <= 2 ? 'Pretty healthy overall' : 'Consider checking vitamin D, iron & sleep'}
              </p>
            </div>
            <div style={card()}>
              <p style={lbl}>Most common symptoms</p>
              {(() => {
                const counts = {}
                illnessLogs.forEach(l => l.symptoms?.forEach(s => { counts[s] = (counts[s] || 0) + 1 }))
                const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
                if (sorted.length === 0) return <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>no data yet</p>
                return sorted.map(([sym, count]) => (
                  <div key={sym} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '0.5px solid var(--base-700)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', textTransform: 'capitalize' }}>{sym}</span>
                    <span style={{ fontSize: '11px', color: '#d4a5a5', fontFamily: 'var(--font-sans)' }}>{count}×</span>
                  </div>
                ))
              })()}
            </div>
          </div>

          <div style={card()}>
            <p style={lbl}>Illness log</p>
            {illnessLogs.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>no illness logged ✦ stay healthy!</p>
            ) : illnessLogs.map(log => (
              <div key={log.id} style={{ padding: '12px 0', borderBottom: '0.5px solid var(--base-700)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i < (log.severity || 1) ? '#d4a5a5' : 'var(--base-600)' }} />
                    ))}
                    {log.fever_temp && <span style={{ fontSize: '10px', color: '#d4a5a5', fontFamily: 'var(--font-sans)' }}>🌡 {log.fever_temp}°C</span>}
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{log.date}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {log.symptoms?.map(s => (
                    <span key={s} style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '99px', background: '#d4a5a520', color: '#d4a5a5', fontFamily: 'var(--font-sans)' }}>{s}</span>
                  ))}
                </div>
                {log.notes && <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginTop: '6px', fontStyle: 'italic' }}>{log.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOD MODAL */}
      {showFoodModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowFoodModal(false)}>
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '520px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '20px' }}>Log Food</h3>
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>Meal</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['breakfast', 'lunch', 'dinner', 'snack'].map(m => (
                  <button key={m} onClick={() => setMealType(m)} style={{ padding: '6px 14px', borderRadius: '8px', border: `0.5px solid ${mealType === m ? 'var(--gold-300)' : 'var(--base-600)'}`, background: mealType === m ? 'rgba(201,168,124,0.15)' : 'transparent', color: mealType === m ? 'var(--gold-300)' : 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', textTransform: 'capitalize' }}>{m}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>Search food</label>
              <input value={foodSearch} onChange={e => { setFoodSearch(e.target.value); setSelectedFood(null) }} placeholder="Rice, chicken, eggs..." style={iStyle} autoFocus />
            </div>
            <div style={{ marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
              {filteredFoods.map((f, i) => (
                <div key={i} onClick={() => setSelectedFood(f)} style={{
                  padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '4px',
                  background: selectedFood?.name === f.name ? 'rgba(201,168,124,0.12)' : 'var(--base-700)',
                  border: `0.5px solid ${selectedFood?.name === f.name ? 'var(--gold-300)' : 'transparent'}`,
                  transition: 'all 0.15s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)' }}>{f.name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--gold-300)', fontFamily: 'var(--font-sans)' }}>{f.calories} kcal</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                    <span style={{ fontSize: '10px', color: '#d4a5a5', fontFamily: 'var(--font-sans)' }}>P: {f.protein}g</span>
                    <span style={{ fontSize: '10px', color: '#c9a87c', fontFamily: 'var(--font-sans)' }}>C: {f.carbs}g</span>
                    <span style={{ fontSize: '10px', color: '#9eb5d4', fontFamily: 'var(--font-sans)' }}>F: {f.fat}g</span>
                    <span style={{ fontSize: '10px', color: '#a8c4a0', fontFamily: 'var(--font-sans)' }}>Fi: {f.fibre}g</span>
                  </div>
                </div>
              ))}
            </div>
            {selectedFood && (
              <form onSubmit={addFood}>
                <div style={{ background: 'var(--base-700)', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--gold-300)', fontFamily: 'var(--font-sans)', marginBottom: '8px' }}>{selectedFood.name}</p>
                  <label style={lbl}>Quantity ({selectedFood.unit}s)</label>
                  <input type="number" value={foodQty} onChange={e => setFoodQty(parseFloat(e.target.value) || 1)} min={0.25} step={0.25} style={iStyle} />
                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {['calories', 'protein', 'carbs', 'fat', 'fibre'].map(m => (
                      <span key={m} style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
                        {m}: <strong style={{ color: 'var(--cream-200)' }}>{Math.round(selectedFood[m === 'calories' ? 'calories' : m + (m === 'fibre' ? '' : '_g' in selectedFood ? '' : '')] * foodQty * 10) / 10}{m === 'calories' ? 'kcal' : 'g'}</strong>
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setShowFoodModal(false)} style={{ flex: 1, padding: '11px', borderRadius: '12px', border: '0.5px solid var(--base-600)', background: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: '12px', border: 'none', background: 'var(--gold-300)', color: 'var(--base-950)', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Add ✦</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* SLEEP MODAL */}
      {showSleepModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowSleepModal(false)}>
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '20px' }}>Log Sleep</h3>
            <form onSubmit={saveSleep} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={lbl}>Date</label><input type="date" value={sleepForm.date} onChange={e => setSleepForm(p => ({ ...p, date: e.target.value }))} style={{ ...iStyle, colorScheme: 'dark' }} /></div>
              <div>
                <label style={lbl}>Hours slept: {sleepForm.hours}h</label>
                <input type="range" min={3} max={12} step={0.5} value={sleepForm.hours} onChange={e => setSleepForm(p => ({ ...p, hours: parseFloat(e.target.value) }))} style={{ width: '100%', accentColor: '#9eb5d4' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}><span>3h</span><span>12h</span></div>
              </div>
              <div>
                <label style={lbl}>Quality</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => setSleepForm(p => ({ ...p, quality: n }))} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `0.5px solid ${sleepForm.quality === n ? '#9eb5d4' : 'var(--base-600)'}`, background: sleepForm.quality === n ? '#9eb5d422' : 'transparent', color: sleepForm.quality === n ? '#9eb5d4' : 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px' }}>{n}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowSleepModal(false)} style={{ flex: 1, padding: '11px', borderRadius: '12px', border: '0.5px solid var(--base-600)', background: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: '12px', border: 'none', background: 'var(--gold-300)', color: 'var(--base-950)', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Save ✦</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PERIOD MODAL */}
      {showPeriodModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowPeriodModal(false)}>
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '460px', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '20px' }}>Period Log</h3>
            <form onSubmit={savePeriod} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={lbl}>Date</label><input type="date" value={periodForm.date} onChange={e => setPeriodForm(p => ({ ...p, date: e.target.value }))} style={{ ...iStyle, colorScheme: 'dark' }} /></div>
              <div>
                <label style={lbl}>Flow</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['spotting', 'light', 'medium', 'heavy'].map(f => (
                    <button key={f} type="button" onClick={() => setPeriodForm(p => ({ ...p, flow: f }))} style={{ flex: 1, padding: '7px', borderRadius: '8px', border: `0.5px solid ${periodForm.flow === f ? '#d4a5a5' : 'var(--base-600)'}`, background: periodForm.flow === f ? '#d4a5a522' : 'transparent', color: periodForm.flow === f ? '#d4a5a5' : 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '10px', textTransform: 'capitalize' }}>{f}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>Symptoms</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {PERIOD_SYMPTOMS.map(s => {
                    const active = periodForm.symptoms.includes(s)
                    return <button key={s} type="button" onClick={() => setPeriodForm(p => ({ ...p, symptoms: active ? p.symptoms.filter(x => x !== s) : [...p.symptoms, s] }))} style={{ padding: '5px 12px', borderRadius: '99px', border: `0.5px solid ${active ? '#d4a5a5' : 'var(--base-600)'}`, background: active ? '#d4a5a522' : 'transparent', color: active ? '#d4a5a5' : 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px' }}>{s}</button>
                  })}
                </div>
              </div>
              <div>
                <label style={lbl}>Mood</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {PERIOD_MOODS.map(m => (
                    <button key={m} type="button" onClick={() => setPeriodForm(p => ({ ...p, mood: m }))} style={{ padding: '5px 12px', borderRadius: '99px', border: `0.5px solid ${periodForm.mood === m ? '#c9a87c' : 'var(--base-600)'}`, background: periodForm.mood === m ? 'rgba(201,168,124,0.15)' : 'transparent', color: periodForm.mood === m ? '#c9a87c' : 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', textTransform: 'capitalize' }}>{m}</button>
                  ))}
                </div>
              </div>
              <div><label style={lbl}>Notes</label><input value={periodForm.notes} onChange={e => setPeriodForm(p => ({ ...p, notes: e.target.value }))} placeholder="How are you feeling overall..." style={iStyle} /></div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowPeriodModal(false)} style={{ flex: 1, padding: '11px', borderRadius: '12px', border: '0.5px solid var(--base-600)', background: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: '12px', border: 'none', background: '#d4a5a5', color: 'var(--base-950)', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Save ✦</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ILLNESS MODAL */}
      {showIllnessModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowIllnessModal(false)}>
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '460px', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '20px' }}>Log Illness</h3>
            <form onSubmit={saveIllness} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={lbl}>Date</label><input type="date" value={illnessForm.date} onChange={e => setIllnessForm(p => ({ ...p, date: e.target.value }))} style={{ ...iStyle, colorScheme: 'dark' }} /></div>
              <div>
                <label style={lbl}>Symptoms</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {ILLNESS_SYMPTOMS.map(s => {
                    const active = illnessForm.symptoms.includes(s)
                    return <button key={s} type="button" onClick={() => setIllnessForm(p => ({ ...p, symptoms: active ? p.symptoms.filter(x => x !== s) : [...p.symptoms, s] }))} style={{ padding: '5px 12px', borderRadius: '99px', border: `0.5px solid ${active ? '#d4a5a5' : 'var(--base-600)'}`, background: active ? '#d4a5a522' : 'transparent', color: active ? '#d4a5a5' : 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px' }}>{s}</button>
                  })}
                </div>
              </div>
              <div>
                <label style={lbl}>Severity (1–5)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => setIllnessForm(p => ({ ...p, severity: n }))} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `0.5px solid ${illnessForm.severity === n ? '#d4a5a5' : 'var(--base-600)'}`, background: illnessForm.severity === n ? '#d4a5a522' : 'transparent', color: illnessForm.severity === n ? '#d4a5a5' : 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px' }}>{n}</button>
                  ))}
                </div>
              </div>
              <div><label style={lbl}>Fever temp (°C, optional)</label><input type="number" value={illnessForm.fever_temp} onChange={e => setIllnessForm(p => ({ ...p, fever_temp: e.target.value }))} placeholder="38.5" step="0.1" style={iStyle} /></div>
              <div><label style={lbl}>Notes</label><input value={illnessForm.notes} onChange={e => setIllnessForm(p => ({ ...p, notes: e.target.value }))} placeholder="What happened, what helped..." style={iStyle} /></div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowIllnessModal(false)} style={{ flex: 1, padding: '11px', borderRadius: '12px', border: '0.5px solid var(--base-600)', background: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: '12px', border: 'none', background: 'var(--gold-300)', color: 'var(--base-950)', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Save ✦</button>
              </div>
            </form>
          </div>
        </div>
      )}  
    </div>
  )
}
