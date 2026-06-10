import { useState } from 'react'

const DIMS = [
  { label: 'Academic', color: '#c9a87c', key: 'academic' },
  { label: 'Physical', color: '#d4a5a5', key: 'physical' },
  { label: 'Mental', color: '#9eb5d4', key: 'mental' },
  { label: 'Creative', color: '#a8c4a0', key: 'creative' },
  { label: 'Social', color: '#d4b8a0', key: 'social' },
  { label: 'Spiritual', color: '#b8a8d4', key: 'spiritual' },
  { label: 'Financial', color: '#7fc4b0', key: 'financial' },
  { label: 'Fun', color: '#e8c4c4', key: 'fun' },
]

const N = DIMS.length
const CX = 160, CY = 160, R = 130

function angle(i) { return (i / N) * Math.PI * 2 - Math.PI / 2 }
function pt(i, val, maxR = R) {
  const r = (val / 10) * maxR
  return { x: CX + Math.cos(angle(i)) * r, y: CY + Math.sin(angle(i)) * r }
}
function outerPt(i) { return pt(i, 10) }

export default function LifeBalanceWheel({ compact = false }) {
  const [values, setValues] = useState({ academic: 5, physical: 5, mental: 5, creative: 5, social: 5, spiritual: 5, financial: 5, fun: 5 })
  const [hoveredDim, setHoveredDim] = useState(null)

  const polyPts = DIMS.map((d, i) => {
    const v = values[d.key]
    const p = pt(i, v)
    return `${p.x},${p.y}`
  }).join(' ')

  const total = Object.values(values).reduce((a, b) => a + b, 0)
  const avg = (total / N).toFixed(1)

  return (
    <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '14px', padding: compact ? '1rem' : '1.5rem' }}>
      {!compact && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginBottom: '4px' }}>Life Balance Wheel</p>
          <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>Drag the sliders to rate each dimension 1–10</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* SVG Radar */}
        <svg width="320" height="320" viewBox="0 0 320 320" style={{ flexShrink: 0 }}>
          {/* Grid rings */}
          {[2, 4, 6, 8, 10].map(ring => (
            <polygon key={ring} points={DIMS.map((_, i) => { const p = pt(i, ring); return `${p.x},${p.y}` }).join(' ')}
              fill="none" stroke="rgba(201,168,124,0.08)" strokeWidth="1" />
          ))}

          {/* Axis lines */}
          {DIMS.map((_, i) => {
            const op = outerPt(i)
            return <line key={i} x1={CX} y1={CY} x2={op.x} y2={op.y} stroke="rgba(201,168,124,0.1)" strokeWidth="1" />
          })}

          {/* Filled polygon */}
          <polygon points={polyPts} fill="rgba(201,168,124,0.15)" stroke="rgba(201,168,124,0.7)" strokeWidth="2" strokeLinejoin="round" />

          {/* Data points */}
          {DIMS.map((d, i) => {
            const v = values[d.key]
            const p = pt(i, v)
            return (
              <circle key={i} cx={p.x} cy={p.y} r={hoveredDim === d.key ? 6 : 4}
                fill={d.color} stroke="var(--base-800)" strokeWidth="2"
                style={{ transition: 'r 0.2s', cursor: 'pointer' }}
                onMouseEnter={() => setHoveredDim(d.key)}
                onMouseLeave={() => setHoveredDim(null)} />
            )
          })}

          {/* Labels */}
          {DIMS.map((d, i) => {
            const op = outerPt(i)
            const labelR = R + 22
            const lx = CX + Math.cos(angle(i)) * labelR
            const ly = CY + Math.sin(angle(i)) * labelR
            return (
              <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                style={{ fontSize: '10px', fill: hoveredDim === d.key ? d.color : 'rgba(138,112,96,0.8)', fontFamily: 'var(--font-sans)', fontWeight: hoveredDim === d.key ? 600 : 400, transition: 'fill 0.2s' }}>
                {d.label}
              </text>
            )
          })}

          {/* Center score */}
          <text x={CX} y={CY - 8} textAnchor="middle" style={{ fontSize: '22px', fill: 'var(--gold-300)', fontFamily: 'var(--font-serif)' }}>{avg}</text>
          <text x={CX} y={CY + 12} textAnchor="middle" style={{ fontSize: '9px', fill: 'var(--muted)', fontFamily: 'var(--font-sans)', letterSpacing: '0.08em' }}>AVG</text>
        </svg>

        {/* Sliders */}
        {!compact && (
          <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {DIMS.map(d => (
              <div key={d.key} onMouseEnter={() => setHoveredDim(d.key)} onMouseLeave={() => setHoveredDim(null)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: hoveredDim === d.key ? d.color : 'var(--cream-300)', fontFamily: 'var(--font-sans)', transition: 'color 0.2s' }}>{d.label}</span>
                  <span style={{ fontSize: '11px', color: d.color, fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{values[d.key]}</span>
                </div>
                <input type="range" min={1} max={10} value={values[d.key]}
                  onChange={e => setValues(p => ({ ...p, [d.key]: parseInt(e.target.value) }))}
                  style={{ width: '100%', accentColor: d.color, height: '3px', cursor: 'pointer' }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}