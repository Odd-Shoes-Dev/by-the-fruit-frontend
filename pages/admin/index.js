import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { FiUsers, FiFileText, FiShield, FiTrendingUp, FiMessageSquare, FiCalendar } from 'react-icons/fi'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { apiFetch, getToken, isAdmin } from '../../lib/api'
import AdminLayout from '../../components/AdminLayout'
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

  return (
    <>
      <Head><title>Admin — By The Fruit</title></Head>
      <AdminLayout active="overview">
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
            { icon: FiUsers,        label: 'Total users',     value: totalUsers,    sub: `${pendingUsers} pending`,       onClick: () => router.push('/admin/users') },
            { icon: FiShield,       label: 'Pending KYC',     value: pendingKycCount, sub: `${kyc.length} total`,             onClick: () => router.push('/admin/kyc') },
            { icon: FiTrendingUp,   label: 'Live offerings',  value: liveOfferings, sub: `${offerings.length} total`,       onClick: () => router.push('/admin/offerings') },
            { icon: FiFileText,     label: 'Commitments',     value: commitments.length, sub: pendingCommitments > 0 ? `${pendingCommitments} pending` : 'all signed', onClick: null },
            { icon: FiMessageSquare,label: 'Posts',           value: posts.length,  sub: 'community feed',                  onClick: null },
            { icon: FiCalendar,     label: 'Events',          value: events.length, sub: 'upcoming',                        onClick: null },
          ].map(({ icon: Icon, label, value, sub, onClick }) => (
            <motion.div
              key={label}
              whileHover={{ y: -2 }}
              onClick={onClick || undefined}
              style={{
                background: 'var(--dark2)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '18px 18px 16px',
                cursor: onClick ? 'pointer' : 'default',
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

      </AdminLayout>
    </>
  )
}
