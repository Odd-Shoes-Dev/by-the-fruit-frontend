import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiFetch, getToken, getUserId } from '../lib/api'
import FluffyButton from './FluffyButton'
import { FiMessageCircle } from 'react-icons/fi'

const iconBtnStyle = (bg) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 36, height: 36, borderRadius: '50%', border: 'none',
  background: bg, color: '#fff', cursor: 'pointer', flexShrink: 0
})

const unwrap = json => { const r = json?.data ?? json; return Array.isArray(r) ? r : Array.isArray(r?.results) ? r.results : r }

export default function ConnectionButtons({ targetUserId, viewerRole = 'investor', iconOnly = false }) {
  const [connection, setConnection] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [token, setToken] = useState(null)
  const [userId, setUserId] = useState(null)
  const router = useRouter()

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

  async function openChannel() {
    setLoading(true); setError(null)
    try {
      // If already connected, navigate straight to the channel
      if (connection?.status === 'connected') {
        // Try to find channel id from connection or fetch channels
        if (connection?.channel_id) {
          router.push(`/channels/${connection.channel_id}`)
          return
        }
        const res = await apiFetch('/profiles/channels/')
        if (res.ok) {
          const items = unwrap(await res.json())
          const ch = items.find(c => c.connection === connection.id)
          if (ch) { router.push(`/channels/${ch.id}`); return }
        }
        router.push('/channels')
        return
      }
      // Not connected yet — auto-connect and open channel immediately
      const res = await apiFetch('/profiles/connections/connect/', {
        method: 'POST',
        body: JSON.stringify({ founder_id: targetUserId })
      })
      const json = await res.json()
      if (res.ok) {
        const data = unwrap(json)
        setConnection(data)
        const channelId = data.channel_id
        if (channelId) {
          router.push(`/channels/${channelId}`)
        } else {
          router.push('/channels')
        }
      } else {
        setError((unwrap(json))?.error || 'Failed to open channel')
      }
    } catch (e) { setError('Network error') }
    setLoading(false)
  }

  if (!token) {
    return (
      <FluffyButton href="/login" label="Log in to message" width={180} height={40} strands={800} strandLen={6} fontSize={14} />
    )
  }

  if (!userId || String(userId) === String(targetUserId)) return null

  const status = connection?.status

  if (iconOnly) {
    return (
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {error && <span title={error} style={{ color: 'red', fontSize: '0.8rem' }}>!</span>}
        <button
          onClick={openChannel}
          disabled={loading}
          title={status === 'connected' ? 'Open channel' : 'Message'}
          style={iconBtnStyle(status === 'connected' ? '#4F6BD9' : '#F5A623')}
        >
          <FiMessageCircle size={17} />
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {error && <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{error}</span>}
      {status === 'connected' ? (
        <FluffyButton
          onClick={openChannel}
          disabled={loading}
          label={loading ? '…' : 'Open channel'}
          width={125} height={36} strands={700} strandLen={6} fontSize={13}
          color="#4F6BD9"
        />
      ) : (
        <FluffyButton
          onClick={openChannel}
          disabled={loading}
          label={loading ? 'Opening…' : 'Message'}
          width={100} height={36} strands={800} strandLen={6} fontSize={13}
          color="#F5A623"
        />
      )}
    </div>
  )
}

