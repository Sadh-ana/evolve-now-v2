import { useState } from 'react'
import { supabase } from '../lib/supabase'

const ARCHETYPES = [
  { id: 'procrastinator', label: 'The Procrastinator', desc: 'I delay starting, even when I genuinely want to', icon: '⏳' },
  { id: 'perfectionist', label: 'The Perfectionist', desc: 'I redo endlessly or don\'t start at all', icon: '◎' },
  { id: 'grinder', label: 'The Grinder', desc: 'I push until I crash, then wonder why I\'m gone', icon: '↑' },
  { id: 'burnout-prone', label: 'Burnout-prone', desc: 'All in for a week, then completely offline for days', icon: '◌' },
  { id: 'self-sabotager', label: 'The Self-sabotager', desc: 'I undermine myself right when things go well', icon: '✕' },
  { id: 'adhd', label: 'ADHD brain', desc: 'Hyperfocus sometimes, can\'t start at all other times', icon: '◈' },
  { id: 'committed', label: 'The Committed', desc: 'I show up consistently — I just need better systems', icon: '✦' },
]

const HOBBY_QUESTIONS = [
  { field: 'leisure', q: 'When you have free time, what sounds most appealing?', options: [
    { id: 'physical', label: 'Something physical — move, sweat, play' },
    { id: 'creative', label: 'Something creative — make, build, express' },
    { id: 'intellectual', label: 'Something intellectual — learn, puzzle, research' },
    { id: 'cozy', label: 'Something cozy — calm, low-key, enjoyable' },
    { id: 'social', label: 'Something social — connect, compete, collaborate' },
  ]},
  { field: 'energy', q: 'What energy level fits your ideal hobby?', options: [
    { id: 'cozy', label: 'Cozy & calm (reading, journaling, crafts)' },
    { id: 'moderate', label: 'Moderate (yoga, photography, board games)' },
    { id: 'active', label: 'Active (running, swimming, dance)' },
    { id: 'intense', label: 'Intense (HIIT, martial arts, competitive sport)' },
  ]},
  { field: 'creative', q: 'Creative or analytical?', options: [
    { id: 'very-creative', label: 'Very creative (art, music, writing)' },
    { id: 'mixed', label: 'Mix (cooking, coding, design)' },
    { id: 'very-analytical', label: 'Very analytical (chess, math, research)' },
  ]},
  { field: 'location', q: 'Indoor or outdoor?', options: [
    { id: 'indoor', label: 'Indoor — I like my space' },
    { id: 'outdoor', label: 'Outdoor — fresh air always wins' },
    { id: 'both', label: 'Both — depends on the day' },
  ]},
]

const HOBBY_MAP = {
  'physical-active': ['Football', 'Badminton', 'Swimming', 'Running', 'Martial arts'],
  'physical-intense': ['CrossFit', 'Sprinting', 'Boxing', 'Competitive sports'],
  'physical-cozy': ['Yoga', 'Hiking', 'Cycling', 'Pilates'],
  'creative-indoor': ['Drawing', 'Painting', 'Writing', 'Music production', 'Photography'],
  'creative-outdoor': ['Photography', 'Nature journaling', 'Filmmaking'],
  'intellectual-indoor': ['Chess', 'Coding projects', 'Reading nonfiction'],
  'intellectual-very-analytical': ['Chess', 'Mathematics', 'Coding', 'Astronomy'],
  'cozy-indoor': ['Reading fiction', 'Journaling', 'Cooking', 'Gaming', 'Knitting'],
  'social-moderate': ['Board games', 'Team sports', 'Book club', 'Debate'],
  'intellectual-mixed': ['Coding', 'Language learning', 'Rubik\'s cube', 'Philosophy'],
  'creative-very-creative': ['Drawing', 'Painting', 'Music', 'Creative writing', 'Film'],
}

function getHobbySuggestions(answers) {
  const sug = new Set()
  const { leisure, energy, creative, location } = answers
  const keys = [`${leisure}-${energy}`, `${leisure}-${location}`, `${creative}-${location}`, `intellectual-${creative}`]
  keys.forEach(k => { if (HOBBY_MAP[k]) HOBBY_MAP[k].forEach(h => sug.add(h)) })
  if (sug.size < 4) ['Reading', 'Journaling', 'Drawing', 'Chess', 'Photography', 'Coding'].forEach(h => sug.add(h))
  return [...sug].slice(0, 9)
}

export default function Onboarding({ session, onComplete }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({ name: '', board: 'CBSE', country: 'India', peakTime: 'morning', workStyle: 'sprints', archetype: '', healthFlags: [], hobbyAnswers: { leisure: '', energy: '', creative: '', location: '' }, selectedHobbies: [] })
  const [saving, setSaving] = useState(false)
  const STEPS = 6

  const upd = (k, v) => setData(p => ({ ...p, [k]: v }))

  async function finish() {
    setSaving(true)
    const uid = session.user.id
    const finalHobbies = data.selectedHobbies.length > 0 ? data.selectedHobbies : getHobbySuggestions(data.hobbyAnswers).slice(0, 3)
    await supabase.from('profiles').upsert({ id: uid, name: data.name, archetype: data.archetype, board: data.board, hobby_types: Object.values(data.hobbyAnswers), onboarded: true })
    if (finalHobbies.length > 0) await supabase.from('hobbies').insert(finalHobbies.map(h => ({ user_id: uid, name: h, category: 'other' })))
    setSaving(false)
    onComplete()
  }

  const s = {
    wrap: { minHeight: '100vh', background: 'var(--base-950)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' },
    card: { width: '100%', maxWidth: '560px', background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '20px', padding: '2.5rem' },
    h: { fontFamily: 'var(--font-serif)', fontSize: '28px', fontStyle: 'italic', fontWeight: 400, color: 'var(--cream-200)', marginBottom: '6px' },
    sub: { fontSize: '13px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontWeight: 300, marginBottom: '24px' },
    lbl: { fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px', fontFamily: 'var(--font-sans)' },
    inp: { width: '100%', background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRadius: '12px', padding: '10px 14px', color: 'var(--cream-200)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none' },
    opt: (a) => ({ padding: '10px 14px', borderRadius: '10px', border: `0.5px solid ${a ? 'var(--gold-300)' : 'var(--base-600)'}`, background: a ? 'rgba(201,168,124,0.12)' : 'var(--base-700)', color: a ? 'var(--gold-300)' : 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', textAlign: 'left', transition: 'all 0.15s' }),
    next: { width: '100%', marginTop: '24px', padding: '13px', background: 'var(--gold-300)', border: 'none', borderRadius: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)' },
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        {/* Progress */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Step {step + 1} of {STEPS}</span>
            <span style={{ fontSize: '10px', color: 'var(--gold-300)', fontFamily: 'var(--font-sans)' }}>{Math.round(((step + 1) / STEPS) * 100)}%</span>
          </div>
          <div style={{ height: '3px', background: 'var(--base-700)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--gold-300)', width: `${((step + 1) / STEPS) * 100}%`, transition: 'width 0.3s', borderRadius: '99px' }} />
          </div>
        </div>

        {step === 0 && (
          <div>
            <h2 style={s.h}>welcome to evolve ✦</h2>
            <p style={s.sub}>Three minutes to set this up for you specifically.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={s.lbl}>Your name</label><input value={data.name} onChange={e => upd('name', e.target.value)} placeholder="What should we call you?" style={s.inp} autoFocus /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={s.lbl}>Board / curriculum</label>
                  <select value={data.board} onChange={e => upd('board', e.target.value)} style={s.inp}>
                    {['CBSE','ICSE','IB','A-Levels','SAT/ACT','GCSE','University','Working professional','Other'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div><label style={s.lbl}>Country</label><input value={data.country} onChange={e => upd('country', e.target.value)} placeholder="India, Singapore..." style={s.inp} /></div>
              </div>
            </div>
            <button onClick={() => data.name.trim() && setStep(1)} style={{ ...s.next, opacity: data.name.trim() ? 1 : 0.5 }}>Continue →</button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 style={s.h}>how does your brain work?</h2>
            <p style={s.sub}>No wrong answers — this shapes how EVOLVE plans your days.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={s.lbl}>When do you focus best?</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[{id:'early-morning',label:'Early morning (5–8am)'},{id:'morning',label:'Morning (8–12pm)'},{id:'afternoon',label:'Afternoon (12–5pm)'},{id:'evening',label:'Evening (5–9pm)'},{id:'night',label:'Late night (9pm+)'}].map(t => (
                    <button key={t.id} onClick={() => upd('peakTime', t.id)} style={s.opt(data.peakTime === t.id)}>{t.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={s.lbl}>How do you prefer to work?</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[{id:'sprints',label:'Short intense sprints'},{id:'deep',label:'Long deep sessions'},{id:'flexible',label:'Flexible, mood-based'},{id:'scheduled',label:'Strict schedule'}].map(t => (
                    <button key={t.id} onClick={() => upd('workStyle', t.id)} style={s.opt(data.workStyle === t.id)}>{t.label}</button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => setStep(2)} style={s.next}>Continue →</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={s.h}>what's your pattern?</h2>
            <p style={s.sub}>Pick what resonates. EVOLVE uses this to catch you before you fall.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {ARCHETYPES.map(a => (
                <button key={a.id} onClick={() => upd('archetype', a.id)} style={{ ...s.opt(data.archetype === a.id), padding: '14px' }}>
                  <div style={{ fontSize: '18px', marginBottom: '5px' }}>{a.icon}</div>
                  <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '3px', color: data.archetype === a.id ? 'var(--gold-300)' : 'var(--cream-200)', fontFamily: 'var(--font-sans)' }}>{a.label}</div>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', lineHeight: 1.4, fontFamily: 'var(--font-sans)' }}>{a.desc}</div>
                </button>
              ))}
            </div>
            <button onClick={() => data.archetype && setStep(3)} style={{ ...s.next, opacity: data.archetype ? 1 : 0.5 }}>Continue →</button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={s.h}>any relevant context?</h2>
            <p style={s.sub}>Optional but powerful — EVOLVE uses these to protect streaks and adapt your schedule without judgment.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['ADHD','Iron deficiency','Anxiety','Chronic fatigue','Irregular sleep','Period tracking','Injury / physical limitation','Social anxiety'].map(f => {
                const active = data.healthFlags.includes(f)
                return <button key={f} onClick={() => upd('healthFlags', active ? data.healthFlags.filter(h => h !== f) : [...data.healthFlags, f])} style={s.opt(active)}>{f}</button>
              })}
            </div>
            <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginTop: '12px' }}>Select all that apply — or skip entirely.</p>
            <button onClick={() => setStep(4)} style={s.next}>Continue →</button>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={s.h}>what kind of person are you?</h2>
            <p style={s.sub}>4 quick questions to figure out what hobbies you'll actually enjoy.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxHeight: '50vh', overflowY: 'auto', paddingRight: '4px' }}>
              {HOBBY_QUESTIONS.map((q) => (
                <div key={q.field}>
                  <label style={s.lbl}>{q.q}</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {q.options.map(o => (
                      <button key={o.id} onClick={() => upd('hobbyAnswers', { ...data.hobbyAnswers, [q.field]: o.id })} style={{ ...s.opt(data.hobbyAnswers[q.field] === o.id), padding: '9px 14px' }}>{o.label}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(5)} style={s.next}>See your suggestions →</button>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 style={s.h}>your world, curated ✦</h2>
            <p style={s.sub}>Tap any you want to track. You can add more later.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
              {getHobbySuggestions(data.hobbyAnswers).map(h => {
                const sel = data.selectedHobbies.includes(h)
                return <button key={h} onClick={() => upd('selectedHobbies', sel ? data.selectedHobbies.filter(x => x !== h) : [...data.selectedHobbies, h])} style={{ ...s.opt(sel), padding: '8px 16px' }}>{sel ? '✓ ' : ''}{h}</button>
              })}
            </div>
            <div style={{ background: 'var(--base-700)', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', borderLeft: '3px solid var(--gold-300)' }}>
              <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic', lineHeight: 1.6 }}>
                Archetype identified: <span style={{ color: 'var(--gold-300)', fontWeight: 500 }}>{ARCHETYPES.find(a => a.id === data.archetype)?.label || 'Unique'}</span>. EVOLVE has been configured with specific adaptive protocols for how you work and what derails you.
              </p>
            </div>
            <button onClick={finish} disabled={saving} style={{ ...s.next, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Building your EVOLVE...' : 'Enter EVOLVE ✦'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}