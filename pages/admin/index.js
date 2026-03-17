import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { FiUsers, FiTrendingUp, FiMessageSquare, FiCalendar, FiShield } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { apiFetch, getToken, isAdmin } from '../../lib/api'
import AdminLayout from '../../components/AdminLayout'

const SALLY_PORTAL_URL = process.env.NEXT_PUBLIC_SALLY_PORTAL_URL || 'https://auth.sally.co/'

export default function AdminIndex() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  const [allUsers, setAllUsers] = useState([])
  const [offerings, setOfferings] = useState([])
  const [posts, setPosts] = useState([])
  const [events, setEvents] = useState([])

  useEffect(() => {
    if (!getToken() || !isAdmin()) {
      router.replace('/')
      return
    }
    setMounted(true)
    loadData()
  }, [router])

  async function loadData() {
    setLoading(true)
    try {
      const [usersRes, offeringsRes, postsRes, eventsRes] = await Promise.all([
        apiFetch('/user/waitlist?status=all'),
        apiFetch('/profiles/offerings/?all=true'),
        apiFetch('/profiles/community-posts/'),
        apiFetch('/profiles/events/upcoming/'),
      ])

      const toArr = async (res) => {
        if (!res.ok) return []
        const json = await res.json()
        const raw = json?.data ?? json
        return Array.isArray(raw) ? raw : (raw?.results || [])
      }

      setAllUsers(await toArr(usersRes))
      setOfferings(await toArr(offeringsRes))
      setPosts(await toArr(postsRes))
      setEvents(await toArr(eventsRes))
    } catch (e) {}
    setLoading(false)
  }

  if (!mounted) return <div className="container"><div className="spinner">Loading…</div></div>

  const pendingUsers = allUsers.filter(u => u.approval_status === 'pending').length
  const liveOfferings = offerings.filter(o => o.status === 'live').length

  const cards = [
    { icon: FiUsers, label: 'Total users', value: allUsers.length, sub: `${pendingUsers} pending` },
    { icon: FiTrendingUp, label: 'Live offerings', value: liveOfferings, sub: `${offerings.length} total` },
    { icon: FiMessageSquare, label: 'Posts', value: posts.length, sub: 'community feed' },
    { icon: FiCalendar, label: 'Events', value: events.length, sub: 'upcoming' },
    { icon: FiShield, label: 'KYC & Commitments', value: 'Sally', sub: 'managed externally' },
  ]

  return (
    <>
      <Head><title>Admin — By The Fruit</title></Head>
      <AdminLayout active="overview">
        <header className="page-header">
          <h1>Admin Dashboard</h1>
          <p className="tagline">
            Platform operations in By The Fruit, with fundraising lifecycle delegated to Sally.
          </p>
        </header>

        <div style={{ marginBottom: 18, padding: 16, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--dark2)' }}>
          <strong>Sally-managed operations:</strong> KYC review, commitments, funding, and signatures.
          <div style={{ marginTop: 8 }}>
            <a href={SALLY_PORTAL_URL} target="_blank" rel="noreferrer">Open Sally Admin →</a>
          </div>
        </div>

        {loading ? (
          <div className="spinner">Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 }}>
            {cards.map(({ icon: Icon, label, value, sub }) => (
              <motion.div
                key={label}
                whileHover={{ y: -2 }}
                style={{
                  background: 'var(--dark2)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: '18px 18px 16px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Icon size={15} style={{ color: 'rgba(45,59,81,0.35)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                </div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--cream)', lineHeight: 1 }}>
                  {value}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 5 }}>{sub}</div>
              </motion.div>
            ))}
          </div>
        )}
      </AdminLayout>
    </>
  )
}
