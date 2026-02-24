import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { apiFetch, getToken } from '../../lib/api'
import { useChannelChat } from '../../lib/useChannelChat'

const unwrap = json => { const r = json?.data ?? json; return Array.isArray(r) ? r : Array.isArray(r?.results) ? r.results : r }

export default function ChannelDetailPage() {
  const [channel, setChannel] = useState(null)
  const [updates, setUpdates] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [newUpdate, setNewUpdate] = useState('')
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [token, setToken] = useState(null)
  const router = useRouter()
  const { id } = router.query
  const { messages, connected, error: wsError, send: wsSend, addMessage } = useChannelChat(id)

  useEffect(() => {
    const t = getToken()
    setToken(t)
    setMounted(true)
    if (!t || !id) { setLoading(false); return }

    async function load() {
      try {
        const [chRes, updRes] = await Promise.all([
          apiFetch(`/profiles/channels/${id}/`),
          apiFetch(`/profiles/channel-progress/?channel=${id}`)
        ])
        if (chRes.ok) {
          const json = await chRes.json()
          setChannel(unwrap(json))
        }
        if (updRes.ok) {
          setUpdates(unwrap(await updRes.json()))
        }
      } catch (e) {}
      setLoading(false)
    }
    load()
  }, [id])

  async function sendMessage(e) {
    e.preventDefault()
    const content = newMsg.trim()
    if (!content) return
    const sent = connected && wsSend(content)
    if (sent) { setNewMsg(''); return }
    try {
      const res = await apiFetch('/profiles/channel-messages/', {
        method: 'POST',
        body: JSON.stringify({ channel: Number(id), content })
      })
      if (res.ok) {
        const json = await res.json()
        const data = unwrap(json)
        addMessage({ ...data, sender_name: data.sender_detail?.full_name })
        setNewMsg('')
      }
    } catch (e) {}
  }

  async function postUpdate(e) {
    e.preventDefault()
    if (!newUpdate.trim()) return
    try {
      const res = await apiFetch('/profiles/channel-progress/', {
        method: 'POST',
        body: JSON.stringify({ channel: Number(id), content: newUpdate.trim() })
      })
      if (res.ok) {
        const json = await res.json()
        setUpdates(u => [...u, unwrap(json)])
        setNewUpdate('')
      }
    } catch (e) {}
  }

  if (!mounted || loading) return <div className="container"><div className="spinner">Loading…</div></div>

  if (!token) {
    return (
      <div className="container">
        <p><Link href="/login">Log in</Link> to view this channel.</p>
      </div>
    )
  }

  if (!channel) return <div className="container"><div className="empty-state"><p className="empty-text">Channel not found.</p></div></div>

  return (
    <div className="container">
      <header className="page-header">
        <h1>Channel</h1>
        <p className="tagline">
          {channel.founder_detail?.full_name} ↔ {channel.investor_detail?.full_name}
          {' · '}
          {connected ? (
            <span className="badge badge--teal">● Real-time</span>
          ) : (
            <span className="badge badge--muted">Fallback mode</span>
          )}
        </p>
      </header>

      <div className="channel-detail-grid">
        <section>
          <h3>Messages</h3>
          <div style={{ maxHeight: 300, overflowY: 'auto', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 12, marginBottom: 12, background: '#fafafa' }}>
            {messages.length === 0 ? <p className="meta">No messages yet.</p> : (
              messages.map(m => (
                <div key={m.id} style={{ marginBottom: 8, padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <strong>{m.sender_name}:</strong> {m.content}
                </div>
              ))
            )}
          </div>
          <form onSubmit={sendMessage} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..." style={{ flex: 1, minWidth: 0 }} />
            <button type="submit" className="btn">Send</button>
          </form>
        </section>

        <section>
          <h3>Progress updates</h3>
          <p className="meta">Founders can post updates here (visible only to channel members).</p>
          <div style={{ maxHeight: 300, overflowY: 'auto', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 12, marginBottom: 12, background: '#fafafa' }}>
            {updates.length === 0 ? <p className="meta">No updates yet.</p> : (
              updates.map(u => (
                <div key={u.id} style={{ marginBottom: 8, padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1.5px solid var(--teal)', borderLeftWidth: 3 }}>
                  <strong>{u.posted_by_detail?.full_name}:</strong> {u.content}
                </div>
              ))
            )}
          </div>
          <form onSubmit={postUpdate} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <textarea value={newUpdate} onChange={e => setNewUpdate(e.target.value)} placeholder="Post progress update..." rows={2} style={{ flex: 1, minWidth: 0 }} />
            <button type="submit" className="btn">Post</button>
          </form>
        </section>
      </div>
    </div>
  )
}
