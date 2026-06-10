import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

const PROJECT_TYPES = [
  { id: 'startup', label: 'Startup', icon: '◈', color: '#c9a87c' },
  { id: 'project', label: 'Project', icon: '◎', color: '#9eb5d4' },
  { id: 'fitness', label: 'Fitness Plan', icon: '↑', color: '#d4a5a5' },
  { id: 'creative', label: 'Creative', icon: '♡', color: '#a8c4a0' },
  { id: 'research', label: 'Research', icon: '✦', color: '#b8a8d4' },
  { id: 'learning', label: 'Learning', icon: '◷', color: '#7fc4b0' },
  { id: 'life', label: 'Life Plan', icon: '⊕', color: '#d4b8a0' },
  { id: 'other', label: 'Other', icon: '—', color: '#8a7060' },
]

const TEMPLATES = {
  blank: { label: 'Blank canvas', content: '' },
  braindump: { label: 'Brain dump', content: `# Brain dump — ${format(new Date(), 'MMM d yyyy')}\n\nWrite everything. No filter, no structure. Just get it out.\n\n---\n\n` },
  startup: { label: 'Startup canvas', content: `# [Name]\n\n## Problem\n\n## Solution\n\n## Who is this for?\n\n## Why now?\n\n## Moat\n\n## Metrics\n\n## Next 3 actions\n1. \n2. \n3. \n` },
  fitness: { label: 'Fitness plan', content: `# Fitness Plan\n\n## Goal (specific + dated)\n\n## Weekly schedule\nMon: \nTue: \nWed: \nThu: \nFri: \nSat: \nSun: \n\n## Nutrition\n\n## Recovery\n\n## Weekly markers\n` },
  cornell: { label: 'Cornell notes', content: `# [Topic] — [Date]\n\n## Questions\n- \n\n## Notes\n\n\n---\n\n## Summary\n` },
  feynman: { label: 'Feynman technique', content: `# Feynman: [Concept]\n\n## Explain simply\n\n## Gaps found\n\n## Back to source\n\n## Simplified\n` },
  project: { label: 'Project plan', content: `# [Project]\n\n## Vision\n\n## Milestones\n1. [ ] \n2. [ ] \n3. [ ] \n\n## Resources\n\n## Blockers\n` },
}

// ── BLACK HOLE (lock-in background) ──────────────────────────────────
function BlackHole() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)

    const N = 3200
    const particles = Array.from({ length: N }, () => {
      const radius = 72 + Math.pow(Math.random(), 0.6) * 340
      return {
        angle: Math.random() * Math.PI * 2,
        radius, baseRadius: radius,
        speed: (52 / radius) * (0.6 + Math.random() * 0.8),
        size: Math.random() * 1.7 + 0.1,
        opacity: Math.pow(Math.max(0, 1 - (radius - 72) / 290), 0.4),
        falling: false, fallRate: 0,
        twinkle: Math.random() * Math.PI * 2,
      }
    })

    const stars = Array.from({ length: 280 }, () => ({
      x: Math.random(), y: Math.random(),
      size: Math.random() * 1.3 + 0.1,
      op: Math.random() * 0.5 + 0.1,
      tw: Math.random() * Math.PI * 2,
    }))

    let t = 0
    function draw() {
      const W = canvas.width, H = canvas.height
      const cx = W / 2, cy = H / 2
      const BH = 62

      // Deep space background
      ctx.fillStyle = '#030201'
      ctx.fillRect(0, 0, W, H)
      t += 0.007

      // Stars
      stars.forEach(s => {
        s.tw += 0.018
        ctx.beginPath()
        ctx.arc(s.x * W, s.y * H, s.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${s.op * (0.6 + Math.sin(s.tw) * 0.4)})`
        ctx.fill()
      })

      // Accretion disk — additive blending = realistic glow
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'

      particles.forEach(p => {
        p.twinkle += 0.04
        p.angle += p.speed * 0.016

        if (!p.falling && Math.random() < 0.0004) {
          p.falling = true
          p.fallRate = 0.15 + Math.random() * 0.6
        }

        if (p.falling) {
          p.radius -= p.fallRate
          p.speed *= 1.01
          if (p.radius < BH - 8) {
            p.radius = 180 + Math.random() * 220
            p.baseRadius = p.radius
            p.speed = (52 / p.radius) * (0.6 + Math.random() * 0.8)
            p.falling = false; p.fallRate = 0
            p.opacity = 0.05
          }
        } else {
          p.radius = p.baseRadius + Math.sin(t * 0.4 + p.angle) * 2.5
          p.opacity = Math.min(p.opacity + 0.002, Math.pow(Math.max(0, 1 - (p.radius - 72) / 290), 0.4))
        }

        const TILT = 0.32
        const x = cx + Math.cos(p.angle) * p.radius
        const y = cy + Math.sin(p.angle) * p.radius * TILT
        const behindBH = Math.sin(p.angle) < 0 && p.radius < BH * 2.5
        const heat = Math.max(0, 1 - (p.radius - 72) / 180)
        const flicker = 0.7 + Math.sin(p.twinkle) * 0.3

        const r = Math.floor(210 + heat * 45)
        const g = Math.floor(130 + heat * 90)
        const b = Math.floor(40 + heat * 140)
        const a = p.opacity * flicker * (behindBH ? 0.12 : 1)

        if (a < 0.008) return
        ctx.beginPath()
        ctx.arc(x, y, p.size * (1 + heat * 0.6), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${a})`
        ctx.fill()
      })

      ctx.restore()

      // Photon ring glow
      for (let i = 0; i < 5; i++) {
        const rr = BH + i * 7 + Math.sin(t * 0.6 + i) * 1.5
        const op = (0.35 - i * 0.06) * (0.8 + Math.sin(t * 0.8 + i * 1.3) * 0.2)
        const g2 = ctx.createRadialGradient(cx, cy, rr - 4, cx, cy, rr + 7)
        g2.addColorStop(0, 'rgba(255,200,80,0)')
        g2.addColorStop(0.4, `rgba(255,185,60,${op})`)
        g2.addColorStop(0.7, `rgba(255,140,40,${op * 0.6})`)
        g2.addColorStop(1, 'rgba(255,100,20,0)')
        ctx.beginPath()
        ctx.ellipse(cx, cy, rr, rr * TILT_VAL(0.32), 0, 0, Math.PI * 2)
        ctx.strokeStyle = g2; ctx.lineWidth = 6; ctx.stroke()
      }

      // Event horizon
      ctx.save()
      ctx.globalCompositeOperation = 'source-over'
      const bhg = ctx.createRadialGradient(cx, cy, 0, cx, cy, BH + 15)
      bhg.addColorStop(0, 'rgba(0,0,0,1)')
      bhg.addColorStop(0.88, 'rgba(0,0,0,1)')
      bhg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.beginPath(); ctx.arc(cx, cy, BH + 15, 0, Math.PI * 2)
      ctx.fillStyle = bhg; ctx.fill()
      ctx.restore()

      // Relativistic jets
      const jOp = 0.025 + Math.sin(t * 0.5) * 0.015
      ;[-1, 1].forEach(dir => {
        const jg = ctx.createLinearGradient(cx, cy + dir * BH, cx, cy + dir * H * 0.45)
        jg.addColorStop(0, `rgba(200,160,255,${jOp * 4})`)
        jg.addColorStop(0.3, `rgba(170,130,255,${jOp * 2})`)
        jg.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.moveTo(cx - 6, cy + dir * BH)
        ctx.lineTo(cx + 6, cy + dir * BH)
        ctx.lineTo(cx + 1, cy + dir * H * 0.45)
        ctx.lineTo(cx - 1, cy + dir * H * 0.45)
        ctx.closePath(); ctx.fillStyle = jg; ctx.fill()
      })

      animRef.current = requestAnimationFrame(draw)
    }

    function TILT_VAL(t) { return t }
    draw()
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
}

// ── GRAPH VIEW ────────────────────────────────────────────────────────
function GraphCanvas({ projects, onSelect }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const nodesRef = useRef([])
  const edgeParticles = useRef([])
  const mouse = useRef({ x: -999, y: -999 })
  const clickBurst = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function resize() {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      init()
    }

    function init() {
      const W = canvas.width, H = canvas.height
      const cx = W / 2, cy = H / 2
      nodesRef.current = projects.map((proj, i) => {
        const angle = (i / Math.max(projects.length, 1)) * Math.PI * 2
        const r = Math.min(W, H) * 0.27
        return {
          proj, x: cx + Math.cos(angle) * r + (Math.random() - 0.5) * 70,
          y: cy + Math.sin(angle) * r + (Math.random() - 0.5) * 70,
          vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
          radius: 20, color: proj.color || '#c9a87c',
          pulse: Math.random() * Math.PI * 2, glowRadius: 0,
        }
      })
      // Init edge particles
      edgeParticles.current = []
      for (let i = 0; i < 40; i++) {
        edgeParticles.current.push({ t: Math.random(), from: 0, to: Math.min(1, projects.length - 1), speed: 0.003 + Math.random() * 0.004, size: Math.random() * 2 + 0.5, opacity: Math.random() * 0.6 + 0.2 })
      }
    }

    resize()
    window.addEventListener('resize', resize)

    // Stars for background
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random(), y: Math.random(), size: Math.random() * 0.8 + 0.1,
      op: Math.random() * 0.25 + 0.05, tw: Math.random() * Math.PI * 2,
    }))

    let t = 0
    function draw() {
      const W = canvas.width, H = canvas.height
      const cx = W / 2, cy = H / 2
      ctx.clearRect(0, 0, W, H)

      // Space background
      ctx.fillStyle = '#0a0806'
      ctx.fillRect(0, 0, W, H)
      t += 0.008

      // Stars
      stars.forEach(s => {
        s.tw += 0.015
        ctx.beginPath()
        ctx.arc(s.x * W, s.y * H, s.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,240,220,${s.op * (0.7 + Math.sin(s.tw) * 0.3)})`
        ctx.fill()
      })

      const nodes = nodesRef.current
      if (nodes.length === 0) {
        ctx.font = '400 14px "Instrument Sans"'
        ctx.fillStyle = 'rgba(138,112,96,0.4)'
        ctx.textAlign = 'center'
        ctx.fillText('Create a project to see it appear here', cx, cy)
        animRef.current = requestAnimationFrame(draw)
        return
      }

      // Nebula glow around hub
      const ng = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120)
      ng.addColorStop(0, `rgba(201,168,124,${0.04 + Math.sin(t * 0.4) * 0.02})`)
      ng.addColorStop(0.5, `rgba(212,165,165,${0.02 + Math.sin(t * 0.3) * 0.01})`)
      ng.addColorStop(1, 'transparent')
      ctx.beginPath(); ctx.arc(cx, cy, 120, 0, Math.PI * 2)
      ctx.fillStyle = ng; ctx.fill()

      // Edges with glow
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 240) {
            const op = (1 - dist / 240) * 0.12
            const eg = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y)
            eg.addColorStop(0, `rgba(201,168,124,${op})`)
            eg.addColorStop(0.5, `rgba(212,165,165,${op * 1.5})`)
            eg.addColorStop(1, `rgba(201,168,124,${op})`)
            ctx.beginPath(); ctx.strokeStyle = eg; ctx.lineWidth = 1
            ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke()
          }
        }
        // Hub lines
        const ddx = cx - nodes[i].x, ddy = cy - nodes[i].y
        const ddist = Math.sqrt(ddx * ddx + ddy * ddy)
        const op2 = Math.max(0, (1 - ddist / 380) * 0.1)
        if (op2 > 0.005) {
          ctx.beginPath(); ctx.strokeStyle = `rgba(201,168,124,${op2})`
          ctx.lineWidth = 0.5; ctx.setLineDash([3, 9])
          ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(cx, cy); ctx.stroke()
          ctx.setLineDash([])
        }
      }
      ctx.restore()

      // Flowing edge particles
      if (nodes.length > 1) {
        ctx.save()
        ctx.globalCompositeOperation = 'lighter'
        edgeParticles.current.forEach(ep => {
          ep.t += ep.speed
          if (ep.t > 1) { ep.t = 0; ep.from = Math.floor(Math.random() * nodes.length); ep.to = Math.floor(Math.random() * nodes.length) }
          if (ep.from === ep.to || ep.from >= nodes.length || ep.to >= nodes.length) return
          const na = nodes[ep.from], nb = nodes[ep.to]
          const dist = Math.sqrt((nb.x - na.x) ** 2 + (nb.y - na.y) ** 2)
          if (dist > 240) return
          const px = na.x + (nb.x - na.x) * ep.t
          const py = na.y + (nb.y - na.y) * ep.t
          const fade = Math.sin(ep.t * Math.PI)
          ctx.beginPath(); ctx.arc(px, py, ep.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(232,201,126,${ep.opacity * fade})`; ctx.fill()
        })
        ctx.restore()
      }

      // Click bursts
      clickBurst.current = clickBurst.current.filter(b => b.life > 0)
      clickBurst.current.forEach(b => {
        b.life -= 0.04
        b.particles.forEach(bp => {
          bp.x += bp.vx; bp.y += bp.vy; bp.vy += 0.1; bp.vx *= 0.97
          ctx.beginPath(); ctx.arc(bp.x, bp.y, bp.size * b.life, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(201,168,124,${b.life * bp.op})`; ctx.fill()
        })
      })

      // Nodes
      nodes.forEach(node => {
        node.x += node.vx; node.y += node.vy
        if (node.x < 55) node.vx += 0.12; if (node.x > W - 55) node.vx -= 0.12
        if (node.y < 55) node.vy += 0.12; if (node.y > H - 55) node.vy -= 0.12
        node.vx += (cx - node.x) * 0.00007; node.vy += (cy - node.y) * 0.00007
        node.vx *= 0.978; node.vy *= 0.978
        node.pulse += 0.03

        const mdx = mouse.current.x - node.x, mdy = mouse.current.y - node.y
        const hovered = Math.sqrt(mdx * mdx + mdy * mdy) < node.radius + 14

        if (hovered) node.glowRadius = Math.min(node.glowRadius + 4, 60)
        else node.glowRadius = Math.max(node.glowRadius - 3, 0)

        // Outer nebula glow
        if (node.glowRadius > 0) {
          ctx.save()
          ctx.globalCompositeOperation = 'lighter'
          const ngr = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.glowRadius * 1.5)
          ngr.addColorStop(0, node.color + '18')
          ngr.addColorStop(1, 'transparent')
          ctx.beginPath(); ctx.arc(node.x, node.y, node.glowRadius * 1.5, 0, Math.PI * 2)
          ctx.fillStyle = ngr; ctx.fill()
          ctx.restore()

          // Highlight connected nodes
          if (hovered) {
            nodes.forEach(other => {
              if (other === node) return
              const d = Math.sqrt((other.x - node.x) ** 2 + (other.y - node.y) ** 2)
              if (d < 240) {
                ctx.save(); ctx.globalCompositeOperation = 'lighter'
                ctx.beginPath()
                ctx.strokeStyle = `rgba(201,168,124,0.35)`; ctx.lineWidth = 1.5
                ctx.moveTo(node.x, node.y); ctx.lineTo(other.x, other.y); ctx.stroke()
                ctx.restore()
              }
            })
          }
        }

        // Pulse ring
        const pr = node.radius + Math.sin(node.pulse) * 5
        ctx.save(); ctx.globalCompositeOperation = 'lighter'
        ctx.beginPath(); ctx.arc(node.x, node.y, pr + 8, 0, Math.PI * 2)
        ctx.strokeStyle = `${node.color}${hovered ? '25' : '12'}`; ctx.lineWidth = 2; ctx.stroke()
        ctx.restore()

        // Node body gradient
        const nr = hovered ? node.radius * 1.3 : node.radius
        const ng2 = ctx.createRadialGradient(node.x - nr * 0.3, node.y - nr * 0.3, 0, node.x, node.y, nr)
        ng2.addColorStop(0, node.color + 'ff')
        ng2.addColorStop(0.7, node.color + 'cc')
        ng2.addColorStop(1, node.color + '66')
        ctx.beginPath(); ctx.arc(node.x, node.y, nr, 0, Math.PI * 2)
        ctx.fillStyle = ng2; ctx.fill()

        // Inner dark core
        ctx.beginPath(); ctx.arc(node.x, node.y, nr * 0.4, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(10,8,6,0.9)'; ctx.fill()

        // Type icon
        ctx.font = `${hovered ? 13 : 11}px "Instrument Sans"`
        ctx.fillStyle = hovered ? node.color : 'rgba(138,112,96,0.7)'
        ctx.textAlign = 'center'
        ctx.fillText(node.proj.title.slice(0, 14), node.x, node.y + nr + 17)
      })

      // Hub node
      const hr = 10 + Math.sin(t * 0.7) * 3
      ctx.save(); ctx.globalCompositeOperation = 'lighter'
      const hg = ctx.createRadialGradient(cx, cy, 0, cx, cy, hr * 5)
      hg.addColorStop(0, 'rgba(201,168,124,0.4)'); hg.addColorStop(1, 'transparent')
      ctx.beginPath(); ctx.arc(cx, cy, hr * 5, 0, Math.PI * 2); ctx.fillStyle = hg; ctx.fill()
      ctx.beginPath(); ctx.arc(cx, cy, hr, 0, Math.PI * 2); ctx.fillStyle = 'rgba(201,168,124,0.7)'; ctx.fill()
      ctx.restore()
      ctx.font = '500 11px "Instrument Sans"'
      ctx.fillStyle = 'rgba(201,168,124,0.4)'; ctx.textAlign = 'center'
      ctx.fillText('evolve', cx, cy + hr + 16)

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize) }
  }, [projects])

  function handleMouseMove(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function handleClick(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    const hit = nodesRef.current.find(n => Math.sqrt((mx - n.x) ** 2 + (my - n.y) ** 2) < n.radius + 14)
    if (hit) {
      // Particle burst
      clickBurst.current.push({
        life: 1,
        particles: Array.from({ length: 24 }, () => ({
          x: hit.x, y: hit.y,
          vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
          size: Math.random() * 3 + 1, op: Math.random() * 0.8 + 0.2,
        }))
      })
      onSelect(hit.proj)
    }
  }

  return (
    <canvas ref={canvasRef} onMouseMove={handleMouseMove} onClick={handleClick}
      style={{ width: '100%', height: '100%', cursor: 'crosshair', display: 'block' }} />
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────
export default function Brainstorm({ session }) {
  const [projects, setProjects] = useState([])
  const [pages, setPages] = useState([])
  const [activeProject, setActiveProject] = useState(null)
  const [activePage, setActivePage] = useState(null)
  const [lockIn, setLockIn] = useState(false)
  const [content, setContent] = useState('')
  const [mainView, setMainView] = useState('graph')
  const [showNewProject, setShowNewProject] = useState(false)
  const [showNewPage, setShowNewPage] = useState(false)
  const [newProject, setNewProject] = useState({ title: '', type: 'project', description: '' })
  const [newPage, setNewPage] = useState({ title: '', template: 'blank' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [lockInVisible, setLockInVisible] = useState(false)
  const saveTimer = useRef(null)
  const taRef = useRef(null)

  useEffect(() => { fetchProjects() }, [])
  useEffect(() => { if (activeProject) fetchPages(activeProject.id) }, [activeProject])
  useEffect(() => {
    if (activePage) { setContent(activePage.content || ''); setWordCount(activePage.content?.split(/\s+/).filter(Boolean).length || 0) }
  }, [activePage])
  useEffect(() => {
    if (lockIn) {
      setTimeout(() => setLockInVisible(true), 50)
      setTimeout(() => taRef.current?.focus(), 300)
    } else {
      setLockInVisible(false)
    }
  }, [lockIn])

  async function fetchProjects() {
    const { data } = await supabase.from('brainstorm_projects').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
    setProjects(data || [])
  }

  async function fetchPages(pid) {
    const { data } = await supabase.from('brainstorm_pages').select('*').eq('project_id', pid).order('created_at')
    setPages(data || [])
    if (data?.length > 0) { setActivePage(data[0]); setContent(data[0].content || '') }
  }

  async function createProject(e) {
    e.preventDefault()
    const type = PROJECT_TYPES.find(t => t.id === newProject.type)
    const { data } = await supabase.from('brainstorm_projects').insert({ user_id: session.user.id, ...newProject, color: type?.color || '#c9a87c' }).select().single()
    if (data) {
      setProjects(p => [data, ...p]); setActiveProject(data); setPages([]); setActivePage(null)
      const tmpl = newProject.type === 'startup' ? 'startup' : newProject.type === 'fitness' ? 'fitness' : 'braindump'
      const { data: pg } = await supabase.from('brainstorm_pages').insert({ project_id: data.id, user_id: session.user.id, title: 'Main', content: TEMPLATES[tmpl]?.content || '', template: tmpl }).select().single()
      if (pg) { setPages([pg]); setActivePage(pg); setContent(pg.content || '') }
    }
    setNewProject({ title: '', type: 'project', description: '' }); setShowNewProject(false)
  }

  async function createPage(e) {
    e.preventDefault()
    if (!activeProject) return
    const { data } = await supabase.from('brainstorm_pages').insert({ project_id: activeProject.id, user_id: session.user.id, title: newPage.title, content: TEMPLATES[newPage.template]?.content || '', template: newPage.template }).select().single()
    if (data) { setPages(p => [...p, data]); setActivePage(data); setContent(data.content || '') }
    setNewPage({ title: '', template: 'blank' }); setShowNewPage(false)
  }

  function autoSave(val) {
    setContent(val); setWordCount(val.split(/\s+/).filter(Boolean).length); setSaved(false)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      if (!activePage) return
      setSaving(true)
      await supabase.from('brainstorm_pages').update({ content: val, updated_at: new Date().toISOString() }).eq('id', activePage.id)
      setPages(p => p.map(pg => pg.id === activePage.id ? { ...pg, content: val } : pg))
      setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
    }, 1000)
  }

  async function deletePage(id) {
    await supabase.from('brainstorm_pages').delete().eq('id', id)
    const rem = pages.filter(p => p.id !== id)
    setPages(rem)
    if (activePage?.id === id) { setActivePage(rem[0] || null); setContent(rem[0]?.content || '') }
  }

  async function deleteProject(id) {
    await supabase.from('brainstorm_projects').delete().eq('id', id)
    setProjects(p => p.filter(x => x.id !== id))
    if (activeProject?.id === id) { setActiveProject(null); setPages([]); setActivePage(null) }
  }

  const getType = id => PROJECT_TYPES.find(t => t.id === id) || PROJECT_TYPES[7]
  const iStyle = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px 14px', color: '#e8d5c0', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none' }
  const lStyle = { fontSize: '10px', color: 'rgba(138,112,96,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)' }

  // ── LOCK-IN MODE ──────────────────────────────────────────────────
  if (lockIn && activePage) return (
    <div style={{ position: 'fixed', inset: 0, background: '#030201', zIndex: 2000, display: 'flex', flexDirection: 'column', overflow: 'hidden', opacity: lockInVisible ? 1 : 0, transition: 'opacity 0.6s ease' }}>
      <BlackHole />

      {/* Floating top bar */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 36px', background: 'linear-gradient(to bottom, rgba(3,2,1,0.8), transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '13px', fontStyle: 'italic', color: 'rgba(201,168,124,0.35)' }}>{activeProject?.title}</span>
          <span style={{ color: 'rgba(201,168,124,0.2)' }}>→</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'rgba(212,192,168,0.5)' }}>{activePage.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-sans)', color: 'rgba(138,112,96,0.35)', letterSpacing: '0.08em' }}>{wordCount} words</span>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-sans)', transition: 'color 0.5s', color: saving ? 'rgba(138,112,96,0.3)' : saved ? 'rgba(168,196,160,0.5)' : 'transparent' }}>
            {saving ? 'saving' : '✓'}
          </span>
          <button onClick={() => setLockIn(false)} style={{ padding: '6px 16px', background: 'rgba(201,168,124,0.05)', border: '0.5px solid rgba(201,168,124,0.12)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'rgba(138,112,96,0.6)', letterSpacing: '0.06em', transition: 'all 0.3s' }}>
            esc
          </button>
        </div>
      </div>

      {/* Writing area - floats over the black hole */}
      <div style={{ flex: 1, position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
        <textarea
          ref={taRef}
          value={content}
          onChange={e => autoSave(e.target.value)}
          style={{
            width: '100%', maxWidth: '660px', flex: 1,
            background: 'transparent', border: 'none', outline: 'none',
            padding: '40px 24px 80px',
            color: 'rgba(232,213,192,0.88)',
            fontSize: '17px', fontFamily: 'Georgia, "Cormorant Garamond", serif',
            lineHeight: 2, fontWeight: 400, resize: 'none',
            caretColor: '#c9a87c',
            textShadow: '0 0 40px rgba(0,0,0,0.8)',
          }}
          placeholder={`You're in the void now.\n\nWrite without limits.`}
        />
      </div>

      {/* Bottom gradient */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(to top, rgba(3,2,1,0.9), transparent)', zIndex: 3, pointerEvents: 'none' }} />
    </div>
  )

  // ── PROJECT LIST ──────────────────────────────────────────────────
  if (!activeProject) return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '0.5px solid var(--base-600)', flexShrink: 0 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontStyle: 'italic', fontWeight: 400, color: 'var(--cream-200)' }}>Brainstorm</h2>
          <p style={{ color: 'var(--muted)', fontSize: '11px', fontFamily: 'var(--font-sans)' }}>{projects.length} project{projects.length !== 1 ? 's' : ''} · click any node to enter</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ display: 'flex', background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '10px', padding: '3px', gap: '2px' }}>
            {[{ id: 'graph', icon: '◈', label: 'Graph' }, { id: 'grid', icon: '⊞', label: 'Grid' }].map(v => (
              <button key={v.id} onClick={() => setMainView(v.id)} style={{ padding: '6px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', background: mainView === v.id ? 'var(--gold-300)' : 'transparent', color: mainView === v.id ? 'var(--base-950)' : 'var(--muted)', transition: 'all 0.15s' }}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowNewProject(true)} style={{ padding: '9px 18px', background: 'var(--gold-300)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)' }}>+ New</button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', background: '#0a0806' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', fontStyle: 'italic', color: 'var(--gold-300)' }}>the blank canvas awaits ✦</p>
          <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)', marginBottom: '8px' }}>startup, study guide, fitness plan, anything.</p>
          <button onClick={() => setShowNewProject(true)} style={{ padding: '11px 24px', background: 'var(--gold-300)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)' }}>Create first project</button>
        </div>
      ) : mainView === 'graph' ? (
        <div style={{ flex: 1, position: 'relative' }}>
          <GraphCanvas projects={projects} onSelect={p => { setActiveProject(p); setActivePage(null) }} />
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {projects.map(proj => {
              const type = getType(proj.type)
              return (
                <div key={proj.id} onClick={() => { setActiveProject(proj); setActivePage(null) }} style={{ background: 'var(--base-800)', border: `0.5px solid ${proj.color}44`, borderRadius: '14px', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s', borderLeft: `3px solid ${proj.color}` }}>
                  <div style={{ fontSize: '18px', marginBottom: '8px' }}>{type.icon}</div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '4px', fontWeight: 400 }}>{proj.title}</h3>
                  {proj.description && <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{proj.description}</p>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '99px', background: proj.color + '22', color: proj.color, fontFamily: 'var(--font-sans)', textTransform: 'uppercase' }}>{type.label}</span>
                    <button onClick={e => { e.stopPropagation(); deleteProject(proj.id) }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--base-600)', fontSize: '14px' }}>×</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showNewProject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowNewProject(false)}>
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '20px' }}>New Project</h3>
            <form onSubmit={createProject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={lStyle}>Title</label><input value={newProject.title} onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))} placeholder="What's this about?" required autoFocus style={iStyle} /></div>
              <div><label style={lStyle}>Type</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {PROJECT_TYPES.map(t => <button key={t.id} type="button" onClick={() => setNewProject(p => ({ ...p, type: t.id }))} style={{ padding: '6px 12px', borderRadius: '8px', border: `0.5px solid ${newProject.type === t.id ? t.color : 'var(--base-600)'}`, background: newProject.type === t.id ? t.color + '22' : 'transparent', color: newProject.type === t.id ? t.color : 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px' }}>{t.icon} {t.label}</button>)}
                </div>
              </div>
              <div><label style={lStyle}>Description (optional)</label><input value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))} placeholder="One line" style={iStyle} /></div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowNewProject(false)} style={{ flex: 1, padding: '11px', borderRadius: '12px', border: '0.5px solid var(--base-600)', background: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: '12px', border: 'none', background: 'var(--gold-300)', color: 'var(--base-950)', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Create ✦</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )

  // ── PROJECT DETAIL ──────────────────────────────────────────────
  const type = getType(activeProject.type)
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ width: '210px', minWidth: '210px', background: 'var(--base-900)', borderRight: '0.5px solid var(--base-600)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--base-700)' }}>
          <button onClick={() => { setActiveProject(null); setActivePage(null); setPages([]) }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '11px', fontFamily: 'var(--font-sans)', marginBottom: '12px' }}>← all projects</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>{type.icon}</span>
            <div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', fontStyle: 'italic', color: 'var(--cream-200)' }}>{activeProject.title}</p>
              <span style={{ fontSize: '9px', color: activeProject.color || type.color, fontFamily: 'var(--font-sans)', textTransform: 'uppercase' }}>{type.label}</span>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', padding: '0 6px' }}>
            <span style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pages</span>
            <button onClick={() => setShowNewPage(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '16px' }}>+</button>
          </div>
          {pages.map(page => (
            <div key={page.id} style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
              <button onClick={() => { setActivePage(page); setContent(page.content || '') }} style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', textAlign: 'left', background: activePage?.id === page.id ? 'var(--base-700)' : 'transparent', color: activePage?.id === page.id ? 'var(--cream-200)' : 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activePage?.id === page.id && <span style={{ color: 'var(--gold-300)', marginRight: '5px', fontSize: '7px' }}>●</span>}
                {page.title}
              </button>
              {pages.length > 1 && <button onClick={() => deletePage(page.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--base-600)', fontSize: '12px' }}>×</button>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activePage ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '0.5px solid var(--base-600)', background: 'var(--base-900)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <p style={{ fontSize: '13px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{activePage.title}</p>
                <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{wordCount} words</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: saving ? 'var(--muted)' : saved ? 'rgba(168,196,160,0.8)' : 'transparent', fontFamily: 'var(--font-sans)', transition: 'color 0.3s' }}>{saving ? 'saving...' : '✓ saved'}</span>
                <button onClick={() => setLockIn(true)} style={{ padding: '7px 18px', background: 'linear-gradient(135deg, #c9a87c, #d4a5a5)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600, color: '#0a0806', letterSpacing: '0.03em' }}>
                  ◈ Lock in
                </button>
              </div>
            </div>
            <textarea
              value={content}
              onChange={e => autoSave(e.target.value)}
              placeholder={`Start writing...\n\nThis is your thinking space. No rules.`}
              style={{ flex: 1, background: 'var(--base-950)', border: 'none', outline: 'none', padding: '36px 52px', color: 'var(--cream-200)', fontSize: '15px', fontFamily: 'var(--font-sans)', lineHeight: 1.85, fontWeight: 300, resize: 'none', caretColor: '#c9a87c' }}
            />
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-serif)', fontSize: '18px', fontStyle: 'italic' }}>select or create a page ✦</p>
          </div>
        )}
      </div>

      {showNewPage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowNewPage(false)}>
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '20px' }}>New Page</h3>
            <form onSubmit={createPage} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={lStyle}>Title</label><input value={newPage.title} onChange={e => setNewPage(p => ({ ...p, title: e.target.value }))} placeholder="Ideas, Notes, Overview..." required autoFocus style={iStyle} /></div>
              <div><label style={lStyle}>Template</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {Object.entries(TEMPLATES).map(([id, t]) => (
                    <button key={id} type="button" onClick={() => setNewPage(p => ({ ...p, template: id }))} style={{ padding: '8px 14px', borderRadius: '8px', border: `0.5px solid ${newPage.template === id ? 'var(--gold-300)' : 'var(--base-600)'}`, background: newPage.template === id ? 'rgba(201,168,124,0.12)' : 'transparent', color: newPage.template === id ? 'var(--gold-300)' : 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', textAlign: 'left' }}>
                      {newPage.template === id && '✦ '}{t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowNewPage(false)} style={{ flex: 1, padding: '11px', borderRadius: '12px', border: '0.5px solid var(--base-600)', background: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: '12px', border: 'none', background: 'var(--gold-300)', color: 'var(--base-950)', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Create ✦</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}