import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { FiUsers, FiFileText, FiShield, FiTrendingUp, FiMessageSquare, FiCalendar, FiMapPin, FiCheck, FiX } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { apiFetch, getToken, isAdmin } from '../../lib/api'
import AdminLayout from '../../components/AdminLayout'
import Pagination from '../../components/Pagination'
import styles from '../../styles/Admin.module.css'

// Dynamically import recharts to avoid SSR issues
const { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } =
  typeof window !== 'undefined' ? require('recharts') : {}

const unwrap = json => json?.data ?? json

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

  // Stats: all users for overview counts
  const [allUsers, setAllUsers] = useState([])

  // KYC / Offerings / Commitments
  const [kyc, setKyc] = useState([])
  const [kycLoading, setKycLoading] = useState(false)
  const [kycAction, setKycAction] = useState({})
  const [offerings, setOfferings] = useState([])
  const [offeringsLoading, setOfferingsLoading] = useState(false)
  const [commitments, setCommitments] = useState([])
  const [commitmentsLoading, setCommitmentsLoading] = useState(false)

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
    loadKyc()
    loadOfferings()
    loadCommitments()
    // Load all users for stats overview
    apiFetch('/user/waitlist?status=all').then(async r => {
      if (r.ok) {
        const json = await r.json()
        const raw = json?.data ?? json
        setAllUsers(Array.isArray(raw) ? raw : raw?.results ?? [])
      }
    }).catch(() => {})
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

  async function loadKyc() {
    setKycLoading(true)
    try {
      const res = await apiFetch('/profiles/kyc-documents/')
      if (res.ok) {
        const json = await res.json()
        const raw = json?.data ?? json
        setKyc(Array.isArray(raw) ? raw : raw?.results ?? [])
      }
    } catch (e) {}
    setKycLoading(false)
  }

  async function handleKycAction(id, action) {
    setKycAction(prev => ({ ...prev, [id]: action }))
    try {
      const res = await apiFetch(`/profiles/kyc-documents/${id}/${action}/`, {
        method: 'POST',
        body: JSON.stringify({})
      })
      if (res.ok) loadKyc()
    } catch (e) {}
    setKycAction(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  async function loadOfferings() {
    setOfferingsLoading(true)
    try {
      const res = await apiFetch('/profiles/offerings/?all=true')
      if (res.ok) {
        const json = await res.json()
        const raw = json?.data ?? json
        setOfferings(Array.isArray(raw) ? raw : raw?.results ?? [])
      }
    } catch (e) {}
    setOfferingsLoading(false)
  }

  async function loadCommitments() {
    setCommitmentsLoading(true)
    try {
      const res = await apiFetch('/profiles/spv-commitments/')
      if (res.ok) {
        const json = await res.json()
        const raw = json?.data ?? json
        setCommitments(Array.isArray(raw) ? raw : raw?.results ?? [])
      }
    } catch (e) {}
    setCommitmentsLoading(false)
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

  const pendingKycCount = kyc.filter(k => k.status === 'pending').length

  // Stats for overview cards
  const totalUsers    = allUsers.length
  const pendingUsers  = allUsers.filter(u => u.approval_status === 'pending').length
  const approvedUsers = allUsers.filter(u => u.approval_status === 'approved').length
  const rejectedUsers = allUsers.filter(u => u.approval_status === 'rejected').length
  const liveOfferings = offerings.filter(o => o.status === 'live').length
  const totalCommitted = commitments.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0)
  const pendingCommitments = commitments.filter(c => c.status === 'pending').length

  const TABS = [
    { key: 'waitlist',     label: <><FiUsers size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} />Waitlist</> },
    { key: 'kyc',         label: 'KYC', badge: pendingKycCount },
    { key: 'offerings',   label: 'Offerings' },
    { key: 'commitments', label: 'Commitments' },
    { key: 'posts',       label: 'Posts' },
    { key: 'events',      label: 'Events' },
    { key: 'testimonials',label: 'Testimonials' },
    { key: 'messages',    label: 'Messages' },
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

        {/* ── Summary stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { icon: FiUsers,        label: 'Total users',     value: totalUsers,    sub: `${pendingUsers} pending`,                                              onClick: () => { setTab('waitlist'); changeWaitlistFilter('all') } },
            { icon: FiShield,       label: 'Pending KYC',     value: pendingKycCount, sub: `${kyc.length} total`,                                                 onClick: () => setTab('kyc') },
            { icon: FiTrendingUp,   label: 'Live offerings',  value: liveOfferings, sub: `${offerings.length} total`,                                             onClick: () => setTab('offerings') },
            { icon: FiFileText,     label: 'Commitments',     value: commitments.length, sub: pendingCommitments > 0 ? `${pendingCommitments} pending` : 'all signed', onClick: () => setTab('commitments') },
            { icon: FiMessageSquare,label: 'Posts',           value: posts.length,  sub: 'community feed',                                                        onClick: () => setTab('posts') },
            { icon: FiCalendar,     label: 'Events',          value: events.length, sub: 'upcoming',                                                              onClick: () => setTab('events') },
          ].map(({ icon: Icon, label, value, sub, onClick }) => (
            <motion.div
              key={label}
              whileHover={{ y: -2 }}
              onClick={onClick}
              style={{
                background: 'var(--dark2)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '18px 18px 16px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Icon size={15} style={{ color: 'rgba(45,59,81,0.35)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--cream)', lineHeight: 1 }}>
                {value ?? '—'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 5 }}>{sub}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Charts row ── */}
        {totalUsers > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>

            {/* User status counters */}
            <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 18px', boxShadow: 'var(--shadow-sm)' }}>
              <p style={{ margin: '0 0 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>User Status</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[['Approved', approvedUsers, '#15803d', '#f0fdf4'], ['Pending', pendingUsers, '#b45309', '#fff8e1'], ['Rejected', rejectedUsers, '#be123c', '#fff1f2']].map(([lbl, count, color, bg]) => (
                  <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 600 }}>{lbl}</span>
                        <strong style={{ fontSize: '0.88rem', color }}>{count}</strong>
                      </div>
                      <div style={{ height: 6, borderRadius: 4, background: 'rgba(45,59,81,0.07)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: totalUsers > 0 ? `${Math.round(count / totalUsers * 100)}%` : '0%', background: color, borderRadius: 4 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar: offerings by status */}
            <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 18px', boxShadow: 'var(--shadow-sm)' }}>
              <p style={{ margin: '0 0 14px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Offerings by Status</p>
              {BarChart && (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={['draft', 'live', 'closed', 'cancelled'].map(s => ({
                      name: s.charAt(0).toUpperCase() + s.slice(1),
                      count: offerings.filter(o => o.status === s).length,
                    })).filter(d => d.count > 0)}
                    margin={{ top: 4, right: 8, bottom: 4, left: -20 }}
                    barSize={28}
                  >
                    <XAxis dataKey="name" tick={{ fill: 'rgba(45,59,81,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(45,59,81,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--cream)' }}
                      cursor={{ fill: 'rgba(79,107,217,0.04)' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {['draft', 'live', 'closed', 'cancelled'].map((s, i) => (
                        <Cell key={s} fill={['#8a9e8d', '#34d399', '#a78bfa', '#f87171'][i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Bar: commitments by status */}
            {commitments.length > 0 && (
              <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 18px', boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ margin: '0 0 14px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Commitments by Status</p>
                {BarChart && (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={['pending', 'signed', 'countersigned', 'rejected'].map(s => ({
                        name: s.charAt(0).toUpperCase() + s.slice(1),
                        count: commitments.filter(c => c.status === s).length,
                      })).filter(d => d.count > 0)}
                      margin={{ top: 4, right: 8, bottom: 4, left: -20 }}
                      barSize={28}
                    >
                      <XAxis dataKey="name" tick={{ fill: 'rgba(45,59,81,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(45,59,81,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--cream)' }}
                        cursor={{ fill: 'rgba(79,107,217,0.04)' }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {['pending','signed','countersigned','rejected'].map((s, i) => (
                        <Cell key={s} fill={['#F5A623', '#34d399', '#a78bfa', '#f87171'][i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

          </div>
        )}

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
              {t.badge > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -6,
                  background: '#ef4444', color: '#fff',
                  borderRadius: '50%', width: 18, height: 18,
                  fontSize: '0.7rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {t.badge}
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
                        ? (f === 'pending' ? '#d97706' : f === 'approved' ? '#15803d' : f === 'rejected' ? 'var(--orange)' : 'var(--orange)')
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

          {/* ── KYC TAB ── */}
          {tab === 'kyc' && (
            <motion.div key="kyc" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {kycLoading ? <div className="spinner">Loading KYC submissions…</div> : kyc.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>No KYC submissions yet.</div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {kyc.map(k => (
                    <div key={k.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <strong>{k.user_name || k.user_email}</strong>
                          <StatusBadge status={k.status} />
                        </div>
                        <p className="meta" style={{ margin: '3px 0 0' }}>{k.user_email} &mdash; {k.document_type || 'ID document'}</p>
                        {k.submitted_at && <p className="meta" style={{ margin: '2px 0 0', fontSize: '0.8rem' }}>Submitted {new Date(k.submitted_at).toLocaleDateString()}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {k.front_image && <a href={k.front_image} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">View ID</a>}
                        {k.status !== 'approved' && (
                          <button className="btn btn-sm" style={{ background: '#15803d' }} disabled={!!kycAction[k.id]} onClick={() => handleKycAction(k.id, 'approve')}>
                            {kycAction[k.id] === 'approve' ? 'Approving…' : 'Approve'}
                          </button>
                        )}
                        {k.status !== 'rejected' && (
                          <button className="btn-danger btn-sm" disabled={!!kycAction[k.id]} onClick={() => handleKycAction(k.id, 'reject')}>
                            {kycAction[k.id] === 'reject' ? 'Rejecting…' : 'Reject'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── OFFERINGS TAB ── */}
          {tab === 'offerings' && (
            <motion.div key="offerings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {offeringsLoading ? <div className="spinner">Loading offerings…</div> : offerings.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>No offerings yet.</div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {offerings.map(o => (
                    <div key={o.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <strong>{o.title}</strong>
                          <span className={`badge badge--${o.status === 'live' ? 'green' : o.status === 'draft' ? 'orange' : 'muted'}`}>{o.status}</span>
                          {o.is_public && <span className="badge badge--green">Public</span>}
                        </div>
                        <p className="meta" style={{ margin: '3px 0 0' }}>{o.business_name} &mdash; Target: ${Number(o.target_raise).toLocaleString()}</p>
                        {o.closing_date && <p className="meta" style={{ margin: '2px 0 0', fontSize: '0.8rem' }}>Closes {new Date(o.closing_date).toLocaleDateString()}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link href={`/offerings/${o.id}`} className="btn-ghost btn-sm">View</Link>
                        <Link href={`/offerings/dashboard/${o.id}`} className="btn-ghost btn-sm">Pipeline</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── COMMITMENTS TAB ── */}
          {tab === 'commitments' && (
            <motion.div key="commitments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {commitmentsLoading ? <div className="spinner">Loading commitments…</div> : commitments.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>No commitments yet.</div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {commitments.map(c => (
                    <div key={c.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <strong>{c.investor_detail?.full_name || c.investor_detail?.email || `Investor #${c.investor}`}</strong>
                          <StatusBadge status={c.status} />
                        </div>
                        <p className="meta" style={{ margin: '3px 0 0' }}>
                          ${Number(c.amount).toLocaleString()} &mdash; {c.offering_title || `Offering #${c.spv_offering_id}`} &mdash; {c.spv_name}
                        </p>
                        {c.committed_at && <p className="meta" style={{ margin: '2px 0 0', fontSize: '0.8rem' }}>{new Date(c.committed_at).toLocaleDateString()}</p>}
                      </div>
                      {c.spv_offering_id && (
                        <Link href={`/offerings/dashboard/${c.spv_offering_id}`} className="btn-ghost btn-sm">Pipeline</Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── CONTENT TABS ── */}
          {tab !== 'waitlist' && tab !== 'kyc' && tab !== 'offerings' && tab !== 'commitments' && (
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
