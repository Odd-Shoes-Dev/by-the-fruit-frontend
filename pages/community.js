import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMessageSquare, FiMic, FiPlay, FiXCircle, FiPlus, FiCheck, FiSettings, FiTrash2 } from 'react-icons/fi'
import PostForm from '../components/PostForm'
import PostList from '../components/PostList'
import { apiFetch, getToken, isAdmin } from '../lib/api'
import { useEventChat } from '../lib/useEventChat'
import FluffyBtn from '../components/FluffyBtn'

// ─── YouTube embed helper ────────────────────────────────────────────────────
// Accepts any YouTube URL format and returns a privacy-neutral embed URL.
// All branding/related-video chrome is suppressed so the player looks native.
function getYouTubeEmbedUrl(url, autoplay = false) {
  if (!url) return null
  try {
    const u = new URL(url)
    let videoId = null

    if (u.hostname === 'youtu.be') {
      // https://youtu.be/VIDEO_ID
      videoId = u.pathname.replace('/', '')
    } else if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/live/')) {
        // https://www.youtube.com/live/VIDEO_ID
        videoId = u.pathname.split('/live/')[1]?.split('/')[0]
      } else if (u.searchParams.get('v')) {
        // https://www.youtube.com/watch?v=VIDEO_ID
        videoId = u.searchParams.get('v')
      } else if (u.pathname.startsWith('/embed/')) {
        // Already an embed URL
        videoId = u.pathname.split('/embed/')[1]?.split('/')[0]
      }
    }

    if (!videoId) return null

    const params = new URLSearchParams({
      modestbranding: '1',  // suppress YouTube logo
      rel:            '0',  // no related videos at the end
      showinfo:       '0',  // hide video title bar
      iv_load_policy: '3',  // hide annotations
      color:          'white',
      ...(autoplay ? { autoplay: '1', mute: '1' } : {}),
    })
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
  } catch {
    return null
  }
}

// ─── Event Live Chat ────────────────────────────────────────────────────────────────

function EventLiveChat({ eventId, status }) {
  const token = getToken()
  const { messages, connected, send } = useEventChat(eventId, status)
  const [text, setText] = useState('')
  const [open, setOpen] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (open && bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const handleSend = () => {
    if (!text.trim() || !connected) return
    send(text.trim())
    setText('')
  }

  if (!messages.length && status !== 'live') return null

  return (
    <div style={{ marginTop: 16, border: '1px solid #e8e8ff', borderRadius: 10, overflow: 'hidden', background: '#fafaff' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', color: '#444' }}
      >
        <span>
          <FiMessageSquare size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          {status === 'live' ? 'Live Chat' : 'Chat Replay'}
          {status === 'live' && connected && (
            <span style={{ marginLeft: 8, background: '#22c478', color: '#fff', fontSize: '0.72rem', borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>LIVE</span>
          )}
        </span>
        <span style={{ color: '#bbb', fontSize: '1.1rem' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ borderTop: '1px solid #e8e8ff' }}>
          <div style={{ maxHeight: 240, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.length === 0 && (
              <p style={{ margin: 0, fontSize: '0.83rem', color: '#bbb', textAlign: 'center', padding: '16px 0' }}>
                {status === 'live' ? 'Be the first to comment…' : 'No chat messages recorded.'}
              </p>
            )}
            {messages.map((m, i) => (
              <div key={m.id || i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#6c47ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                  {(m.user_detail?.display_name || m.username || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#555' }}>{m.user_detail?.display_name || m.username || 'User'}</span>
                  <p style={{ margin: '2px 0 0', fontSize: '0.87rem', lineHeight: 1.4, wordBreak: 'break-word' }}>{m.content}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          {status === 'live' && token && (
            <div style={{ borderTop: '1px solid #e8e8ff', padding: '8px 12px', display: 'flex', gap: 8 }}>
              <input
                style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 20, fontSize: '0.87rem', outline: 'none', fontFamily: 'inherit' }}
                placeholder={connected ? 'Say something…' : 'Connecting…'}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                disabled={!connected}
              />
              <button
                onClick={handleSend}
                disabled={!connected || !text.trim()}
                style={{ padding: '8px 14px', background: '#6c47ff', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0, opacity: connected && text.trim() ? 1 : 0.5 }}
              >
                Send
              </button>
            </div>
          )}
          {status === 'live' && !token && (
            <p style={{ margin: 0, padding: '8px 14px', fontSize: '0.82rem', color: '#888', borderTop: '1px solid #e8e8ff', textAlign: 'center' }}>
              <a href="/login" style={{ color: '#6c47ff', fontWeight: 600 }}>Sign in</a> to join the conversation.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Manage Event Modal (admin only) ───────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Upcoming',  color: '#22a366', hint: 'Event is scheduled. Visible but not yet live.' },
  { value: 'live',      label: 'Live Now',  color: '#ff6b2b', hint: 'Marks the event as live — the YouTube embed will appear immediately for all users.' },
  { value: 'ended',     label: 'Ended',     color: '#6c47ff', hint: 'Event is over. The recording URL is auto-filled from the stream URL — YouTube keeps the video at the same link after a live ends. You can change it if needed.' },
  { value: 'cancelled', label: 'Cancelled', color: '#999',    hint: 'Event is cancelled. It will disappear from all public views.' },
]

function ManageEventModal({ event, onClose, onSaved, onDeleted }) {
  const [form, setForm]       = useState({
    status:              event.status              || 'scheduled',
    stream_url:          event.stream_url          || '',
    recording_url:       event.recording_url       || '',
    presenter_join_link: event.presenter_join_link || '',
    guest_name:          event.guest_name          || '',
    guest_bio:           event.guest_bio           || '',
  })
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirm,  setConfirm]  = useState(false) // confirm-delete state
  const [serverErr, setServerErr] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // When switching to 'ended', auto-fill recording_url from stream_url
  // if recording_url hasn't been set yet. YouTube keeps the livestream
  // video at the exact same URL after the stream ends.
  const setStatus = (val) => setForm(f => ({
    ...f,
    status: val,
    recording_url:
      val === 'ended' && !f.recording_url.trim() && f.stream_url.trim()
        ? f.stream_url.trim()
        : f.recording_url,
  }))

  const currentStatus = STATUS_OPTIONS.find(s => s.value === form.status)

  const save = async () => {
    setSaving(true)
    setServerErr('')
    try {
      const payload = {
        status:              form.status,
        stream_url:          form.stream_url.trim()          || null,
        recording_url:       form.recording_url.trim()       || null,
        presenter_join_link: form.presenter_join_link.trim() || null,
        guest_name:          form.guest_name.trim()          || null,
        guest_bio:           form.guest_bio.trim()           || null,
      }
      const res = await apiFetch(`/profiles/events/${event.id}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      if (res.ok) { onSaved(); onClose() }
      else {
        const d = await res.json()
        setServerErr(d?.detail || Object.values(d).flat().join(' ') || 'Save failed.')
      }
    } catch { setServerErr('Network error. Please try again.') }
    finally { setSaving(false) }
  }

  const destroy = async () => {
    setDeleting(true)
    try {
      const res = await apiFetch(`/profiles/events/${event.id}/`, { method: 'DELETE' })
      if (res.ok || res.status === 204) { onDeleted(); onClose() }
      else setServerErr('Delete failed. Please try again.')
    } catch { setServerErr('Network error.') }
    finally { setDeleting(false) }
  }

  const inp = { display: 'block', width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 7, fontSize: '0.94rem', boxSizing: 'border-box', outline: 'none', marginTop: 6, fontFamily: 'inherit' }
  const lbl = { display: 'block', fontWeight: 600, fontSize: '0.84rem', color: '#555', marginBottom: 2 }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.18 }}
        style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, padding: '26px 28px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Manage Competition</h2>
            <p style={{ margin: '3px 0 0', fontSize: '0.83rem', color: '#aaa', maxWidth: 340 }}>{event.title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#bbb', lineHeight: 1, padding: 0, flexShrink: 0 }}>&times;</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Status */}
          <div>
            <label style={lbl}>Status</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  style={{
                    padding: '7px 16px', borderRadius: 20, fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer',
                    border: `2px solid ${form.status === opt.value ? opt.color : '#e0e0e0'}`,
                    background: form.status === opt.value ? opt.color : '#fafafa',
                    color: form.status === opt.value ? '#fff' : '#666',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {currentStatus && (
              <p style={{ margin: '8px 0 0', fontSize: '0.81rem', color: '#888', lineHeight: 1.5 }}>
                {currentStatus.hint}
              </p>
            )}
          </div>

          {/* Stream URL */}
          <div>
            <label style={lbl}>YouTube live URL</label>
            <input
              style={inp}
              placeholder="https://www.youtube.com/watch?v=…"
              value={form.stream_url}
              onChange={e => set('stream_url', e.target.value)}
            />
            <p style={{ margin: '4px 0 0', fontSize: '0.79rem', color: '#aaa' }}>
              Set this before going live — the player embeds automatically when status is <strong>Live Now</strong>.
            </p>
          </div>

          {/* Recording URL */}
          <div>
            <label style={lbl}>Recording URL</label>
            <input
              style={inp}
              placeholder="https://www.youtube.com/watch?v=…"
              value={form.recording_url}
              onChange={e => set('recording_url', e.target.value)}
            />
            <p style={{ margin: '4px 0 0', fontSize: '0.79rem', color: '#aaa' }}>
              YouTube keeps the livestream video at the same URL after it ends — this is auto-filled from the stream URL when you mark the event as Ended. The recording embeds under <strong>Past Competitions</strong> so users can rewatch it any time.
            </p>
          </div>

          {/* Presenter join link */}
          <div>
            <label style={lbl}>Presenter join link</label>
            <input
              style={inp}
              placeholder="https://zoom.us/j/… or https://meet.google.com/…"
              value={form.presenter_join_link}
              onChange={e => set('presenter_join_link', e.target.value)}
            />
            <p style={{ margin: '4px 0 0', fontSize: '0.79rem', color: '#aaa' }}>
              Private backstage URL — only shown to registered participants and admins.
            </p>
          </div>

          {/* Guest speaker */}
          <div>
            <label style={lbl}>Guest speaker name <span style={{ color: '#bbb', fontWeight: 400 }}>(optional)</span></label>
            <input
              style={inp}
              placeholder="e.g. Jane Smith, CEO of Acme"
              value={form.guest_name}
              onChange={e => set('guest_name', e.target.value)}
            />
          </div>
          <div>
            <label style={lbl}>Guest speaker bio <span style={{ color: '#bbb', fontWeight: 400 }}>(optional)</span></label>
            <textarea
              style={{ ...inp, minHeight: 72, resize: 'vertical' }}
              placeholder="Short bio shown on the competition card…"
              value={form.guest_bio}
              onChange={e => set('guest_bio', e.target.value)}
            />
          </div>

          {serverErr && (
            <div style={{ padding: '10px 14px', background: '#fff5f5', border: '1px solid #fcc', borderRadius: 8, fontSize: '0.85rem', color: '#c00' }}>
              {serverErr}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingTop: 4 }}>
            {/* Delete / confirm delete */}
            {!confirm ? (
              <button
                onClick={() => setConfirm(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #fcc', color: '#c00', borderRadius: 8, padding: '7px 14px', fontSize: '0.83rem', cursor: 'pointer', fontWeight: 600 }}
              >
                <FiTrash2 size={13} /> Delete
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.82rem', color: '#c00', fontWeight: 600 }}>Delete?</span>
                <button
                  onClick={destroy}
                  disabled={deleting}
                  style={{ background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: '0.83rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  {deleting ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button
                  onClick={() => setConfirm(false)}
                  style={{ background: 'none', border: '1px solid #ddd', borderRadius: 8, padding: '7px 14px', fontSize: '0.83rem', cursor: 'pointer', color: '#666' }}
                >
                  No
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onClose} className="btn-outline btn-sm" style={{ minWidth: 72 }}>Cancel</button>
              <button onClick={save} className="btn btn-sm" disabled={saving} style={{ minWidth: 100 }}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Pitch Competition Card ────────────────────────────────────────────────────

function PitchCard({ event, token, admin, onManage }) {
  const isLive = event.status === 'live'
  const isRecording = event.status === 'ended' && event.recording_url
  const isUpcoming = event.status === 'scheduled'
  const dateStr = new Date(event.starts_at).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return (
    <motion.article
      className="card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      style={{
        borderLeft: isLive ? '4px solid var(--orange)' : isRecording ? '4px solid #6c47ff' : '4px solid #ccc',
        padding: '18px 20px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          {isLive && (
            <span className="badge badge--orange">
              <span className="badge-dot" style={{ animation: 'pulse 1.2s infinite' }} />
              Live Now
            </span>
          )}
          {isRecording && (
            <span className="badge badge--purple">Recording</span>
          )}
          {isUpcoming && (
            <span className="badge badge--green">Upcoming</span>
          )}
          <h3 style={{ margin: '4px 0 6px', fontSize: '1.05rem' }}>{event.title}</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <small style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>{dateStr}</small>
          {admin && (
            <button
              onClick={() => onManage(event)}
              title="Manage this competition"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: '#f5f5f5', border: '1px solid #e0e0e0',
                borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
                fontSize: '0.78rem', fontWeight: 600, color: '#555',
                flexShrink: 0,
              }}
            >
              <FiSettings size={12} /> Manage
            </button>
          )}
        </div>
      </div>

      {event.theme && <p className="meta" style={{ marginBottom: 6 }}>Theme: {event.theme}</p>}
      {event.description && <p style={{ marginBottom: 10, lineHeight: 1.55 }}>{event.description}</p>}

      {/* Guest speaker section */}
      {event.guest_name && (
        <div style={{ background: '#f8f8ff', border: '1px solid #e8e8ff', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
          <p style={{ fontWeight: 700, fontSize: '0.82rem', color: '#888', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ἱ9 Guest Speaker</p>
          <p style={{ fontWeight: 700, margin: '0 0 4px', fontSize: '0.95rem' }}>{event.guest_name}</p>
          {event.guest_bio && <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', lineHeight: 1.55 }}>{event.guest_bio}</p>}
        </div>
      )}

      {/* Presenter join link — only for registered participants or admin */}
      {event.presenter_join_link && (event.is_registered || admin) && (
        <div style={{ background: '#f0fff8', border: '1px dashed #22c478', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
          <p style={{ margin: '0 0 6px', fontSize: '0.83rem', fontWeight: 700, color: '#15835a' }}>✓ You&apos;re registered — join as a presenter</p>
          <a
            href={event.presenter_join_link}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-block', padding: '6px 16px', background: '#22c478', color: '#fff', borderRadius: 20, fontWeight: 700, fontSize: '0.84rem', textDecoration: 'none' }}
          >
            Join now →
          </a>
        </div>
      )}

      {event.slots_available !== null && isUpcoming && (
        <p className="meta" style={{ marginBottom: 8 }}>
          {event.slots_available === 0
            ? <><FiXCircle size={13} style={{ marginRight: 4, verticalAlign: 'middle', color: '#e53e3e' }} />Slots full</>
            : `${event.slots_available} participant slot${event.slots_available !== 1 ? 's' : ''} left`}
        </p>
      )}

      {/* ── Live stream embed ── */}
      {isLive && event.stream_url && (() => {
        const embedUrl = getYouTubeEmbedUrl(event.stream_url, true)
        return embedUrl ? (
          <div className="yt-embed-wrap" style={{ marginTop: 14 }}>
            <iframe
              src={embedUrl}
              title={`Live: ${event.title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ border: 0, width: '100%', height: '100%', borderRadius: 6 }}
            />
          </div>
        ) : (
          <a href={event.stream_url} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ marginTop: 10, display: 'inline-flex' }}>
            <FiPlay size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />Watch Live
          </a>
        )
      })()}

      {/* ── Recording embed ── */}
      {isRecording && event.recording_url && (() => {
        const embedUrl = getYouTubeEmbedUrl(event.recording_url, false)
        return embedUrl ? (
          <div className="yt-embed-wrap" style={{ marginTop: 14 }}>
            <iframe
              src={embedUrl}
              title={`Recording: ${event.title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ border: 0, width: '100%', height: '100%', borderRadius: 6 }}
            />
          </div>
        ) : (
          <a href={event.recording_url} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ marginTop: 10, display: 'inline-flex', background: '#6c47ff' }}>
            <FiPlay size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />Watch Recording
          </a>
        )
      })()}
      {/* Live / replay chat */}
      {(isLive || isRecording) && (
        <EventLiveChat eventId={event.id} status={event.status} />
      )}
    </motion.article>
  )
}

// ─── Wizard step config ───────────────────────────────────────────────────────

const WIZARD_STEPS = [
  { id: 1, label: 'Basics' },
  { id: 2, label: 'Date & Slots' },
  { id: 3, label: 'Stream Setup' },
  { id: 4, label: 'Review' },
]

const EMPTY_FORM = {
  title: '', theme: '', description: '',
  starts_at: '', ends_at: '', max_slots: '',
  requirements: '', stream_url: '',
  presenter_join_link: '', guest_name: '', guest_bio: '',
}

// ─── Create Competition Wizard ────────────────────────────────────────────────

function CreateCompetitionWizard({ onClose, onCreate }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validateStep = s => {
    const e = {}
    if (s === 1 && !form.title.trim()) e.title = 'Title is required'
    if (s === 2 && !form.starts_at) e.starts_at = 'Start date & time is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validateStep(step)) setStep(s => s + 1) }
  const back = () => setStep(s => s - 1)

  const submit = async () => {
    setSubmitting(true)
    setServerError('')
    try {
      const payload = {
        title:        form.title.trim(),
        theme:        form.theme.trim()        || null,
        description:  form.description.trim() || null,
        starts_at:    form.starts_at,
        ends_at:      form.ends_at            || null,
        max_slots:    form.max_slots ? parseInt(form.max_slots) : null,
        requirements: form.requirements.trim()|| null,
        stream_url:          form.stream_url.trim()          || null,
        presenter_join_link:  form.presenter_join_link.trim() || null,
        guest_name:           form.guest_name.trim()          || null,
        guest_bio:            form.guest_bio.trim()           || null,
        status:       'scheduled',
      }
      const res = await apiFetch('/profiles/events/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      if (res.ok) { onCreate(); onClose() }
      else {
        const d = await res.json()
        setServerError(d?.detail || Object.values(d).flat().join(' ') || 'Failed to create competition.')
      }
    } catch { setServerError('Network error. Please try again.') }
    finally { setSubmitting(false) }
  }

  // ── shared styles ──
  const inp = (err) => ({
    display: 'block', width: '100%', padding: '10px 12px',
    border: `1px solid ${err ? '#e53e3e' : '#e0e0e0'}`,
    borderRadius: 7, fontSize: '0.94rem', boxSizing: 'border-box',
    outline: 'none', marginTop: 6, fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  })
  const lbl  = { display: 'block', fontWeight: 600, fontSize: '0.84rem', color: '#555', letterSpacing: '0.01em' }
  const hint = { margin: '3px 0 0', fontSize: '0.79rem', color: '#aaa' }
  const err  = { margin: '4px 0 0', fontSize: '0.8rem', color: '#e53e3e' }

  const reviewRows = [
    ['Title',        form.title],
    ['Theme',        form.theme        || '—'],
    ['Description',  form.description  || '—'],
    ['Starts',       form.starts_at    ? new Date(form.starts_at).toLocaleString() : '—'],
    ['Ends',         form.ends_at      ? new Date(form.ends_at).toLocaleString()   : 'Open-ended'],
    ['Max slots',    form.max_slots    || 'Unlimited'],
    ['Stream URL',    form.stream_url          || 'Not set — can add later'],
    ['Requirements',  form.requirements        || '—'],
    ['Guest speaker', form.guest_name          || '—'],
    ['Guest bio',     form.guest_bio           || '—'],
    ['Presenter link',form.presenter_join_link || 'Not set'],
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.48)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        style={{
          background: '#fff', borderRadius: 14, width: '100%',
          maxWidth: 520, padding: '28px 30px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.18rem' }}>New Pitch Competition</h2>
            <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#aaa' }}>Step {step} of {WIZARD_STEPS.length}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#bbb', lineHeight: 1, padding: 0 }} aria-label="Close">&times;</button>
        </div>

        {/* Step progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
          {WIZARD_STEPS.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < WIZARD_STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap: 6, flexShrink: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: step > s.id ? '#22c478' : step === s.id ? 'var(--orange, #ff6b2b)' : '#ebebeb',
                  color: step >= s.id ? '#fff' : '#aaa',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.78rem', fontWeight: 700, flexShrink: 0,
                  transition: 'background 0.2s',
                }}>
                  {step > s.id ? <FiCheck size={13} strokeWidth={3} /> : s.id}
                </div>
                <span style={{ fontSize: '0.8rem', color: step >= s.id ? '#333' : '#bbb', fontWeight: step === s.id ? 700 : 400, whiteSpace: 'nowrap' }}>
                  {s.label}
                </span>
              </div>
              {i < WIZARD_STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: step > s.id ? '#22c478' : '#ebebeb', borderRadius: 2, margin: '0 8px', transition: 'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        {/* ── Step 1: Basics ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={lbl}>Competition title <span style={{ color: '#e53e3e' }}>*</span></label>
              <input
                style={inp(errors.title)}
                placeholder="e.g. Q2 2026 Pitch Night"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                autoFocus
              />
              {errors.title && <p style={err}>{errors.title}</p>}
            </div>
            <div>
              <label style={lbl}>Theme <span style={{ color:'#bbb', fontWeight:400 }}>(optional)</span></label>
              <input style={inp()} placeholder="e.g. Fintech & Emerging Markets" value={form.theme} onChange={e => set('theme', e.target.value)} />
              <p style={hint}>A short subject line displayed on the competition card.</p>
            </div>
            <div>
              <label style={lbl}>Description <span style={{ color:'#bbb', fontWeight:400 }}>(optional)</span></label>
              <textarea
                style={{ ...inp(), minHeight: 88, resize: 'vertical' }}
                placeholder="Tell participants what this competition is about…"
                value={form.description}
                onChange={e => set('description', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Date & Slots ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={lbl}>Start date &amp; time <span style={{ color: '#e53e3e' }}>*</span></label>
              <input type="datetime-local" style={inp(errors.starts_at)} value={form.starts_at} onChange={e => set('starts_at', e.target.value)} />
              {errors.starts_at && <p style={err}>{errors.starts_at}</p>}
            </div>
            <div>
              <label style={lbl}>End date &amp; time <span style={{ color:'#bbb', fontWeight:400 }}>(optional)</span></label>
              <input type="datetime-local" style={inp()} value={form.ends_at} onChange={e => set('ends_at', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Max presenter slots <span style={{ color:'#bbb', fontWeight:400 }}>(optional)</span></label>
              <input type="number" min="1" style={inp()} placeholder="Leave empty for unlimited" value={form.max_slots} onChange={e => set('max_slots', e.target.value)} />
              <p style={hint}>How many founders can register to pitch. Leave blank for no cap.</p>
            </div>
          </div>
        )}

        {/* ── Step 3: Stream Setup ── */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ background: '#fff8f2', border: '1px solid #ffe0c0', borderRadius: 8, padding: '12px 14px', fontSize: '0.85rem', color: '#a04000', lineHeight: 1.6 }}>
              <strong>How live streaming works:</strong><br />
              Go live on YouTube → paste the video URL here. When you mark the event as <em>Live</em> in the admin panel, the player embeds automatically on the platform. No YouTube branding is shown to users.
            </div>
            <div>
              <label style={lbl}>YouTube live URL <span style={{ color:'#bbb', fontWeight:400 }}>(optional — can add later)</span></label>
              <input
                style={inp()}
                placeholder="https://www.youtube.com/watch?v=…"
                value={form.stream_url}
                onChange={e => set('stream_url', e.target.value)}
              />
            </div>
            <div>
              <label style={lbl}>Requirements <span style={{ color:'#bbb', fontWeight:400 }}>(optional)</span></label>
              <textarea
                style={{ ...inp(), minHeight: 88, resize: 'vertical' }}
                placeholder="e.g. Registered business, pitch deck required, max 5 min presentation…"
                value={form.requirements}
                onChange={e => set('requirements', e.target.value)}
              />
            </div>
            <div>
              <label style={lbl}>Guest speaker name <span style={{ color: '#bbb', fontWeight: 400 }}>(optional)</span></label>
              <input style={inp()} placeholder="e.g. Jane Smith, CEO of Acme" value={form.guest_name} onChange={e => set('guest_name', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Guest speaker bio <span style={{ color: '#bbb', fontWeight: 400 }}>(optional)</span></label>
              <textarea
                style={{ ...inp(), minHeight: 72, resize: 'vertical' }}
                placeholder="Short bio shown on the competition card…"
                value={form.guest_bio}
                onChange={e => set('guest_bio', e.target.value)}
              />
            </div>
            <div>
              <label style={lbl}>Presenter join link <span style={{ color: '#bbb', fontWeight: 400 }}>(optional)</span></label>
              <input style={inp()} placeholder="https://zoom.us/j/… or https://meet.google.com/…" value={form.presenter_join_link} onChange={e => set('presenter_join_link', e.target.value)} />
              <p style={hint}>Private Zoom/Meet URL — only visible to registered participants.</p>
            </div>
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <p style={{ margin: '0 0 14px', fontSize: '0.88rem', color: '#888' }}>Review everything below. The competition will be saved as <strong>Upcoming</strong> — you control when it goes live.</p>
            {reviewRows.map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 14, padding: '9px 0', borderBottom: '1px solid #f2f2f2' }}>
                <span style={{ width: 116, flexShrink: 0, fontSize: '0.82rem', fontWeight: 600, color: '#888', paddingTop: 1 }}>{k}</span>
                <span style={{ fontSize: '0.88rem', wordBreak: 'break-all', lineHeight: 1.5 }}>{v}</span>
              </div>
            ))}
            {serverError && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: '#fff5f5', border: '1px solid #fcc', borderRadius: 8, fontSize: '0.85rem', color: '#c00' }}>
                {serverError}
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, gap: 10 }}>
          <FluffyBtn
            onClick={step === 1 ? onClose : back}
            color="#888888"
            width={88}
            height={34}
            strands={700}
            strandLen={5}
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </FluffyBtn>
          {step < 4 ? (
            <FluffyBtn
              onClick={next}
              color="#F5A623"
              width={96}
              height={34}
              strands={800}
              strandLen={6}
            >
              Next →
            </FluffyBtn>
          ) : (
            <FluffyBtn
              onClick={submit}
              disabled={submitting}
              color="#F5A623"
              width={178}
              height={40}
              strands={1600}
              strandLen={8}
            >
              {submitting ? 'Creating…' : <><FiPlus size={13} /> Create Competition</>}
            </FluffyBtn>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Pitch Competitions Tab ────────────────────────────────────────────────────

function PitchCompetitions() {
  const [data, setData] = useState({ live: [], upcoming: [], recordings: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showWizard,   setShowWizard]   = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [refreshKey,   setRefreshKey]   = useState(0)
  const token = getToken()
  const admin = isAdmin()

  useEffect(() => {
    let mounted = true
    setLoading(true)
    apiFetch('/profiles/events/pitches/')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(json => { if (mounted) setData({ live: json.live || [], upcoming: json.upcoming || [], recordings: json.recordings || [] }) })
      .catch(() => { if (mounted) setError(true) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [refreshKey])

  const reload = () => setRefreshKey(k => k + 1)

  if (loading) return <div className="spinner">Loading competitions…</div>
  if (error)   return <div className="spinner">Could not load pitch competitions.</div>

  const total = data.live.length + data.upcoming.length + data.recordings.length

  return (
    <>
      {/* Admin toolbar */}
      {admin && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <FluffyBtn
            onClick={() => setShowWizard(true)}
            color="#F5A623"
            width={188}
            height={38}
            strands={1200}
            strandLen={6}
          >
            <FiPlus size={13} /> Create Competition
          </FluffyBtn>
        </div>
      )}

      {/* Wizard modal */}
      <AnimatePresence>
        {showWizard && (
          <CreateCompetitionWizard
            onClose={() => setShowWizard(false)}
            onCreate={reload}
          />
        )}
      </AnimatePresence>

      {/* Manage modal */}
      <AnimatePresence>
        {editingEvent && (
          <ManageEventModal
            event={editingEvent}
            onClose={() => setEditingEvent(null)}
            onSaved={reload}
            onDeleted={reload}
          />
        )}
      </AnimatePresence>

      {/* Empty state */}
      {total === 0 && (
        <div className="empty-state">
          <div className="empty-icon"><FiMic size={32} /></div>
          <p className="empty-title">No pitch competitions yet</p>
          <p className="empty-text">
            {admin
              ? 'Create your first competition using the button above.'
              : 'Competitions organised by the admin will appear here — live, upcoming, and past recordings.'}
          </p>
        </div>
      )}

      {total > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, marginTop: 8 }}>
          {data.live.length > 0 && (
            <section>
              <div className="section-header">
                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="badge-dot" style={{ background: 'var(--orange)', animation: 'pulse 1.2s infinite' }} />
                  Happening Now
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.live.map(e => <PitchCard key={e.id} event={e} token={token} admin={admin} onManage={setEditingEvent} />)}
              </div>
            </section>
          )}

          {data.upcoming.length > 0 && (
            <section>
              <div className="section-header">
                <h2 className="section-title">Upcoming Competitions</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.upcoming.map(e => <PitchCard key={e.id} event={e} token={token} admin={admin} onManage={setEditingEvent} />)}
              </div>
            </section>
          )}

          {data.recordings.length > 0 && (
            <section>
              <div className="section-header">
                <h2 className="section-title">Past Competitions</h2>
                <p className="section-sub">Full recordings of previous pitch competitions.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.recordings.map(e => <PitchCard key={e.id} event={e} token={token} admin={admin} onManage={setEditingEvent} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  )
}

// ─── Community Page ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'feed', icon: FiMessageSquare, label: 'Feed' },
  { id: 'pitches', icon: FiMic, label: 'Pitch Competitions' },
]

export default function Community() {
  const [refresh, setRefresh] = useState(0)
  const [tab, setTab] = useState('feed')

  return (
    <>
      <Head><title>Community — By The Fruit</title></Head>
      <motion.main className="container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <header className="page-header">
          <h1>Community</h1>
          <p className="tagline">Connect with founders and investors. Pitch, discover deals, and watch live competitions.</p>
        </header>

        {/* Tab bar */}
        <div className="tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`tab-btn${tab === t.id ? ' active' : ''}`}
            >
              <t.icon size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'feed' && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
            >
              <div style={{ maxWidth: 740, margin: '0 auto' }}>
                <PostForm onCreate={() => setRefresh(r => r + 1)} />
                <div style={{ marginTop: 18 }}>
                  <PostList refreshTrigger={refresh} />
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'pitches' && (
            <motion.div
              key="pitches"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
            >
              <PitchCompetitions />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>

      <style>{`
        /* Responsive 16:9 YouTube embed wrapper */
        .yt-embed-wrap {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%; /* 16:9 */
          height: 0;
          overflow: hidden;
          border-radius: 6px;
          background: #000;
        }
        .yt-embed-wrap iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </>
  )
}
