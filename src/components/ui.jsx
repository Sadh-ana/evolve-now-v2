import { useEffect, useRef, useState } from 'react'

// ── Design tokens ──────────────────────────────────────────────
export const cardStyle = (extra = {}) => ({
  background: 'var(--base-800)',
  border: '0.5px solid var(--base-600)',
  borderRadius: 'var(--radius-lg)',
  padding: '1.25rem',
  ...extra,
})

export const labelStyle = {
  fontSize: '9px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  fontFamily: 'var(--font-sans)',
  marginBottom: '8px',
  display: 'block',
}

export const inputStyle = {
  width: '100%',
  background: 'var(--base-700)',
  border: '0.5px solid var(--base-600)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 14px',
  color: 'var(--cream-200)',
  fontSize: '13px',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}

// ── Card ───────────────────────────────────────────────────────
export function Card({ children, style = {}, ...props }) {
  return (
    <div {...props} style={cardStyle(style)}>
      {children}
    </div>
  )
}

// ── Button ─────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', style = {}, ...props }) {
  const sizes = {
    sm: { padding: '6px 14px', fontSize: '11px' },
    md: { padding: '10px 20px', fontSize: '13px' },
    lg: { padding: '14px 32px', fontSize: '14px' },
  }
  const variants = {
    primary:   { background: 'var(--gold-300)', color: 'var(--base-950)', border: 'none', fontWeight: 500 },
    secondary: { background: 'transparent', color: 'var(--muted)', border: '0.5px solid var(--base-600)' },
    danger:    { background: 'transparent', color: 'var(--rose-300)', border: '0.5px solid var(--rose-300)' },
    ghost:     { background: 'transparent', color: 'var(--muted)', border: 'none' },
  }
  return (
    <button
      {...props}
      style={{
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        transition: 'all 0.2s',
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  )
}

// ── Modal with focus trap ──────────────────────────────────────
export function Modal({ open, onClose, title, children, maxWidth = '480px' }) {
  const overlayRef = useRef(null)
  const contentRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement
      setTimeout(() => {
        const focusable = contentRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        focusable?.[0]?.focus()
      }, 50)
    } else {
      triggerRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      const focusable = Array.from(
        contentRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) || []
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last  = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px',
        animation: 'fadeIn 0.2s ease',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        ref={contentRef}
        style={{
          background: 'var(--base-800)',
          border: '0.5px solid var(--base-600)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          width: '100%',
          maxWidth,
          maxHeight: '85vh',
          overflowY: 'auto',
          animation: 'modalIn 0.25s cubic-bezier(0.34,1.2,0.64,1)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        {title && (
          <h3 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '24px',
            fontStyle: 'italic',
            color: 'var(--cream-200)',
            marginBottom: '20px',
            fontWeight: 400,
          }}>
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  )
}

// ── LoadingState ───────────────────────────────────────────────
export function LoadingState({ message = 'loading...' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', flexDirection: 'column', gap: '16px',
    }}>
      <div style={{
        width: '32px', height: '32px',
        borderRadius: '50%',
        border: '2px solid var(--base-600)',
        borderTopColor: 'var(--gold-300)',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{
        color: 'var(--muted)',
        fontFamily: 'var(--font-serif)',
        fontSize: '16px',
        fontStyle: 'italic',
      }}>
        {message}
      </p>
    </div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────
export function Skeleton({ width = '100%', height = '20px', style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  )
}

export function PageSkeleton() {
  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      <Skeleton height="40px" width="280px" style={{ marginBottom: '8px' }} />
      <Skeleton height="16px" width="180px" style={{ marginBottom: '32px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px', marginBottom: '14px' }}>
        <Skeleton height="180px" />
        <Skeleton height="180px" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
        <Skeleton height="200px" />
        <Skeleton height="200px" />
        <Skeleton height="200px" />
      </div>
    </div>
  )
}

// ── EmptyState ─────────────────────────────────────────────────
export function EmptyState({ icon = '✦', title, description, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 24px' }}>
      <div style={{
        fontSize: '36px', marginBottom: '16px',
        color: 'var(--gold-300)', opacity: 0.5,
        animation: 'float 3s ease-in-out infinite',
      }}>
        {icon}
      </div>
      <p style={{
        fontFamily: 'var(--font-serif)', fontSize: '24px',
        fontStyle: 'italic', color: 'var(--gold-300)', marginBottom: '8px',
      }}>
        {title}
      </p>
      {description && (
        <p style={{
          color: 'var(--muted)', fontSize: '13px',
          fontFamily: 'var(--font-sans)',
          maxWidth: '320px', margin: '0 auto', lineHeight: 1.7,
        }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: '20px' }}>{action}</div>}
    </div>
  )
}

// ── ErrorState ─────────────────────────────────────────────────
export function ErrorState({ title = 'Something went wrong', description, onRetry }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 24px' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px', color: 'var(--rose-300)' }}>◐</div>
      <p style={{
        fontFamily: 'var(--font-serif)', fontSize: '22px',
        fontStyle: 'italic', color: 'var(--rose-300)', marginBottom: '8px',
      }}>
        {title}
      </p>
      {description && (
        <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)', maxWidth: '320px', margin: '0 auto', lineHeight: 1.6 }}>
          {description}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          style={{ marginTop: '20px', padding: '10px 24px', background: 'transparent', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--muted)' }}
        >
          Try again
        </button>
      )}
    </div>
  )
}

// ── Confetti burst hook ────────────────────────────────────────
export function useConfetti() {
  const [particles, setParticles] = useState([])

  function burst(x, y) {
    const colors = ['#c9a87c', '#d4a5a5', '#9eb5d4', '#a8c4a0', '#b8a8d4']
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x, y,
      color: colors[i % colors.length],
      angle: (i / 12) * 360,
      distance: 40 + Math.random() * 40,
    }))
    setParticles(newParticles)
    setTimeout(() => setParticles([]), 700)
  }

  const ConfettiLayer = () => (
    <>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'fixed',
            left: p.x,
            top: p.y,
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: p.color,
            pointerEvents: 'none',
            zIndex: 9999,
            animation: 'confettiBurst 0.6s ease-out forwards',
            transform: `rotate(${p.angle}deg)`,
            transformOrigin: `${p.distance}px 0`,
          }}
        />
      ))}
    </>
  )

  return { burst, ConfettiLayer }
}