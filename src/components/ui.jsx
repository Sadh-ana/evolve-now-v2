import { useEffect } from 'react'

export const card = (extra = {}) => ({
  background: 'var(--base-800)',
  border: '0.5px solid var(--base-600)',
  borderRadius: 'var(--radius-lg)',
  padding: '1.25rem',
  ...extra,
})

export const label = (extra = {}) => ({
  fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginBottom: '12px', display: 'block',
  ...extra,
})

export const inputStyle = (extra = {}) => ({
  width: '100%', background: 'var(--base-700)', border: '0.5px solid var(--base-600)',
  borderRadius: '10px', padding: '10px 14px', color: 'var(--cream-200)',
  fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box',
  ...extra,
})

export function Button({ children, variant = 'primary', size = 'md', style = {}, ...props }) {
  const sizes = {
    sm: { padding: '6px 14px', fontSize: '11px' },
    md: { padding: '10px 20px', fontSize: '13px' },
    lg: { padding: '14px 32px', fontSize: '14px' },
  }
  const variants = {
    primary: { background: 'var(--gold-300)', color: 'var(--base-950)', border: 'none', fontWeight: 500 },
    secondary: { background: 'transparent', color: 'var(--muted)', border: '0.5px solid var(--base-600)' },
    danger: { background: 'transparent', color: 'var(--rose-300)', border: '0.5px solid var(--rose-300)' },
    ghost: { background: 'transparent', color: 'var(--muted)', border: 'none' },
  }
  return (
    <button
      {...props}
      style={{
        borderRadius: '10px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
        transition: 'all 0.2s', ...sizes[size], ...variants[variant], ...style,
      }}
    >{children}</button>
  )
}

export function Card({ children, style = {}, ...props }) {
  return <div {...props} style={card(style)}>{children}</div>
}

export function Modal({ open, onClose, title, children, maxWidth = '440px' }) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', animation: 'fadeIn 0.2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth, maxHeight: '85vh', overflowY: 'auto', animation: 'modalIn 0.25s cubic-bezier(0.34,1.2,0.64,1)' }}>
        {title && <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '20px' }}>{title}</h3>}
        {children}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalIn { from { opacity: 0; transform: translateY(12px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  )
}

export function LoadingState({ message = 'loading...' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '32px', height: '32px', margin: '0 auto 14px', borderRadius: '50%', border: '2px solid var(--base-600)', borderTopColor: 'var(--gold-300)', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-serif)', fontSize: '16px', fontStyle: 'italic' }}>{message}</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export function EmptyState({ icon = '✦', title, description, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 24px' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px', color: 'var(--gold-300)', opacity: 0.6 }}>{icon}</div>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic', color: 'var(--gold-300)', marginBottom: '8px' }}>{title}</p>
      {description && <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)', maxWidth: '320px', margin: '0 auto', lineHeight: 1.6 }}>{description}</p>}
      {action && <div style={{ marginTop: '20px' }}>{action}</div>}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', description = 'Please try again, or refresh the page.', onRetry }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 24px' }}>
      <div style={{ fontSize: '28px', marginBottom: '12px', color: 'var(--rose-300)' }}>◐</div>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontStyle: 'italic', color: 'var(--rose-300)', marginBottom: '8px' }}>{title}</p>
      <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)', maxWidth: '320px', margin: '0 auto', lineHeight: 1.6 }}>{description}</p>
      {onRetry && (
        <div style={{ marginTop: '20px' }}>
          <Button onClick={onRetry} variant="secondary">Try again</Button>
        </div>
      )}
    </div>
  )
}

// Global error boundary
export class ErrorBoundary extends Error {}