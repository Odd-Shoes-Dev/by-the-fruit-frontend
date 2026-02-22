import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch, getToken } from '../lib/api'

export default function ConnectionsPage() {
  const [connections, setConnections] = useState([])
  const [pending, setPending] = useState([])
  const [interested, setInterested] = useState([])
  const [loading, setLoading] = useState(true)
  const token = getToken()

  useEffect(() => {
    if (!token) return
    async function load() {
      try {
        const [connRes, pendRes, intRes] = await Promise.all([
          apiFetch('/profiles/connections/'),
          apiFetch('/profiles/connections/pending-for-me/'),
          apiFetch('/profiles/connections/interested-in-me/')
        ])
        if (connRes.ok) setConnections(await connRes.json())
        if (pendRes.ok) setPending(await pendRes.json())
        if (intRes.ok) setInterested(await intRes.json())
      } catch (e) {}
      setLoading(false)
    }
    load()
  }, [token])

  async function acceptConnection(connId) {
    try {
      const res = await apiFetch(`/profiles/connections/${connId}/accept/`, { method: 'POST' })
      if (res.ok) {
        setPending(p => p.filter(c => c.id !== connId))
        setConnections(c => [...c, await res.json()])
      }
    } catch (e) {}
  }

  async function rejectConnection(connId) {
    try {
      const res = await apiFetch(`/profiles/connections/${connId}/reject/`, { method: 'POST' })
      if (res.ok) setPending(p => p.filter(c => c.id !== connId))
    } catch (e) {}
  }

  if (!token) {
    return (
      <div className="container">
        <h2>Connections</h2>
        <p><Link href="/login">Log in</Link> to view your connections.</p>
      </div>
    )
  }

  return (
    <div className="container">
      <h2>Connections</h2>

      {loading ? <p>Loading…</p> : (
        <>
          {pending.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <h3>Connect requests (accept or reject)</h3>
              <ul className="list">
                {pending.map(c => (
                  <li key={c.id} className="list-item">
                    <strong>{c.investor_detail?.full_name || c.investor_detail?.email || 'Investor'}</strong>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button className="btn" onClick={() => acceptConnection(c.id)}>Accept</button>
                      <button className="btn" style={{ background: '#fff', color: 'var(--muted)', border: '1px solid #ddd' }} onClick={() => rejectConnection(c.id)}>Reject</button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {interested.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <h3>Investors interested in you</h3>
              <ul className="list">
                {interested.filter(c => c.status === 'interested').map(c => (
                  <li key={c.id} className="list-item">
                    <Link href={`/profile/${c.investor_detail?.id || c.investor}`}>
                      <strong>{c.investor_detail?.full_name || c.investor_detail?.email}</strong>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h3>Connected</h3>
            {connections.filter(c => c.status === 'connected').length === 0 ? (
              <p className="meta">No connections yet.</p>
            ) : (
              <ul className="list">
                {connections.filter(c => c.status === 'connected').map(c => (
                  <li key={c.id} className="list-item">
                    <Link href={`/channels?connection=${c.id}`}>
                      <strong>
                        {c.investor_detail?.full_name} ↔ {c.founder_detail?.full_name}
                      </strong>
                    </Link>
                    <Link href={`/channels?connection=${c.id}`}><button className="btn" style={{ marginTop: 8 }}>Open channel</button></Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <p style={{ marginTop: 24 }}><Link href="/">Back</Link></p>
    </div>
  )
}
