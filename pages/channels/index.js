import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { apiFetch, getToken, getUserId } from '../../lib/api'

const unwrap = json => { const r = json?.data ?? json; return Array.isArray(r) ? r : Array.isArray(r?.results) ? r.results : [] }

export default function ChannelsPage() {
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [token, setToken] = useState(null)
  const [userId, setUserId] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const t = getToken()
    const uid = getUserId()
    setToken(t)
    setUserId(uid)
    setMounted(true)
    if (!t) { setLoading(false); return }

    async function load() {
      try {
        const res = await apiFetch('/profiles/channels/')
        if (res.ok) {
          const items = unwrap(await res.json())
          setChannels(items)
        }
      } catch (e) {}
      setLoading(false)
    }
    load()
  }, [])

  if (!mounted || loading) return <div className="container"><div className="spinner">Loading…</div></div>

  if (!token) {
    return (
      <div className="container">
        <h2>Messages</h2>
        <p><Link href="/login">Log in</Link> to view your messages.</p>
      </div>
    )
  }

  function getOtherPerson(ch) {
    const uid = Number(userId)
    const founder = ch.founder_detail
    const investor = ch.investor_detail
    if (!founder && !investor) return null
    if (founder && Number(founder.id) === uid) return investor
    return founder
  }

  return (
    <div className="container">
      <header className="page-header">
        <h1>Messages</h1>
        <p className="tagline">Your direct conversations with founders and investors.</p>
      </header>

      {channels.length === 0 ? (
        <div className="empty-state">
          <p className="empty-text">No conversations yet. Browse <Link href="/founders" style={{ color: 'var(--blue)' }}>founders</Link> or <Link href="/investors" style={{ color: 'var(--blue)' }}>investors</Link> and send a message.</p>
        </div>
      ) : (
        <ul className="list">
          {channels.map(ch => {
            const other = getOtherPerson(ch)
            return (
              <li key={ch.id} className="list-item">
                <div className="list-item-row">
                  <div>
                    <strong>{other?.full_name || other?.email || `${ch.founder_detail?.full_name} ↔ ${ch.investor_detail?.full_name}`}</strong>
                    {other?.intended_role && (
                      <div className="meta" style={{ textTransform: 'capitalize' }}>{other.intended_role}</div>
                    )}
                  </div>
                  <Link href={`/channels/${ch.id}`} className="btn btn-sm">Open</Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

