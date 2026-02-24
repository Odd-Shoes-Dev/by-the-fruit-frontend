import Head from 'next/head'
import { FiUsers, FiMapPin, FiCheck, FiX } from 'react-icons/fi'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Pagination from '../../components/Pagination'
import { apiFetch, getToken, isAdmin } from '../../lib/api'

const PAGE_SIZE = 8

const STATUS_COLORS = {
  pending:  { bg: '#fff8e1', color: '#b45309', border: '#fde68a' },
  approved: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  rejected: { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
}

const STATUS_LABELS = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' }

function StatusBadge({ status }) {
  const cls = status === 'approved' ? 'badge badge--green'
    : status === 'rejected' ? 'badge badge--muted'
    : 'badge badge--orange'
  return <span className={cls}>{STATUS_LABELS[status] || status}</span>
}

export default function AdminIndex() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState('waitlist')

  // Waitlist state
  const [waitlist, setWaitlist] = useState([])
  const [waitlistFilter, setWaitlistFilter] = useState('pending')
  const [waitlistLoading, setWaitlistLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState({})

  // Other content state
  const [posts, setPosts] = useState([])
  const [events, setEvents] = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [messages, setMessages] = useState([])
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken() || !isAdmin()) {
      router.replace('/')
      return
    }
    setMounted(true)
    loadContent()
    loadWaitlist('pending')
  }, [router])

  async function loadContent() {
    try {
      const [postsRes, eventsRes, testimonialsRes, messagesRes] = await Promise.all([
        apiFetch('/profiles/community-posts/'),
        apiFetch('/profiles/events/upcoming/'),
        apiFetch('/profiles/testimonials/'),
        apiFetch('/profiles/contact-messages/')
      ])
      const toArr = json => {
        const raw = json?.data ?? json
        return Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
      }
      if (postsRes.ok) setPosts(toArr(await postsRes.json()))
      if (eventsRes.ok) setEvents(toArr(await eventsRes.json()))
      if (testimonialsRes.ok) setTestimonials(toArr(await testimonialsRes.json()))
      if (messagesRes.ok) setMessages(toArr(await messagesRes.json()))
    } catch (e) {}
    setLoading(false)
  }

  async function loadWaitlist(statusFilter) {
    setWaitlistLoading(true)
    try {
      const res = await apiFetch(`/user/waitlist?status=${statusFilter}`)
      if (res.ok) {
        const json = await res.json()
        // Renderer wraps response as { data: [...] }; also handle plain array or paginated
        const raw = json?.data ?? json
        setWaitlist(Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : [])
      }
    } catch (e) {}
    setWaitlistLoading(false)
  }

  function changeWaitlistFilter(f) {
    setWaitlistFilter(f)
    loadWaitlist(f)
    setPage(1)
  }

  async function handleAction(userId, action) {
    setActionLoading(prev => ({ ...prev, [userId]: action }))
    try {
      const res = await apiFetch(`/user/waitlist/${userId}/action`, {
        method: 'PATCH',
        body: JSON.stringify({ action })
      })
      if (res.ok) {
        // Remove from current list and reload
        setWaitlist(prev => prev.filter(u => u.id !== userId))
      }
    } catch (e) {}
    setActionLoading(prev => { const n = { ...prev }; delete n[userId]; return n })
  }

  const contentSource = useMemo(() => {
    if (tab === 'posts') return posts
    if (tab === 'events') return events
    if (tab === 'testimonials') return testimonials
    if (tab === 'messages') return messages
    return []
  }, [tab, posts, events, testimonials, messages])

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    if (!term) return contentSource
    return contentSource.filter(item => JSON.stringify(item).toLowerCase().includes(term))
  }, [q, contentSource])

  const totalPages = Math.max(1, Math.ceil(
    (tab === 'waitlist' ? waitlist.length : filtered.length) / PAGE_SIZE
  ))
  const pageItems = tab === 'waitlist'
    ? waitlist.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function contentLabel(item) {
    if (tab === 'posts') return item.content?.slice(0, 60) || 'Post'
    if (tab === 'events') return item.title || 'Event'
    if (tab === 'testimonials') return item.author_name || item.quote?.slice(0, 40) || 'Testimonial'
    if (tab === 'messages') return item.email || item.message?.slice(0, 40) || 'Message'
    return 'Item'
  }

  const pendingCount = tab === 'waitlist' && waitlistFilter === 'pending' ? waitlist.length : null

  if (!mounted) return <div className="container"><div className="spinner">Loading…</div></div>

  const TABS = [
    { key: 'waitlist', label: <><FiUsers size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} />Waitlist</> },
    { key: 'posts',    label: 'Posts' },
    { key: 'events',   label: 'Events' },
    { key: 'testimonials', label: 'Testimonials' },
    { key: 'messages', label: 'Messages' },
  ]

  return (
    <>
      <Head><title>Admin — By The Fruit</title></Head>
      <div className="container">
        <header className="page-header">
          <h1>Admin Dashboard</h1>
          <p className="tagline">
            Manage waitlist requests, content, and community data.{' '}
            <a href={`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/admin/`} target="_blank" rel="noreferrer">
              Django admin →
            </a>
          </p>
        </header>

        {/* Tab bar */}
        <div className="tabs" style={{ flexWrap: 'wrap', marginBottom: 20 }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(1); setQ('') }}
              className={`tab-btn${tab === t.key ? ' active' : ''}`}
              style={{ position: 'relative' }}
            >
              {t.label}
              {t.key === 'waitlist' && waitlistFilter === 'pending' && waitlist.length > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -6,
                  background: '#ef4444', color: '#fff',
                  borderRadius: '50%', width: 18, height: 18,
                  fontSize: '0.7rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {waitlist.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── WAITLIST TAB ── */}
        <AnimatePresence mode="wait">
          {tab === 'waitlist' && (
            <motion.div
              key="waitlist"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Filter pills */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--muted)', fontWeight: 600 }}>Filter:</span>
                {['pending', 'approved', 'rejected', 'all'].map(f => (
                  <button
                    key={f}
                    onClick={() => changeWaitlistFilter(f)}
                    style={{
                      padding: '5px 14px',
                      borderRadius: 20,
                      border: waitlistFilter === f ? 'none' : '1px solid #e5e7eb',
                      background: waitlistFilter === f
                        ? (f === 'pending' ? '#d97706' : f === 'approved' ? '#34d399' : f === 'rejected' ? '#f87171' : 'var(--orange)')
                        : '#fff',
                      color: waitlistFilter === f ? '#fff' : 'var(--dark)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {f === 'all' ? 'All users' : f}
                  </button>
                ))}
                <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: '0.85rem' }}>
                  {waitlist.length} {waitlistFilter === 'all' ? 'users' : waitlistFilter}
                </span>
              </div>

              {waitlistLoading ? (
                <div className="spinner">Loading…</div>
              ) : waitlist.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                  <p style={{ margin: 0 }}>No {waitlistFilter === 'all' ? '' : waitlistFilter} users found.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {pageItems.map(u => (
                    <motion.div
                      key={u.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="card"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '0.95rem' }}>{u.full_name || '(no name)'}</strong>
                          <StatusBadge status={u.approval_status} />
                        </div>
                        <p className="meta" style={{ margin: '3px 0 0', fontSize: '0.85rem' }}>{u.email}</p>
                        {u.location && <p className="meta" style={{ margin: '2px 0 0', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4 }}><FiMapPin size={12} />{u.location}</p>}
                        {u.created_at && (
                          <p className="meta" style={{ margin: '2px 0 0', fontSize: '0.8rem' }}>
                            Joined {new Date(u.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                        {u.approval_status !== 'approved' && (
                          <button
                            className="btn btn-sm"
                            style={{ background: '#15803d' }}
                            disabled={!!actionLoading[u.id]}
                            onClick={() => handleAction(u.id, 'approve')}
                          >
                            {actionLoading[u.id] === 'approve' ? 'Approving…' : <><FiCheck size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />Approve</>}
                          </button>
                        )}
                        {u.approval_status !== 'rejected' && (
                          <button
                            className="btn-danger btn-sm"
                            disabled={!!actionLoading[u.id]}
                            onClick={() => handleAction(u.id, 'reject')}
                          >
                            {actionLoading[u.id] === 'reject' ? 'Rejecting…' : <><FiX size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />Reject</>}
                          </button>
                        )}
                        <Link href={`/profile/${u.id}`} className="btn-ghost btn-sm">View</Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <Pagination page={page} totalPages={totalPages} onChange={p => setPage(p)} />
              </div>
            </motion.div>
          )}

          {/* ── CONTENT TABS ── */}
          {tab !== 'waitlist' && (
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {loading ? <div className="spinner">Loading…</div> : (
                <div className="admin-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
                    <input
                      className="search"
                      placeholder={`Search ${tab}`}
                      value={q}
                      onChange={e => { setQ(e.target.value); setPage(1) }}
                    />
                    <div className="meta">{filtered.length} results</div>
                  </div>

                  {pageItems.length === 0 ? (
                    <div style={{ color: 'var(--muted)', padding: '1rem 0' }}>No items found.</div>
                  ) : (
                    pageItems.map(item => (
                      <div key={item.id || JSON.stringify(item)} className="admin-row">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong>{contentLabel(item)}</strong>
                          <div className="meta" style={{ marginTop: 2 }}>
                            {(item.content || item.description || item.quote || item.message || '').toString().slice(0, 120)}
                          </div>
                        </div>
                        <div className="admin-controls">
                          {(tab === 'messages') && item.email && (
                            <a href={`mailto:${item.email}`} className="btn-ghost btn-sm">Reply</a>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  <div style={{ marginTop: 12 }}>
                    <Pagination page={page} totalPages={totalPages} onChange={p => setPage(p)} />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
