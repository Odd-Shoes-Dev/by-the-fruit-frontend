import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiFetch, getToken, getUserId } from '../lib/api'

/**
 * Shows Interested / Connect buttons when viewing a founder (as investor)
 * targetUserId: the founder's user id
 * viewerRole: 'investor' | 'founder' - who is viewing (investor sees buttons)
 */
export default function ConnectionButtons({ targetUserId, viewerRole = 'investor' }) {
  const [connection, setConnection] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const token = getToken()
  const userId = getUserId()

  useEffect(() => {
    if (!token || !userId || !targetUserId) return
    async function load() {
      try {
        const res = await apiFetch('/profiles/connections/')
        if (!res.ok) return
        const data = await res.json()
        const conn = data.find(c => {
          const inv = c.investor ?? c.investor_detail?.id
          const fnd = c.founder ?? c.founder_detail?.id
          return (Number(inv) === Number(userId) && Number(fnd) === Number(targetUserId)) ||
                 (Number(inv) === Number(targetUserId) && Number(fnd) === Number(userId))
        })
        setConnection(conn || null)
      } catch (e) {}
    }
    load()
  }, [token, userId, targetUserId])

  async function markInterested() {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/profiles/connections/interested/', {
        method: 'POST',
        body: JSON.stringify({ founder_id: targetUserId })
      })
      if (res.ok) {
        const data = await res.json()
        setConnection(data)
      } else {
        const err = await res.json()
        setError(err.error || 'Failed')
      }
    } catch (e) {
      setError('Network error')
    }
    setLoading(false)
  }

  async function requestConnect() {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/profiles/connections/connect/', {
        method: 'POST',
        body: JSON.stringify({ founder_id: targetUserId })
      })
      if (res.ok) {
        const data = await res.json()
        setConnection(data)
      } else {
        const err = await res.json()
        setError(err.error || 'Failed')
      }
    } catch (e) {
      setError('Network error')
    }
    setLoading(false)
  }

  if (!token) {
    return (
      <div className="connection-buttons">
        <Link href="/login">
          <button className="btn" style={{ marginRight: 8 }}>Log in to connect</button>
        </Link>
      </div>
    )
  }

  if (!userId || userId === targetUserId) return null

  const status = connection?.status

  return (
    <div className="connection-buttons" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {error && <span style={{ color: 'var(--muted)', fontSize: 0.9 }}>{error}</span>}
      {status === 'connected' && (
        <Link href={`/channels?connection=${connection?.id}`}>
          <button className="btn">View channel</button>
        </Link>
      )}
      {status === 'connect_pending' && viewerRole === 'investor' && (
        <span style={{ color: 'var(--muted)' }}>Connect request pending</span>
      )}
      {status === 'rejected' && <span style={{ color: 'var(--muted)' }}>Connection declined</span>}
      {(!status || status === 'interested') && viewerRole === 'investor' && (
        <>
          {status !== 'interested' && (
            <button className="btn" onClick={markInterested} disabled={loading}>
              {loading ? '...' : 'Interested'}
            </button>
          )}
          <button
            className="btn"
            style={{ background: status === 'interested' ? 'var(--orange)' : '#fff', color: status === 'interested' ? '#fff' : 'var(--orange)', border: '1px solid var(--orange)' }}
            onClick={requestConnect}
            disabled={loading}
          >
            {loading ? '...' : 'Connect'}
          </button>
        </>
      )}
    </div>
  )
}
