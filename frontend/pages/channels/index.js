import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { apiFetch, getToken } from '../../lib/api'

export default function ChannelsPage() {
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const token = getToken()
  const router = useRouter()
  const connId = router.query.connection

  useEffect(() => {
    if (!token) return
    async function load() {
      try {
        const res = await apiFetch('/profiles/channels/')
        if (res.ok) {
          const data = await res.json()
          setChannels(data)
          if (connId && data.length > 0) {
            const ch = data.find(c => c.connection === Number(connId))
            if (ch) router.replace(`/channels/${ch.id}`)
          }
        }
      } catch (e) {}
      setLoading(false)
    }
    load()
  }, [token, connId])

  if (!token) {
    return (
      <div className="container">
        <h2>Channels</h2>
        <p><Link href="/login">Log in</Link> to view your channels.</p>
      </div>
    )
  }

  return (
    <div className="container">
      <h2>My channels</h2>
      <p className="meta">Private channels with connected founders and investors.</p>

      {loading ? <p>Loading…</p> : channels.length === 0 ? (
        <p>No channels yet. Connect with a founder or investor to create one.</p>
      ) : (
        <ul className="list">
          {channels.map(ch => (
            <li key={ch.id} className="list-item">
              <Link href={`/channels/${ch.id}`}>
                <strong>{ch.founder_detail?.full_name} ↔ {ch.investor_detail?.full_name}</strong>
              </Link>
              <Link href={`/channels/${ch.id}`}><button className="btn" style={{ marginTop: 8 }}>Open</button></Link>
            </li>
          ))}
        </ul>
      )}

      <p style={{ marginTop: 24 }}><Link href="/connections">View connections</Link> · <Link href="/">Back</Link></p>
    </div>
  )
}
