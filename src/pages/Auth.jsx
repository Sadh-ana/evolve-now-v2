import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
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
        if (data.user) await supabase.from('profiles').insert({ id: data.user.id, name })
        setMessage('Account created! You can now log in.')
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
    background: 'var(--base-700)',
    border: '0.5px solid var(--base-600)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    color: 'var(--cream-200)',
    fontSize: '14px',
    fontFamily: 'var(--font-sans)',
    outline: 'none'
  }

  const labelStyle = {
    display: 'block',
    fontSize: '10px',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '8px'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--base-950)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '52px',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--cream-200)',
            marginBottom: '6px'
          }}>evolve</h1>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            fontWeight: 300
          }}>your life OS</p>
        </div>

        <div style={{
          background: 'var(--base-800)',
          border: '0.5px solid var(--base-600)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem'
        }}>
          <div style={{
            display: 'flex',
            background: 'var(--base-700)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            marginBottom: '2rem'
          }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1,
                padding: '8px',
                borderRadius: '9px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s',
                background: mode === m ? 'var(--base-900)' : 'transparent',
                color: mode === m ? 'var(--cream-200)' : 'var(--muted)',
              }}>
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mode === 'signup' && (
              <div>
                <label style={labelStyle}>Your name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Sadhana" required style={inputStyle} />
              </div>
            )}
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="········" required style={inputStyle} />
            </div>

            {error && (
              <p style={{ color: 'var(--rose-300)', fontSize: '12px', background: 'var(--base-700)', padding: '12px 16px', borderRadius: '8px' }}>
                {error}
              </p>
            )}
            {message && (
              <p style={{ color: 'var(--gold-300)', fontSize: '12px', background: 'var(--base-700)', padding: '12px 16px', borderRadius: '8px' }}>
                {message}
              </p>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%',
              background: 'var(--gold-300)',
              color: 'var(--base-950)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '13px',
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              marginTop: '4px',
              transition: 'opacity 0.2s'
            }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '11px', marginTop: '1.5rem', fontWeight: 300 }}>
          your growth, organised.
        </p>
      </div>
    </div>
  )
}