import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { apiFetch, getToken } from '../../lib/api'

const unwrap = json => { const r = json?.data ?? json; return Array.isArray(r) ? r : Array.isArray(r?.results) ? r.results : [] }

export default function ChannelsPage() {
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [token, setToken] = useState(null)
  const router = useRouter()
  const connId = router.query.connection

  useEffect(() => {
    const t = getToken()
    setToken(t)
    setMounted(true)
    if (!t) { setLoading(false); return }

    async function load() {
      try {
        const res = await apiFetch('/profiles/channels/')
        if (res.ok) {
          const items = unwrap(await res.json())
          setChannels(items)
          if (connId && items.length > 0) {
            const ch = items.find(c => c.connection === Number(connId))
            if (ch) router.replace(`/channels/${ch.id}`)
          }
        }
      } catch (e) {}
      setLoading(false)
    }
    load()
  }, [connId])

  if (!mounted || loading) return <div className="container"><p>Loading…</p></div>

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
      <header>
        <h1>My Channels</h1>
        <p className="tagline">Private channels with connected founders and investors.</p>
      </header>

      {channels.length === 0 ? (
        <p className="meta">No channels yet. Connect with a founder or investor to create one.</p>
      ) : (
        <ul className="list">
          {channels.map(ch => (
            <li key={ch.id} className="list-item">
              <div className="list-item-row">
                <strong>{ch.founder_detail?.full_name} ↔ {ch.investor_detail?.full_name}</strong>
                <Link href={`/channels/${ch.id}`}><button className="btn">Open</button></Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
