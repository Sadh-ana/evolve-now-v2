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
  startup: { label: 'Startup canvas', content: `# [Name]\n\n## Problem\nWhat problem does this solve?\n\n## Solution\nHow exactly?\n\n## Target audience\nWho specifically?\n\n## Why now?\nWhy hasn't this been done?\n\n## Moat\nWhat makes this hard to copy?\n\n## Metrics that matter\nHow do we know it's working?\n\n## Next 3 actions\n1. \n2. \n3. \n` },
  fitness: { label: 'Fitness plan', content: `# Fitness Plan\n\n## Goal (specific)\n\n## Weekly schedule\nMon: \nTue: \nWed: \nThu: \nFri: \nSat: \nSun: \n\n## Nutrition\n\n## Recovery\n\n## Weekly check-in markers\n- \n` },
  cornell: { label: 'Cornell notes', content: `# [Topic] — [Date]\n\n## Questions\n- \n- \n\n## Notes\n\n\n---\n\n## Summary\n` },
  feynman: { label: 'Feynman technique', content: `# Feynman: [Concept]\n\n## Explain it simply\n(As if to a 12-year-old:)\n\n\n## Identify gaps\nWhere did I get vague or stuck?\n\n\n## Go back to source\nWhat do I need to re-study?\n\n\n## Simplify further\n\n` },
  project: { label: 'Project plan', content: `# [Project name]\n\n## Vision\n\n## Milestones\n1. [ ] \n2. [ ] \n3. [ ] \n\n## Resources needed\n\n## Blockers\n\n## Weekly check: what moved? what's stuck?\n` },
}

export default function Brainstorm({ session }) {
  const [projects, setProjects] = useState([])
  const [pages, setPages] = useState([])
  const [activeProject, setActiveProject] = useState(null)
  const [activePage, setActivePage] = useState(null)
  const [lockIn, setLockIn] = useState(false)
  const [content, setContent] = useState('')
  const [showNewProject, setShowNewProject] = useState(false)
  const [showNewPage, setShowNewPage] = useState(false)
  const [newProject, setNewProject] = useState({ title: '', type: 'project', description: '' })
  const [newPage, setNewPage] = useState({ title: '', template: 'blank' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const saveTimer = useRef(null)
  const taRef = useRef(null)

  useEffect(() => { fetchProjects() }, [])
  useEffect(() => { if (activeProject) fetchPages(activeProject.id) }, [activeProject])
  useEffect(() => { if (activePage) setContent(activePage.content || '') }, [activePage])
  useEffect(() => { if (lockIn && taRef.current) taRef.current.focus() }, [lockIn])

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
      const { data: pg } = await supabase.from('brainstorm_pages').insert({ project_id: data.id, user_id: session.user.id, title: 'Overview', content: '', template: 'blank' }).select().single()
      if (pg) { setPages([pg]); setActivePage(pg); setContent('') }
    }
    setNewProject({ title: '', type: 'project', description: '' }); setShowNewProject(false)
  }

  async function createPage(e) {
    e.preventDefault()
    if (!activeProject) return
    const tmpl = TEMPLATES[newPage.template] || TEMPLATES.blank
    const { data } = await supabase.from('brainstorm_pages').insert({ project_id: activeProject.id, user_id: session.user.id, title: newPage.title, content: tmpl.content, template: newPage.template }).select().single()
    if (data) { setPages(p => [...p, data]); setActivePage(data); setContent(data.content || '') }
    setNewPage({ title: '', template: 'blank' }); setShowNewPage(false)
  }

  function autoSave(val) {
    setContent(val); setSaved(false)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      if (!activePage) return
      setSaving(true)
      await supabase.from('brainstorm_pages').update({ content: val, updated_at: new Date().toISOString() }).eq('id', activePage.id)
      setPages(p => p.map(pg => pg.id === activePage.id ? { ...pg, content: val } : pg))
      setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
    }, 1200)
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
  const iStyle = { width: '100%', background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRadius: '12px', padding: '10px 14px', color: 'var(--cream-200)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none' }
  const lStyle = { fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)' }

  // LOCK-IN MODE
  if (lockIn && activePage) return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--base-950)', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', borderBottom: '0.5px solid var(--base-700)' }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', fontStyle: 'italic', color: 'var(--muted)' }}>{activeProject?.title} → {activePage.title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{saving ? 'saving...' : saved ? '✓' : ''}</span>
          <button onClick={() => setLockIn(false)} style={{ padding: '6px 16px', background: 'transparent', border: '0.5px solid var(--base-600)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--muted)' }}>exit lock-in</button>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
        <textarea ref={taRef} value={content} onChange={e => autoSave(e.target.value)} style={{ width: '100%', maxWidth: '680px', flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '48px 24px', color: 'var(--cream-200)', fontSize: '16px', fontFamily: 'var(--font-sans)', lineHeight: 1.85, fontWeight: 300, resize: 'none' }} placeholder="Start writing. Just you and this page." />
      </div>
    </div>
  )

  // PROJECT LIST
  if (!activeProject) return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', fontWeight: 400, color: 'var(--cream-200)', marginBottom: '4px' }}>Brainstorm</h2>
          <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)' }}>ideas, plans, deep thinking ✦</p>
        </div>
        <button onClick={() => setShowNewProject(true)} style={{ padding: '10px 20px', background: 'var(--gold-300)', border: 'none', borderRadius: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)' }}>+ New Project</button>
      </div>

      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontStyle: 'italic', color: 'var(--gold-300)', marginBottom: '8px' }}>the blank canvas awaits ✦</p>
          <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)', marginBottom: '24px' }}>Create your first project — startup idea, fitness plan, study guide, anything.</p>
          <button onClick={() => setShowNewProject(true)} style={{ padding: '12px 24px', background: 'var(--gold-300)', border: 'none', borderRadius: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)' }}>Create first project</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
          {projects.map(proj => {
            const type = getType(proj.type)
            return (
              <div key={proj.id} style={{ background: 'var(--base-800)', border: `0.5px solid ${proj.color}44`, borderRadius: '14px', padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s', borderLeft: `3px solid ${proj.color}`, position: 'relative' }} onClick={() => { setActiveProject(proj); setActivePage(null) }}>
                <div style={{ fontSize: '22px', marginBottom: '8px' }}>{type.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '4px', fontWeight: 400 }}>{proj.title}</h3>
                {proj.description && <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontWeight: 300, marginBottom: '10px' }}>{proj.description}</p>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '99px', background: proj.color + '22', color: proj.color, fontFamily: 'var(--font-sans)', textTransform: 'uppercase' }}>{type.label}</span>
                  <button onClick={e => { e.stopPropagation(); deleteProject(proj.id) }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--base-600)', fontSize: '14px' }}>×</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showNewProject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowNewProject(false)}>
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

  // PROJECT DETAIL
  const type = getType(activeProject.type)
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ width: '210px', minWidth: '210px', background: 'var(--base-900)', borderRight: '0.5px solid var(--base-600)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '0.5px solid var(--base-700)' }}>
          <button onClick={() => { setActiveProject(null); setActivePage(null); setPages([]) }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '11px', fontFamily: 'var(--font-sans)', marginBottom: '10px' }}>← all projects</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{type.icon}</span>
            <div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', fontStyle: 'italic', color: 'var(--cream-200)' }}>{activeProject.title}</p>
              <span style={{ fontSize: '9px', color: activeProject.color || type.color, fontFamily: 'var(--font-sans)', textTransform: 'uppercase' }}>{type.label}</span>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 4px' }}>
            <span style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pages</span>
            <button onClick={() => setShowNewPage(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '16px' }}>+</button>
          </div>
          {pages.map(page => (
            <div key={page.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
              <button onClick={() => { setActivePage(page); setContent(page.content || '') }} style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', textAlign: 'left', background: activePage?.id === page.id ? 'var(--base-700)' : 'transparent', color: activePage?.id === page.id ? 'var(--cream-200)' : 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.title}</button>
              {pages.length > 1 && <button onClick={() => deletePage(page.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--base-600)', fontSize: '12px', flexShrink: 0 }}>×</button>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activePage ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '0.5px solid var(--base-600)', background: 'var(--base-900)' }}>
              <p style={{ fontSize: '13px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{activePage.title}</p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{saving ? 'saving...' : saved ? '✓ saved' : ''}</span>
                <button onClick={() => setLockIn(true)} style={{ padding: '6px 16px', background: 'var(--gold-300)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 500, color: 'var(--base-950)' }}>◈ Lock in</button>
              </div>
            </div>
            <textarea value={content} onChange={e => autoSave(e.target.value)} placeholder={`Start writing in ${activePage.title}...`} style={{ flex: 1, background: 'var(--base-950)', border: 'none', outline: 'none', padding: '32px 48px', color: 'var(--cream-200)', fontSize: '15px', fontFamily: 'var(--font-sans)', lineHeight: 1.8, fontWeight: 300, resize: 'none' }} />
          </>
        ) : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--muted)', fontFamily: 'var(--font-serif)', fontSize: '20px', fontStyle: 'italic' }}>Select or create a page ✦</p></div>}
      </div>

      {showNewPage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowNewPage(false)}>
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '20px' }}>New Page</h3>
            <form onSubmit={createPage} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={lStyle}>Page title</label><input value={newPage.title} onChange={e => setNewPage(p => ({ ...p, title: e.target.value }))} placeholder="Overview, Ideas, Notes..." required autoFocus style={iStyle} /></div>
              <div><label style={lStyle}>Template</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {Object.entries(TEMPLATES).map(([id, t]) => <button key={id} type="button" onClick={() => setNewPage(p => ({ ...p, template: id }))} style={{ padding: '8px 14px', borderRadius: '8px', border: `0.5px solid ${newPage.template === id ? 'var(--gold-300)' : 'var(--base-600)'}`, background: newPage.template === id ? 'rgba(201,168,124,0.12)' : 'transparent', color: newPage.template === id ? 'var(--gold-300)' : 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', textAlign: 'left' }}>{t.label}</button>)}
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