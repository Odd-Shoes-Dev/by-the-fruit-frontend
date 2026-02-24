import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiFetch, getToken, getUserId } from '../lib/api'
import FluffyButton from './FluffyButton'

const unwrap = json => { const r = json?.data ?? json; return Array.isArray(r) ? r : Array.isArray(r?.results) ? r.results : r }

export default function ConnectionButtons({ targetUserId, viewerRole = 'investor' }) {
  const [connection, setConnection] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [token, setToken] = useState(null)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const t = getToken()
    const uid = getUserId()
    setToken(t)
    setUserId(uid)
    if (!t || !uid || !targetUserId) return

    apiFetch('/profiles/connections/')
      .then(r => r.ok ? r.json() : {})
      .then(json => {
        const data = unwrap(json)
        const list = Array.isArray(data) ? data : []
        const conn = list.find(c => {
          const inv = c.investor ?? c.investor_detail?.id
          const fnd = c.founder ?? c.founder_detail?.id
          return (Number(inv) === Number(uid) && Number(fnd) === Number(targetUserId)) ||
                 (Number(inv) === Number(targetUserId) && Number(fnd) === Number(uid))
        })
        setConnection(conn || null)
      })
      .catch(() => {})
  }, [targetUserId])

  async function markInterested() {
    setLoading(true); setError(null)
    try {
      const res = await apiFetch('/profiles/connections/interested/', {
        method: 'POST',
        body: JSON.stringify({ founder_id: targetUserId })
      })
      const json = await res.json()
      if (res.ok) setConnection(unwrap(json))
      else setError((unwrap(json))?.error || 'Failed')
    } catch (e) { setError('Network error') }
    setLoading(false)
  }

  async function requestConnect() {
    setLoading(true); setError(null)
    try {
      const res = await apiFetch('/profiles/connections/connect/', {
        method: 'POST',
        body: JSON.stringify({ founder_id: targetUserId })
      })
      const json = await res.json()
      if (res.ok) setConnection(unwrap(json))
      else setError((unwrap(json))?.error || 'Failed')
    } catch (e) { setError('Network error') }
    setLoading(false)
  }

  if (!token) {
    return (
      <FluffyButton href="/login" label="Log in to connect" width={180} height={40} strands={800} strandLen={6} fontSize={14} />
    )
  }

  if (!userId || String(userId) === String(targetUserId)) return null

  const status = connection?.status

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {error && <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{error}</span>}
      {status === 'connected' && (
        <FluffyButton href={`/channels?connection=${connection?.id}`} label="View channel" width={150} height={40} strands={700} strandLen={6} fontSize={14} />
      )}
      {status === 'connect_pending' && viewerRole === 'investor' && (
        <span style={{ color: 'var(--muted)' }}>Connect request pending</span>
      )}
      {status === 'rejected' && <span style={{ color: 'var(--muted)' }}>Connection declined</span>}
      {(!status || status === 'interested') && viewerRole === 'investor' && (
        <>
          {status !== 'interested' && (
            <FluffyButton onClick={markInterested} disabled={loading} label={loading ? '...' : 'Interested'} width={120} height={40} strands={700} strandLen={6} fontSize={14} />
          )}
          <FluffyButton onClick={requestConnect} disabled={loading} label={loading ? '...' : 'Connect'} width={120} height={40} strands={700} strandLen={6} fontSize={14} />
        </>
      )}
    </div>
  )
}
