import Head from 'next/head'
import Link from 'next/link'
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
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (mounted) setList(Array.isArray(data) ? data : []) })
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
        <h1>Notifications</h1>
        <p className="meta">Connection requests, accepted connections, and new channel messages.</p>

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
                style={{ opacity: n.read_at ? 0.8 : 1, borderLeft: n.read_at ? undefined : '3px solid var(--orange)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <strong>{n.title}</strong>
                    {n.message && <p className="meta" style={{ marginTop: 4 }}>{n.message}</p>}
                    <span className="meta" style={{ fontSize: '0.85rem' }}>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {n.link && <Link href={n.link}><button className="btn" onClick={() => markRead(n.id)}>View</button></Link>}
                    {!n.read_at && <button type="button" onClick={() => markRead(n.id)} style={{ background: 'transparent', border: '1px solid #ccc', borderRadius: 6, padding: '4px 8px', fontSize: '0.9rem' }}>Mark read</button>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p style={{ marginTop: 24 }}><Link href="/">Back to home</Link></p>
      </motion.main>
    </>
  )
}
