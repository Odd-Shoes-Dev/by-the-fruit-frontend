import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { apiFetch, getToken, getUserId } from '../../lib/api'
import { useChannelChat } from '../../lib/useChannelChat'
import FluffyButton from '../../components/FluffyButton'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB

const unwrap = json => { const r = json?.data ?? json; return Array.isArray(r) ? r : Array.isArray(r?.results) ? r.results : r }

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function linkify(text) {
  if (!text) return null
  const urlRegex = /(https?:\/\/[^\s<>"]+)/g
  const parts = text.split(urlRegex)
  return parts.map((part, i) =>
    urlRegex.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', wordBreak: 'break-all' }}>{part}</a>
      : part
  )
}

function MessageContent({ msg }) {
  if (msg.image_url) {
    return (
      <div>
        <img
          src={msg.image_url}
          alt="image"
          style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 10, cursor: 'pointer', display: 'block' }}
          onClick={() => window.open(msg.image_url, '_blank')}
        />
        {msg.content && <p style={{ marginTop: 6, marginBottom: 0 }}>{linkify(msg.content)}</p>}
      </div>
    )
  }
  if (msg.video_url) {
    return (
      <div>
        <video
          src={msg.video_url}
          controls
          style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 10, display: 'block' }}
        />
        {msg.content && <p style={{ marginTop: 6, marginBottom: 0 }}>{linkify(msg.content)}</p>}
      </div>
    )
  }
  if (msg.file_url) {
    const fileName = decodeURIComponent(msg.file_url.split('/').pop().split('?')[0]) || 'Download file'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1.3rem' }}>📎</span>
        <a
          href={msg.file_url}
          target="_blank"
          rel="noopener noreferrer"
          download
          style={{ color: 'inherit', textDecoration: 'underline', wordBreak: 'break-all' }}
        >
          {fileName}
        </a>
      </div>
    )
  }
  return <span style={{ whiteSpace: 'pre-wrap' }}>{linkify(msg.content)}</span>
}

export default function ChannelDetailPage() {
  const [channel, setChannel] = useState(null)
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [token, setToken] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [sending, setSending] = useState(false)
  // attachment: { file, previewUrl, kind: 'image'|'video'|'file' } | null
  const [attachment, setAttachment] = useState(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const router = useRouter()
  const { id } = router.query
  const { messages, connected, send: wsSend, addMessage } = useChannelChat(id)

  useEffect(() => {
    const t = getToken()
    const uid = getUserId()
    setToken(t)
    setCurrentUserId(uid)
    setMounted(true)
    if (!t || !id) { setLoading(false); return }

    apiFetch(`/profiles/channels/${id}/`)
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json) setChannel(unwrap(json)) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      alert('File is too large. Maximum allowed size is 100 MB.')
      e.target.value = ''
      return
    }
    const kind = file.type.startsWith('image/') ? 'image'
      : file.type.startsWith('video/') ? 'video'
      : 'file'
    const previewUrl = (kind === 'image' || kind === 'video') ? URL.createObjectURL(file) : null
    setAttachment({ file, previewUrl, kind })
    e.target.value = ''
  }

  function clearAttachment() {
    if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl)
    setAttachment(null)
  }

  async function sendMessage(e) {
    e?.preventDefault()
    const content = newMsg.trim()
    if ((!content && !attachment) || sending) return

    setSending(true)
    setNewMsg('')
    const currentAttachment = attachment
    setAttachment(null)

    try {
      if (currentAttachment) {
        // Media upload — must use FormData + direct fetch (apiFetch forces JSON Content-Type)
        const formData = new FormData()
        formData.append('channel', id)
        if (content) formData.append('content', content)
        const fieldName = currentAttachment.kind === 'image' ? 'image'
          : currentAttachment.kind === 'video' ? 'video'
          : 'file'
        formData.append(fieldName, currentAttachment.file)
        const res = await fetch(`${API_BASE}/profiles/channel-messages/`, {
          method: 'POST',
          headers: { 'Authorization': `Token ${token}` },
          body: formData,
        })
        if (res.ok) {
          const json = await res.json()
          const raw = unwrap(json)
          const data = Array.isArray(raw) ? raw[0] : raw
          addMessage({ ...data, sender_name: data.sender_detail?.full_name })
        }
      } else {
        // Text-only — try WebSocket first, fall back to REST
        const sent = connected && wsSend(content)
        if (!sent) {
          const res = await apiFetch('/profiles/channel-messages/', {
            method: 'POST',
            body: JSON.stringify({ channel: Number(id), content })
          })
          if (res.ok) {
            const json = await res.json()
            const data = unwrap(json)
            addMessage({ ...data, sender_name: data.sender_detail?.full_name })
          }
        }
      }
    } catch (err) {
      console.error('Send error:', err)
    }

    if (currentAttachment?.previewUrl) URL.revokeObjectURL(currentAttachment.previewUrl)
    setSending(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!mounted || loading) return <div className="container"><div className="spinner">Loading…</div></div>

  if (!token) {
    return (
      <div className="container">
        <p><Link href="/login">Log in</Link> to view this conversation.</p>
      </div>
    )
  }

  if (!channel) return <div className="container"><div className="empty-state"><p className="empty-text">Conversation not found.</p></div></div>

  const otherPerson = Number(channel.founder_detail?.id) === Number(currentUserId)
    ? channel.investor_detail
    : channel.founder_detail

  const canSend = !sending && (!!newMsg.trim() || !!attachment)

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      {/* Header */}
      <header className="page-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #4F6BD9, #F5A623)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: '1.15rem'
          }}>
            {(otherPerson?.full_name || '?')[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{ margin: 0 }}>{otherPerson?.full_name || 'Conversation'}</h1>
            <span style={{ fontSize: '0.82rem' }}>
              {connected
                ? <span style={{ color: '#15803d' }}>● Online</span>
                : <span style={{ color: 'var(--muted)' }}>● Offline</span>}
            </span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div style={{
        height: 500,
        overflowY: 'auto',
        border: '1.5px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '20px 16px',
        background: 'var(--dark2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        marginBottom: 16
      }}>
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ fontSize: '2rem' }}>💬</div>
            <p className="meta" style={{ textAlign: 'center', margin: 0 }}>No messages yet</p>
            <p style={{ fontSize: '0.85rem', opacity: 0.5, textAlign: 'center', margin: 0 }}>Say hello to get the conversation started!</p>
          </div>
        ) : (
          messages.map(m => {
            const isSent = currentUserId && Number(m.sender) === Number(currentUserId)
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: isSent ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                {!isSent && (
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #4F6BD9, #F5A623)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '0.8rem'
                  }}>
                    {(m.sender_name || '?')[0].toUpperCase()}
                  </div>
                )}
                <div style={{ maxWidth: '68%' }}>
                  {!isSent && (
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 3, paddingLeft: 4, opacity: 0.65 }}>
                      {m.sender_name}
                    </div>
                  )}
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: isSent ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    background: isSent ? '#4F6BD9' : 'rgba(244,239,230,0.12)',
                    border: isSent ? 'none' : '1px solid var(--border)',
                    color: isSent ? '#fff' : 'inherit',
                    wordBreak: 'break-word',
                    lineHeight: 1.55
                  }}>
                    <MessageContent msg={m} />
                  </div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.45, marginTop: 4, textAlign: isSent ? 'right' : 'left', paddingLeft: isSent ? 0 : 4 }}>
                    {formatTime(m.created_at)}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment preview bar */}
      {attachment && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 12px', marginBottom: 10,
          background: 'var(--dark2)', border: '1px solid var(--border)',
          borderRadius: 10, fontSize: '0.88rem'
        }}>
          {attachment.kind === 'image' && (
            <img src={attachment.previewUrl} alt="preview" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
          )}
          {attachment.kind === 'video' && <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>🎬</span>}
          {attachment.kind === 'file' && <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>📄</span>}
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {attachment.file.name}
            <span style={{ opacity: 0.5, marginLeft: 6, fontSize: '0.78rem' }}>
              ({(attachment.file.size / (1024 * 1024)).toFixed(1)} MB)
            </span>
          </span>
          <button
            type="button"
            onClick={clearAttachment}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--muted)', padding: 0 }}
            aria-label="Remove attachment"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,*/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        {/* Attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Attach image, video, or file (max 100 MB)"
          style={{
            background: 'none',
            border: '1.5px solid var(--border)',
            borderRadius: 10,
            padding: '0 12px',
            height: 44,
            cursor: 'pointer',
            fontSize: '1.2rem',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--muted)',
          }}
        >
          📎
        </button>
        <textarea
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={2}
          style={{ flex: 1, minWidth: 0, resize: 'none', borderRadius: 12, padding: '10px 14px', fontSize: '0.95rem' }}
        />
        <FluffyButton
          type="submit"
          label={sending ? '…' : 'Send'}
          disabled={!canSend}
          width={88} height={44} strands={600} strandLen={6} fontSize={14}
          color="#F5A623"
        />
      </form>
      <p className="meta" style={{ marginTop: 6, fontSize: '0.78rem' }}>
        Enter to send · Shift+Enter for new line · 📎 attach files (max 100 MB)
      </p>
    </div>
  )
}
