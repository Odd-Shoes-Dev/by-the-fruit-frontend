import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiFetch, getToken } from '../lib/api'

export default function NotificationsPage() {
  const router = useRouter()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login')
      return
    }
    let mounted = true

    apiFetch('/profiles/notifications/')
      .then(r => r.ok ? r.json() : {})
      .then(json => {
        if (!mounted) return
        const raw = json?.data ?? json
        const items = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
        setList(items)

        // Auto mark all unread as read
        items.filter(n => !n.read_at).forEach(n => {
          apiFetch(`/profiles/notifications/${n.id}/`, {
            method: 'PATCH',
            body: JSON.stringify({})
          }).catch(() => {})
        })

        // Update list to show all as read immediately in UI
        if (mounted) setList(items.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [router])

  async function markRead(id) {
    try {
      const res = await apiFetch(`/profiles/notifications/${id}/`, { method: 'PATCH', body: JSON.stringify({}) })
      if (res.ok) {
        setList(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      }
    } catch (e) {}
  }

  if (!getToken()) return null

  return (
    <>
      <Head><title>Notifications — By The Fruit</title></Head>
      <motion.main className="container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <header>
          <h1>Notifications</h1>
          <p className="tagline">Connection requests, accepted connections, and new channel messages.</p>
        </header>

        {loading ? (
          <p>Loading…</p>
        ) : list.length === 0 ? (
          <p className="meta">No notifications yet.</p>
        ) : (
          <ul className="list" style={{ marginTop: 16 }}>
            {list.map(n => (
              <li
                key={n.id}
                className="list-item"
                style={{
                  opacity: n.read_at ? 0.7 : 1,
                  borderLeft: n.read_at ? '3px solid transparent' : '3px solid var(--orange)'
                }}
              >
                <div className="list-item-row">
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ color: n.read_at ? 'var(--muted)' : 'var(--dark)' }}>{n.title}</strong>
                    {n.message && <p className="meta" style={{ marginTop: 4 }}>{n.message}</p>}
                    <span className="meta" style={{ fontSize: '0.82rem' }}>
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="list-item-actions">
                    {n.link && (
                      <a href={n.link}>
                        <button className="btn" style={{ padding: '6px 14px', fontSize: '0.88rem' }}>
                          View
                        </button>
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.main>
    </>
  )
}
