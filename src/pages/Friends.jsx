import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Friends({ session, setActivePage }) {
  const [friends, setFriends] = useState([])
  const [pending, setPending] = useState([])
  const [incoming, setIncoming] = useState([])
  const [search, setSearch] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(false)
  const [myUsername, setMyUsername] = useState('')
  const [studyInvites, setStudyInvites] = useState([])

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const uid = session.user.id
    const { data: profile } = await supabase.from('profiles').select('username').eq('id', uid).single()
    if (profile?.username) setMyUsername(profile.username)

    const { data: fs } = await supabase.from('friendships').select(`
      id, status, requester_id, addressee_id,
      requester:profiles!friendships_requester_id_fkey(id, name, username, avatar_animal),
      addressee:profiles!friendships_addressee_id_fkey(id, name, username, avatar_animal)
    `).or(`requester_id.eq.${uid},addressee_id.eq.${uid}`)

    const accepted = (fs || []).filter(f => f.status === 'accepted').map(f => ({
      ...f, friend: f.requester_id === uid ? f.addressee : f.requester
    }))
    const pend = (fs || []).filter(f => f.status === 'pending' && f.requester_id === uid).map(f => ({
      ...f, friend: f.addressee
    }))
    const inc = (fs || []).filter(f => f.status === 'pending' && f.addressee_id === uid).map(f => ({
      ...f, friend: f.requester
    }))

    setFriends(accepted)
    setPending(pend)
    setIncoming(inc)

    // Study invites from friends
    const { data: invs } = await supabase.from('study_room_invites')
      .select('*').eq('to_user_id', uid).eq('status', 'pending')
    setStudyInvites(invs || [])
  }

  async function searchUser() {
    if (!search.trim()) return
    setSearching(true); setSearchError(''); setSearchResult(null)
    const { data } = await supabase.from('profiles').select('id, name, username, avatar_animal').eq('username', search.trim().toLowerCase()).single()
    if (!data) { setSearchError('No user found with that username'); setSearching(false); return }
    if (data.id === session.user.id) { setSearchError('That\'s you!'); setSearching(false); return }
    setSearchResult(data); setSearching(false)
  }

  async function sendRequest(toId) {
    await supabase.from('friendships').insert({ requester_id: session.user.id, addressee_id: toId })
    setSearchResult(null); setSearch(''); fetchAll()
  }

  async function accept(id) {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id)
    fetchAll()
  }

  async function decline(id) {
    await supabase.from('friendships').delete().eq('id', id)
    fetchAll()
  }

  async function unfriend(id) {
    await supabase.from('friendships').delete().eq('id', id)
    fetchAll()
  }

  async function sendStudyInvite(friend) {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    await supabase.from('study_room_invites').insert({
      room_code: roomCode,
      from_user_id: session.user.id,
      from_username: myUsername,
      to_user_id: friend.id,
      to_username: friend.username,
    })
    alert(`Invite sent! When they accept, both join room: ${roomCode}\n\nYour room code: ${roomCode}\nGo to Study Room and enter this code.`)
  }

  async function acceptStudyInvite(inv) {
    await supabase.from('study_room_invites').update({ status: 'accepted' }).eq('id', inv.id)
    setStudyInvites(p => p.filter(i => i.id !== inv.id))
    // Store room code for study room
    localStorage.setItem('pendingRoomCode', inv.room_code)
    if (setActivePage) setActivePage('studyroom')
  }

  async function declineStudyInvite(inv) {
    await supabase.from('study_room_invites').update({ status: 'declined' }).eq('id', inv.id)
    setStudyInvites(p => p.filter(i => i.id !== inv.id))
  }

  const animalEmoji = a => ({ bear: '🐻', cat: '🐱', fox: '🦊', panda: '🐼', bunny: '🐰' }[a] || '🐻')

  const card = { background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '14px', padding: '1rem 1.25rem' }
  const iStyle = { background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRadius: '10px', padding: '9px 14px', color: 'var(--cream-200)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none' }

  return (
    <div style={{ padding: '32px', maxWidth: '800px' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '4px' }}>Friends</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', padding: '12px 16px', background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '12px', width: 'fit-content' }}>
        <div>
          <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>Your username — share this with friends</p>
          <p style={{ fontSize: '18px', color: 'var(--gold-300)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>@{myUsername || 'not set'}</p>
        </div>
        <button onClick={() => navigator.clipboard.writeText(myUsername)} style={{ padding: '7px 14px', background: 'transparent', border: '0.5px solid var(--base-600)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--muted)' }}>Copy</button>
        {!myUsername && <span style={{ fontSize: '11px', color: 'var(--rose-300)', fontFamily: 'var(--font-sans)' }}>← set in Settings first</span>}
      </div>
      
      {/* Study invites */}
      {studyInvites.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          {studyInvites.map(inv => (
            <div key={inv.id} style={{ ...card, border: '1px solid var(--gold-300)', marginBottom: '10px', background: 'rgba(201,168,124,0.06)' }}>
              <p style={{ fontSize: '11px', color: 'var(--gold-300)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Study invite ✦</p>
              <p style={{ fontSize: '14px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', marginBottom: '12px' }}><strong>@{inv.from_username}</strong> wants to study together</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => acceptStudyInvite(inv)} style={{ flex: 2, padding: '9px', background: 'var(--gold-300)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500, color: 'var(--base-950)' }}>Join room ✦</button>
                <button onClick={() => declineStudyInvite(inv)} style={{ flex: 1, padding: '9px', background: 'transparent', border: '0.5px solid var(--base-600)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--muted)' }}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ ...card, marginBottom: '24px' }}>
        <p style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)', marginBottom: '10px' }}>Add a friend</p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="their_username" style={{ ...iStyle, flex: 1 }} onKeyDown={e => e.key === 'Enter' && searchUser()} />
          <button onClick={searchUser} disabled={searching} style={{ padding: '9px 18px', background: 'var(--gold-300)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)' }}>Search</button>
        </div>
        {searchError && <p style={{ fontSize: '12px', color: 'var(--rose-300)', fontFamily: 'var(--font-sans)' }}>{searchError}</p>}
        {searchResult && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--base-700)', borderRadius: '10px' }}>
            <span style={{ fontSize: '24px' }}>{animalEmoji(searchResult.avatar_animal)}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{searchResult.name}</p>
              <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>@{searchResult.username}</p>
            </div>
            <button onClick={() => sendRequest(searchResult.id)} style={{ padding: '8px 16px', background: 'var(--gold-300)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500, color: 'var(--base-950)' }}>Send request ✦</button>
          </div>
        )}
      </div>

      {/* Incoming requests */}
      {incoming.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)', marginBottom: '12px' }}>Friend requests ({incoming.length})</p>
          {incoming.map(f => (
            <div key={f.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>{animalEmoji(f.friend?.avatar_animal)}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{f.friend?.name}</p>
                <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>@{f.friend?.username}</p>
              </div>
              <button onClick={() => accept(f.id)} style={{ padding: '7px 14px', background: 'var(--gold-300)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500, color: 'var(--base-950)' }}>Accept</button>
              <button onClick={() => decline(f.id)} style={{ padding: '7px 14px', background: 'transparent', border: '0.5px solid var(--base-600)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--muted)' }}>Decline</button>
            </div>
          ))}
        </div>
      )}

      {/* Friends list */}
      <div>
        <p style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)', marginBottom: '12px' }}>
          Friends {friends.length > 0 ? `(${friends.length})` : ''}
        </p>
        {friends.length === 0 && pending.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontStyle: 'italic', color: 'var(--gold-300)', marginBottom: '8px' }}>no friends yet ✦</p>
            <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>Search for friends by their username above.</p>
          </div>
        ) : (
          <>
            {friends.map(f => (
              <div key={f.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '28px' }}>{animalEmoji(f.friend?.avatar_animal)}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{f.friend?.name}</p>
                  <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>@{f.friend?.username}</p>
                </div>
                <button onClick={() => sendStudyInvite(f.friend)} style={{ padding: '7px 14px', background: 'rgba(168,196,160,0.15)', border: '0.5px solid #a8c4a0', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#a8c4a0', whiteSpace: 'nowrap' }}>📚 Study together</button>
                <button onClick={() => unfriend(f.id)} style={{ padding: '7px 14px', background: 'transparent', border: '0.5px solid var(--base-600)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--muted)' }}>Remove</button>
              </div>
            ))}
            {pending.map(f => (
              <div key={f.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', opacity: 0.6 }}>
                <span style={{ fontSize: '28px' }}>{animalEmoji(f.friend?.avatar_animal)}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{f.friend?.name}</p>
                  <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>@{f.friend?.username}</p>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', padding: '4px 10px', border: '0.5px solid var(--base-600)', borderRadius: '99px' }}>pending</span>
                <button onClick={() => decline(f.id)} style={{ padding: '7px 14px', background: 'transparent', border: '0.5px solid var(--base-600)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--muted)' }}>Cancel</button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}