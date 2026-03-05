import { useEffect } from 'react'
import { useRouter } from 'next/router'

// Connections are now frictionless — investor messages founder directly,
// channel opens immediately. This page redirects to /channels.
export default function ConnectionsPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/channels')
  }, [])
  return null
}


export default function ConnectionsPage() {
  const [connections, setConnections] = useState([])
  const [pending, setPending] = useState([])
  const [interested, setInterested] = useState([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const t = getToken()
    setToken(t)
    if (!t) {
      setLoading(false)
      return
    }
    async function load() {
      try {
        const [connRes, pendRes, intRes] = await Promise.all([
          apiFetch('/profiles/connections/'),
          apiFetch('/profiles/connections/pending-for-me/'),
          apiFetch('/profiles/connections/interested-in-me/')
        ])
        if (connRes.ok) setConnections(unwrap(await connRes.json()))
        if (pendRes.ok) setPending(unwrap(await pendRes.json()))
        if (intRes.ok) setInterested(unwrap(await intRes.json()))
      } catch (e) {}
      setLoading(false)
    }
    load()
  }, [])

  async function acceptConnection(connId) {
    try {
      const res = await apiFetch(`/profiles/connections/${connId}/accept/`, { method: 'POST' })
      if (res.ok) {
        const newConn = (json => json?.data ?? json)(await res.json())
        setPending(p => p.filter(c => c.id !== connId))
        setConnections(c => [...c, newConn])
      }
    } catch (e) {}
  }

  async function rejectConnection(connId) {
    try {
      const res = await apiFetch(`/profiles/connections/${connId}/reject/`, { method: 'POST' })
      if (res.ok) setPending(p => p.filter(c => c.id !== connId))
    } catch (e) {}
  }

  if (loading) return <div className="container"><div className="spinner">Loading…</div></div>

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
      <header className="page-header">
        <h1>Connections</h1>
        <p className="tagline">Manage your connection requests and connected members.</p>
      </header>

      {pending.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h3>Connect requests (accept or reject)</h3>
          <ul className="list">
            {pending.map(c => (
              <li key={c.id} className="list-item">
                <div className="list-item-row">
                  <strong>{c.investor_detail?.full_name || c.investor_detail?.email || 'Investor'}</strong>
                  <div className="list-item-actions">
                    <button className="btn btn-sm" onClick={() => acceptConnection(c.id)}>Accept</button>
                    <button className="btn-ghost btn-sm" onClick={() => rejectConnection(c.id)}>Reject</button>
                  </div>
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
                <Link href={`/channels?connection=${c.id}`} className="btn btn-sm" style={{ marginTop: 8 }}>Open channel</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
