import { useEffect, useRef } from 'react'

export default function AmbientLayer() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const mouseRef = useRef({ x: -999, y: -999 })

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

    const orbs = [
      { x: 0.15, y: 0.3, r: 280, color: [201, 168, 124], phase: 0, spd: 0.12 },
      { x: 0.85, y: 0.2, r: 220, color: [158, 181, 212], phase: 2.1, spd: 0.09 },
      { x: 0.5, y: 0.8, r: 260, color: [212, 165, 165], phase: 4.2, spd: 0.07 },
      { x: 0.8, y: 0.7, r: 180, color: [168, 196, 160], phase: 1.1, spd: 0.11 },
    ]

    const particles = Array.from({ length: 55 }, () => {
      const colors = [[201,168,124],[158,181,212],[212,165,165],[168,196,160]]
      const c = colors[Math.floor(Math.random() * colors.length)]
      return {
        x: Math.random(), y: Math.random(),
        vx: (Math.random() - 0.5) * 0.00025,
        vy: (Math.random() - 0.5) * 0.00025,
        size: Math.random() * 1.4 + 0.2,
        op: Math.random() * 0.25 + 0.05,
        pulse: Math.random() * Math.PI * 2,
        color: c,
      }
    })

    let t = 0

    function draw() {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      t += 0.006

      const mx = mouseRef.current.x / W
      const my = mouseRef.current.y / H

      // Soft orbs
      orbs.forEach(orb => {
        const tx = orb.x + Math.sin(t * orb.spd + orb.phase) * 0.15
        const ty = orb.y + Math.cos(t * orb.spd * 0.8 + orb.phase) * 0.1
        const mdx = mx - tx, mdy = my - ty
        const md = Math.sqrt(mdx*mdx + mdy*mdy)
        const pull = md < 0.4 ? (0.4 - md) * 0.06 : 0
        const cx = (tx + mdx * pull) * W
        const cy = (ty + mdy * pull) * H
        const r = orb.r * (0.9 + Math.sin(t * 0.3 + orb.phase) * 0.1)
        const [red, g, b] = orb.color
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        grad.addColorStop(0, `rgba(${red},${g},${b},0.055)`)
        grad.addColorStop(0.5, `rgba(${red},${g},${b},0.02)`)
        grad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      })

      // Particles
      particles.forEach(p => {
        p.pulse += 0.018
        p.x += p.vx + Math.sin(t * 0.3 + p.pulse) * 0.00008
        p.y += p.vy + Math.cos(t * 0.25 + p.pulse) * 0.00006
        if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0
        if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0
        const dx = p.x - mx, dy = p.y - my
        const d = Math.sqrt(dx*dx + dy*dy)
        if (d < 0.08) { p.x += dx * 0.004; p.y += dy * 0.004 }
        const op = p.op * (0.4 + Math.sin(p.pulse) * 0.6)
        const [r, g, b] = p.color
        ctx.beginPath()
        ctx.arc(p.x * W, p.y * H, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${op})`
        ctx.fill()
      })

      // Subtle connections
      for (let i = 0; i < particles.length; i += 3) {
        for (let j = i + 3; j < particles.length; j += 3) {
          const dx = (particles[i].x - particles[j].x) * W
          const dy = (particles[i].y - particles[j].y) * H
          const dist = Math.sqrt(dx*dx + dy*dy)
          if (dist < 90) {
            const [r, g, b] = particles[i].color
            ctx.beginPath()
            ctx.moveTo(particles[i].x * W, particles[i].y * H)
            ctx.lineTo(particles[j].x * W, particles[j].y * H)
            ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - dist/90) * 0.04})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0,
        pointerEvents: 'none', zIndex: 0,
        opacity: 0.7,
      }}
    />
  )
}