import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth({ onBack }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
      if (error) setError(error.message)
      else {
        if (data.user) await supabase.from('profiles').insert({ id: data.user.id, name, onboarded: false })
        setMessage('Account created! Sign in to continue.')
        setMode('login')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '0.5px solid rgba(201,168,124,0.15)',
    borderRadius: '12px',
    padding: '13px 16px',
    color: '#e8d5c0',
    fontSize: '14px',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '10px',
    color: '#8a7060',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    marginBottom: '8px',
    fontFamily: 'var(--font-sans)',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0e0a06',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative',
    }}>

      {/* Background glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 40%, rgba(201,168,124,0.06) 0%, transparent 70%)',
      }} />

      {/* Back button */}
      {onBack && (
        <button onClick={onBack} style={{
          position: 'absolute', top: '24px', left: '32px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#8a7060', fontFamily: 'var(--font-sans)', fontSize: '12px',
          display: 'flex', alignItems: 'center', gap: '6px',
          letterSpacing: '0.06em', transition: 'color 0.2s',
          zIndex: 10,
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#c9a87c'}
          onMouseLeave={e => e.currentTarget.style.color = '#8a7060'}
        >← back</button>
      )}

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontFamily: 'Georgia, serif',
            fontSize: '52px',
            fontWeight: 400,
            fontStyle: 'italic',
            color: '#f0e6d8',
            marginBottom: '6px',
          }}>evolve</h1>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '10px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#8a7060',
            fontWeight: 300,
          }}>your life OS</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '0.5px solid rgba(201,168,124,0.12)',
          borderRadius: '20px',
          padding: '2rem',
          backdropFilter: 'blur(12px)',
        }}>

          {/* Mode toggle */}
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
            padding: '3px',
            marginBottom: '28px',
            border: '0.5px solid rgba(255,255,255,0.05)',
          }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null); setMessage(null) }} style={{
                flex: 1,
                padding: '9px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                fontWeight: 500,
                transition: 'all 0.2s',
                background: mode === m ? 'rgba(201,168,124,0.15)' : 'transparent',
                color: mode === m ? '#c9a87c' : '#8a7060',
              }}>
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'signup' && (
              <div>
                <label style={labelStyle}>Your name</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your name" required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(201,168,124,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(201,168,124,0.15)'}
                />
              </div>
            )}
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(201,168,124,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(201,168,124,0.15)'}
              />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="········" required style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(201,168,124,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(201,168,124,0.15)'}
              />
            </div>

            {error && (
              <div style={{ color: '#d4a5a5', fontSize: '12px', background: 'rgba(212,165,165,0.08)', padding: '12px 16px', borderRadius: '10px', border: '0.5px solid rgba(212,165,165,0.2)', fontFamily: 'var(--font-sans)' }}>
                {error}
              </div>
            )}
            {message && (
              <div style={{ color: '#c9a87c', fontSize: '12px', background: 'rgba(201,168,124,0.08)', padding: '12px 16px', borderRadius: '10px', border: '0.5px solid rgba(201,168,124,0.2)', fontFamily: 'var(--font-sans)' }}>
                {message}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%',
                background: loading ? 'rgba(201,168,124,0.4)' : '#c9a87c',
                color: '#0e0a06',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '4px',
                transition: 'all 0.2s',
                letterSpacing: '0.03em',
              }}
              onMouseEnter={e => { if (!loading) e.target.style.background = '#e8c97e' }}
              onMouseLeave={e => { if (!loading) e.target.style.background = '#c9a87c' }}
            >
              {loading ? 'please wait...' : mode === 'login' ? 'Sign in ✦' : 'Create account ✦'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#8a7060', fontSize: '11px', marginTop: '24px', fontWeight: 300, fontFamily: 'var(--font-sans)' }}>
          your growth, organised ✦
        </p>
      </div>
    </div>
  )
}