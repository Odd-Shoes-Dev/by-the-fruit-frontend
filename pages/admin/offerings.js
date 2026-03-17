import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiFetch, getToken, isAdmin } from '../../lib/api'
import AdminLayout from '../../components/AdminLayout'
import styles from '../../styles/Admin.module.css'

const unwrap = json => json?.data ?? json

const SALLY_PORTAL_URL = process.env.NEXT_PUBLIC_SALLY_PORTAL_URL || 'https://auth.sally.co/'

export default function AdminOfferingsPage() {
  const router = useRouter()
  const [offerings, setOfferings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!getToken() || !isAdmin()) { router.replace('/login'); return }
    async function load() {
      try {
        const res = await apiFetch('/profiles/offerings/?all=true')
        if (res.ok) {
          const data = unwrap(await res.json())
          setOfferings(Array.isArray(data) ? data : (data?.results || []))
        }
      } catch (e) {}
      setLoading(false)
    }
    load()
  }, [router])

  const filtered = offerings.filter(o => {
    const matchFilter = filter === 'all' || o.status === filter
    const matchSearch = !search || (o.title || '').toLowerCase().includes(search.toLowerCase()) || (o.business_name || '').toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  return (
    <>
      <Head><title>Offerings — Admin — By The Fruit</title></Head>
      <AdminLayout active="offerings">
        <div className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Admin</p>
            <h1 className={styles.pageTitle}>All Offerings</h1>
            <p className={styles.pageSub}>Overview of all fundraising offerings on the platform.</p>
          </div>
        </div>

        <div className={styles.filterBar}>
          <input
            className={styles.searchInput}
            placeholder="Search title or company…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {['all', 'live', 'draft', 'closed', 'cancelled'].map(s => (
            <button
              key={s}
              className={`${styles.filterBtn} ${filter === s ? styles.filterActive : ''}`}
              onClick={() => setFilter(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.sectionCard}>
          {loading ? (
            <div className={styles.empty}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>No offerings found.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Target</th>
                    <th>Raised</th>
                    <th>Progress</th>
                    <th>Closing</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o.id}>
                      <td className={styles.cellPrimary}>{o.title}</td>
                      <td className={styles.cellMuted}>{o.business_name || '—'}</td>
                      <td>
                        <span className={`${styles.pill} ${o.status === 'live' ? styles.pillGreen : o.status === 'closed' ? styles.pillBlue : o.status === 'cancelled' ? styles.pillRed : styles.pillGrey}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className={styles.cellMuted}>${Number(o.target_raise).toLocaleString()}</td>
                      <td className={styles.cellMuted}>${Number(o.total_committed || 0).toLocaleString()}</td>
                      <td className={styles.cellMuted}>{o.progress_percent ?? 0}%</td>
                      <td className={styles.cellMuted}>
                        {o.closing_date ? new Date(o.closing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td>
                        <div className={styles.actionRow}>
                          <Link href={`/offerings/${o.id}`} style={{ color: 'var(--orange)', fontSize: '0.74rem', textDecoration: 'none' }}>
                            View
                          </Link>
                          <a href={SALLY_PORTAL_URL} target="_blank" rel="noreferrer" style={{ color: 'rgba(244,239,230,0.35)', fontSize: '0.74rem', textDecoration: 'none' }}>
                            Sally Pipeline
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdminLayout>
    </>
  )
}
