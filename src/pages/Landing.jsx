import { useEffect, useRef, useState } from 'react'

const WORDS = ['focus', 'grow', 'evolve', 'build', 'rest', 'create', 'win']

const FEATURES = [
  { icon: '◈', title: 'Brainstorm', desc: 'Obsidian-style canvas. Map startups, fitness plans, wild ideas — anything your brain throws at you.', color: '#c9a87c' },
  { icon: '◷', title: 'Deep Focus', desc: 'Warmup → peak → cooldown. Every session tracked with post-session emotion data.', color: '#9eb5d4' },
  { icon: '✦', title: 'Habit Engine', desc: 'Streak protection. Recovery skips. Burnout detection. No shame spirals — ever.', color: '#a8c4a0' },
  { icon: '♡', title: 'Side Quests', desc: 'AI-powered hobby guides matched to your personality. Every interest gets a home.', color: '#d4a5a5' },
  { icon: '◑', title: 'Health OS', desc: 'Nutrition, sleep, cycle, illness — all adaptive. Built for your body, not a generic template.', color: '#b8a8d4' },
  { icon: '∿', title: 'Pattern Stats', desc: 'Mood trends, focus hours, habit rates. See who you\'re becoming in real numbers.', color: '#7fc4b0' },
]

function FlowCanvas() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const mouseRef = useRef({ x: -999, y: -999 })
  const tRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const onMouse = e => { mouseRef.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', onMouse)

    // Orbs
    const orbs = [
      { x: 0.3, y: 0.4, r: 320, color: [201, 168, 124], phase: 0, spd: 0.18 },
      { x: 0.7, y: 0.3, r: 280, color: [158, 181, 212], phase: 1.2, spd: 0.14 },
      { x: 0.5, y: 0.7, r: 350, color: [212, 165, 165], phase: 2.4, spd: 0.11 },
      { x: 0.15, y: 0.6, r: 240, color: [168, 196, 160], phase: 3.6, spd: 0.16 },
      { x: 0.85, y: 0.65, r: 260, color: [184, 168, 212], phase: 4.8, spd: 0.13 },
    ].map(o => ({ ...o, vx: 0, vy: 0, cx: o.x, cy: o.y }))

    // Particles
    const particles = Array.from({ length: 140 }, () => {
      const hues = [[201,168,124], [158,181,212], [212,165,165], [168,196,160]]
      const h = hues[Math.floor(Math.random() * hues.length)]
      return {
        x: Math.random(), y: Math.random(),
        vx: (Math.random() - 0.5) * 0.0003,
        vy: (Math.random() - 0.5) * 0.0003,
        size: Math.random() * 1.8 + 0.3,
        op: Math.random() * 0.5 + 0.1,
        pulse: Math.random() * Math.PI * 2,
        color: h,
      }
    })

    // Lines (flowing curves)
    const lines = Array.from({ length: 8 }, (_, i) => ({
      points: Array.from({ length: 6 }, (_, j) => ({
        x: j / 5, y: 0.2 + Math.random() * 0.6,
        vy: (Math.random() - 0.5) * 0.0005,
      })),
      phase: i * 0.7,
      color: [[201,168,124],[158,181,212],[212,165,165]][i % 3],
      opacity: 0.04 + Math.random() * 0.06,
    }))

    function draw() {
      const W = canvas.width, H = canvas.height
      tRef.current += 0.007
      const t = tRef.current
      const mx = mouseRef.current.x / W
      const my = mouseRef.current.y / H

      ctx.clearRect(0, 0, W, H)

      // Orbs
      orbs.forEach((orb, i) => {
        const tx = orb.x + Math.sin(t * orb.spd + orb.phase) * 0.18 + Math.cos(t * orb.spd * 0.7) * 0.08
        const ty = orb.y + Math.cos(t * orb.spd + orb.phase) * 0.14 + Math.sin(t * orb.spd * 0.5) * 0.06

        // Mouse pull
        const mdx = mx - tx, mdy = my - ty
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy)
        const pull = mdist < 0.35 ? (0.35 - mdist) * 0.12 : 0

        const fx = tx + mdx * pull
        const fy = ty + mdy * pull

        const cx = fx * W, cy = fy * H
        const pulse = orb.r * (0.85 + Math.sin(t * 0.4 + orb.phase) * 0.15)

        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulse)
        const [r, g2, b] = orb.color
        g.addColorStop(0, `rgba(${r},${g2},${b},0.12)`)
        g.addColorStop(0.4, `rgba(${r},${g2},${b},0.06)`)
        g.addColorStop(0.7, `rgba(${r},${g2},${b},0.02)`)
        g.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(cx, cy, pulse, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
      })

      // Flowing lines
      lines.forEach(line => {
        line.points.forEach(pt => {
          pt.y += pt.vy + Math.sin(t * 0.3 + pt.x * 4 + line.phase) * 0.0004
          if (pt.y < 0.05) pt.vy = Math.abs(pt.vy)
          if (pt.y > 0.95) pt.vy = -Math.abs(pt.vy)
        })

        ctx.beginPath()
        const [r, g, b] = line.color
        ctx.strokeStyle = `rgba(${r},${g},${b},${line.opacity})`
        ctx.lineWidth = 1

        const pts = line.points
        ctx.moveTo(pts[0].x * W, pts[0].y * H)
        for (let i = 1; i < pts.length - 1; i++) {
          const cpx = ((pts[i].x + pts[i + 1].x) / 2) * W
          const cpy = ((pts[i].y + pts[i + 1].y) / 2) * H
          ctx.quadraticCurveTo(pts[i].x * W, pts[i].y * H, cpx, cpy)
        }
        ctx.stroke()
      })

      // Particles + connections
      particles.forEach(p => {
        p.pulse += 0.022
        p.x += p.vx + Math.sin(t * 0.4 + p.pulse) * 0.00012
        p.y += p.vy + Math.cos(t * 0.3 + p.pulse) * 0.00010
        if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0
        if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0

        // Mouse repulsion
        const dx = p.x - mx, dy = p.y - my
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < 0.12) { p.x += dx * 0.006; p.y += dy * 0.006 }

        const px = p.x * W, py = p.y * H
        const op = p.op * (0.4 + Math.sin(p.pulse) * 0.6)
        const [r, g, b] = p.color
        ctx.beginPath()
        ctx.arc(px, py, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${op})`
        ctx.fill()
      })

      // Connections between nearby particles
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < particles.length; i += 2) {
        for (let j = i + 1; j < particles.length; j += 2) {
          const dx = (particles[i].x - particles[j].x) * W
          const dy = (particles[i].y - particles[j].y) * H
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            const [r, g, b] = particles[i].color
            ctx.beginPath()
            ctx.moveTo(particles[i].x * W, particles[i].y * H)
            ctx.lineTo(particles[j].x * W, particles[j].y * H)
            ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - dist / 100) * 0.06})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      ctx.restore()

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
}

function MagneticButton({ children, onClick, primary, style = {} }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)

  function onMouseMove(e) {
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    setPos({ x: (e.clientX - cx) * 0.3, y: (e.clientY - cy) * 0.3 })
  }

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPos({ x: 0, y: 0 }) }}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px) scale(${hovered ? 1.06 : 1})`,
        transition: hovered ? 'transform 0.15s ease' : 'transform 0.4s ease',
        padding: primary ? '15px 40px' : '15px 40px',
        background: primary ? '#c9a87c' : 'transparent',
        border: primary ? 'none' : '0.5px solid rgba(201,168,124,0.35)',
        borderRadius: '99px',
        color: primary ? '#0e0a06' : '#8a7060',
        fontFamily: 'var(--font-sans)',
        fontSize: '14px',
        fontWeight: primary ? 600 : 400,
        cursor: 'pointer',
        letterSpacing: '0.04em',
        boxShadow: primary && hovered ? '0 0 60px rgba(201,168,124,0.35), 0 0 120px rgba(201,168,124,0.15)' : primary ? '0 0 40px rgba(201,168,124,0.2)' : 'none',
        ...style,
      }}
    >{children}</button>
  )
}

function ScrollReveal({ children, delay = 0 }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(32px)',
      transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`,
    }}>{children}</div>
  )
}

export default function Landing({ onEnter }) {
  const [wordIdx, setWordIdx] = useState(0)
  const [wordVisible, setWordVisible] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [hoveredFeature, setHoveredFeature] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const iv = setInterval(() => {
      setWordVisible(false)
      setTimeout(() => { setWordIdx(i => (i + 1) % WORDS.length); setWordVisible(true) }, 450)
    }, 2200)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50)
    const m = e => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('scroll', h)
    window.addEventListener('mousemove', m)
    return () => { window.removeEventListener('scroll', h); window.removeEventListener('mousemove', m) }
  }, [])

  const parallax = (strength = 20) => ({
    transform: `translate(${(mousePos.x / window.innerWidth - 0.5) * strength}px, ${(mousePos.y / window.innerHeight - 0.5) * strength}px)`,
    transition: 'transform 0.8s ease',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#080604', color: '#e8d5c0', fontFamily: 'var(--font-sans)', overflowX: 'hidden' }}>
      <FlowCanvas />

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '18px 52px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: scrolled ? 'rgba(8,6,4,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '0.5px solid rgba(201,168,124,0.08)' : 'none',
        transition: 'all 0.5s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c9a87c', boxShadow: '0 0 12px rgba(201,168,124,0.8)', animation: 'orbPulse 2s ease-in-out infinite' }} />
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontStyle: 'italic', fontWeight: 400, color: '#f0e6d8', letterSpacing: '0.02em' }}>evolve</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={onEnter} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8a7060', fontFamily: 'var(--font-sans)', fontSize: '13px', padding: '8px 16px', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = '#c9a87c'}
            onMouseLeave={e => e.target.style.color = '#8a7060'}
          >Sign in</button>
          <MagneticButton onClick={onEnter} primary style={{ padding: '9px 22px', fontSize: '13px' }}>Get started ✦</MagneticButton>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px', paddingTop: '80px' }}>

        {/* Floating badge */}
        <div style={{ ...parallax(8), marginBottom: '28px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 18px', borderRadius: '99px', background: 'rgba(201,168,124,0.08)', border: '0.5px solid rgba(201,168,124,0.2)' }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#c9a87c', animation: 'orbPulse 1.5s infinite' }} />
          <span style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c9a87c80', fontFamily: 'var(--font-sans)' }}>your life operating system</span>
        </div>

        {/* Main headline */}
        <div style={{ ...parallax(12), marginBottom: '0' }}>
          <h1 style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(48px, 7.5vw, 108px)',
            fontWeight: 400, fontStyle: 'italic',
            color: '#f0e6d8', lineHeight: 1.0,
            marginBottom: '8px',
            textShadow: '0 0 80px rgba(201,168,124,0.1)',
          }}>
            built to help you
          </h1>

          {/* Morphing word */}
          <div style={{ height: 'clamp(52px, 8vw, 108px)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
            <span style={{
              fontFamily: 'Georgia, serif',
              fontSize: 'clamp(48px, 7.5vw, 108px)',
              fontWeight: 400, fontStyle: 'italic',
              background: 'linear-gradient(135deg, #c9a87c, #d4a5a5, #9eb5d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              opacity: wordVisible ? 1 : 0,
              transform: wordVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
              transition: 'all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
              display: 'inline-block',
              lineHeight: 1.0,
              filter: wordVisible ? 'blur(0px)' : 'blur(4px)',
            }}>{WORDS[wordIdx]}</span>
          </div>
        </div>

        <div style={{ ...parallax(6) }}>
          <p style={{ fontSize: 'clamp(14px, 1.8vw, 17px)', color: 'rgba(138,112,96,0.85)', fontWeight: 300, maxWidth: '520px', lineHeight: 1.85, marginBottom: '48px', margin: '0 auto 48px' }}>
            EVOLVE adapts to your personality, catches burnout before you crash, and builds itself around how your brain actually works — not how productivity gurus think it should.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <MagneticButton onClick={onEnter} primary>Start for free ✦</MagneticButton>
            <MagneticButton onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>See how it works</MagneticButton>
          </div>
        </div>

        {/* Floating cards */}
        <div style={{ position: 'absolute', left: '5%', top: '25%', ...parallax(-15), opacity: 0.6, animation: 'float1 6s ease-in-out infinite' }}>
          <div style={{ background: 'rgba(201,168,124,0.06)', border: '0.5px solid rgba(201,168,124,0.15)', borderRadius: '12px', padding: '12px 16px', backdropFilter: 'blur(8px)', whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: '9px', color: '#c9a87c', fontFamily: 'var(--font-sans)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Focus streak</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'italic', color: '#f0e6d8' }}>14 days</div>
          </div>
        </div>

        <div style={{ position: 'absolute', right: '5%', top: '30%', ...parallax(-12), opacity: 0.55, animation: 'float2 7s ease-in-out infinite' }}>
          <div style={{ background: 'rgba(158,181,212,0.06)', border: '0.5px solid rgba(158,181,212,0.15)', borderRadius: '12px', padding: '12px 16px', backdropFilter: 'blur(8px)', whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: '9px', color: '#9eb5d4', fontFamily: 'var(--font-sans)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Brain state</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontStyle: 'italic', color: '#f0e6d8' }}>Peak focus ✦</div>
          </div>
        </div>

        <div style={{ position: 'absolute', left: '8%', bottom: '20%', ...parallax(-10), opacity: 0.5, animation: 'float3 8s ease-in-out infinite' }}>
          <div style={{ background: 'rgba(212,165,165,0.06)', border: '0.5px solid rgba(212,165,165,0.15)', borderRadius: '12px', padding: '12px 16px', backdropFilter: 'blur(8px)', whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: '9px', color: '#d4a5a5', fontFamily: 'var(--font-sans)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Recovery skip</div>
            <div style={{ fontSize: '12px', color: '#d4a5a5', fontFamily: 'var(--font-sans)' }}>Streak protected ◑</div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: '36px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', animation: 'scrollBounce 2.5s ease-in-out infinite' }}>
          <div style={{ width: '20px', height: '32px', borderRadius: '10px', border: '0.5px solid rgba(201,168,124,0.3)', display: 'flex', justifyContent: 'center', paddingTop: '6px' }}>
            <div style={{ width: '2px', height: '8px', borderRadius: '99px', background: '#c9a87c', animation: 'scrollDot 2.5s ease-in-out infinite' }} />
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div id="features" style={{ position: 'relative', zIndex: 1, padding: '140px 52px 100px', maxWidth: '1200px', margin: '0 auto' }}>
        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <p style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(138,112,96,0.6)', marginBottom: '20px', fontFamily: 'var(--font-sans)' }}>everything in one place</p>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(32px, 5vw, 64px)', fontStyle: 'italic', fontWeight: 400, color: '#f0e6d8', lineHeight: 1.1 }}>built for real humans</h2>
          </div>
        </ScrollReveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
          {FEATURES.map((f, i) => (
            <ScrollReveal key={i} delay={i * 0.08}>
              <div
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
                style={{
                  background: hoveredFeature === i ? `rgba(${f.color === '#c9a87c' ? '201,168,124' : f.color === '#9eb5d4' ? '158,181,212' : f.color === '#a8c4a0' ? '168,196,160' : f.color === '#d4a5a5' ? '212,165,165' : f.color === '#b8a8d4' ? '184,168,212' : '127,196,176'},0.07)` : 'rgba(255,255,255,0.02)',
                  border: `0.5px solid ${hoveredFeature === i ? f.color + '44' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: '18px', padding: '32px',
                  transition: 'all 0.35s cubic-bezier(0.34, 1.2, 0.64, 1)',
                  transform: hoveredFeature === i ? 'translateY(-6px) scale(1.01)' : 'translateY(0) scale(1)',
                  cursor: 'default',
                  position: 'relative', overflow: 'hidden',
                }}>

                {/* Glow on hover */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                  background: hoveredFeature === i ? `linear-gradient(90deg, transparent, ${f.color}66, transparent)` : 'transparent',
                  transition: 'all 0.4s ease',
                }} />

                <div style={{ fontSize: '28px', marginBottom: '18px', color: f.color, filter: hoveredFeature === i ? `drop-shadow(0 0 12px ${f.color}88)` : 'none', transition: 'filter 0.3s' }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'italic', color: '#e8d5c0', marginBottom: '10px', fontWeight: 400 }}>{f.title}</h3>
                <p style={{ fontSize: '13px', color: 'rgba(138,112,96,0.8)', lineHeight: 1.75, fontWeight: 300 }}>{f.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* QUOTE SECTION */}
      <div style={{ position: 'relative', zIndex: 1, padding: '100px 52px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(201,168,124,0.04) 0%, rgba(158,181,212,0.03) 50%, rgba(212,165,165,0.04) 100%)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '0.5px', background: 'linear-gradient(90deg, transparent, rgba(201,168,124,0.2), transparent)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '0.5px', background: 'linear-gradient(90deg, transparent, rgba(201,168,124,0.2), transparent)' }} />

        <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <ScrollReveal>
            <p style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(138,112,96,0.5)', marginBottom: '28px' }}>adaptive by design</p>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(26px, 4vw, 52px)', fontStyle: 'italic', fontWeight: 400, color: '#f0e6d8', lineHeight: 1.35, marginBottom: '28px' }}>
              "EVOLVE notices when you're burning out<br />before you do."
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(138,112,96,0.75)', lineHeight: 1.95, fontWeight: 300, marginBottom: '60px', maxWidth: '600px', margin: '0 auto 60px' }}>
              Flag a sick day, a low-focus day, a period day — and EVOLVE protects your streaks without judgment. Your archetype shapes everything. No two setups look the same.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div style={{ display: 'flex', gap: '48px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { val: '7+', label: 'Personality archetypes' },
                { val: '11', label: 'Life modules' },
                { val: '∞', label: 'AI-powered guides' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: 'Georgia, serif', fontSize: '56px', fontStyle: 'italic',
                    background: 'linear-gradient(135deg, #c9a87c, #d4a5a5)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text', lineHeight: 1,
                  }}>{s.val}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(138,112,96,0.6)', marginTop: '8px', letterSpacing: '0.08em', fontFamily: 'var(--font-sans)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* CTA */}
      <div style={{ position: 'relative', zIndex: 1, padding: '140px 52px', textAlign: 'center' }}>
        <ScrollReveal>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'inline-flex', gap: '6px', marginBottom: '32px' }}>
              {['◈', '✦', '◑', '◷', '♡', '∿'].map((icon, i) => (
                <span key={i} style={{ fontSize: '14px', color: '#c9a87c', opacity: 0.3 + i * 0.12, animation: `orbPulse ${1.5 + i * 0.3}s ease-in-out infinite` }}>{icon}</span>
              ))}
            </div>
          </div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(40px, 7vw, 88px)', fontStyle: 'italic', fontWeight: 400, color: '#f0e6d8', marginBottom: '18px', lineHeight: 1.05 }}>
            ready to evolve?
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(138,112,96,0.7)', marginBottom: '52px', fontWeight: 300 }}>3 minutes to set up. Adapts to you forever.</p>
          <MagneticButton onClick={onEnter} primary style={{ padding: '18px 56px', fontSize: '15px', boxShadow: '0 0 80px rgba(201,168,124,0.25), 0 0 160px rgba(201,168,124,0.1)' }}>
            Begin your journey ✦
          </MagneticButton>
        </ScrollReveal>
      </div>

      {/* FOOTER */}
      <div style={{ position: 'relative', zIndex: 1, padding: '24px 52px', borderTop: '0.5px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#c9a87c', opacity: 0.5 }} />
          <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: 'rgba(138,112,96,0.5)', fontSize: '14px' }}>evolve</span>
        </div>
        <span style={{ fontSize: '10px', color: 'rgba(138,112,96,0.4)', letterSpacing: '0.08em' }}>your growth, organised ✦</span>
      </div>

      <style>{`
        @keyframes orbPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-14px) rotate(1deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(1deg); }
          50% { transform: translateY(-18px) rotate(-1deg); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes scrollBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.6; }
          50% { transform: translateX(-50%) translateY(8px); opacity: 1; }
        }
        @keyframes scrollDot {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(10px); opacity: 0; }
        }
        * { -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(201,168,124,0.2); border-radius: 99px; }
      `}</style>
    </div>
  )
}