import Head from 'next/head'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { apiFetch, getToken, isAdmin } from '../../lib/api'
import AdminLayout from '../../components/AdminLayout'
import styles from '../../styles/Admin.module.css'

const unwrap = json => json?.data ?? json

const STATUS_FILTERS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
]

export default function AdminWaitlistPage() {
  const router = useRouter()
  const [filter, setFilter] = useState('pending')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState({}) // userId → true while in-flight

  const load = useCallback(async (f = filter) => {
    setLoading(true)
    try {
      const res = await apiFetch(`/accounts/waitlist?status=${f}`)
      if (res.ok) {
        const data = unwrap(await res.json())
        setUsers(Array.isArray(data) ? data : (data?.results || []))
      }
    } catch (e) {}
    setLoading(false)
  }, [filter])

  useEffect(() => {
    if (!getToken() || !isAdmin()) { router.replace('/login'); return }
    load(filter)
  }, [filter, router, load])

  async function act(userId, action) {
    setActing(a => ({ ...a, [userId]: true }))
    try {
      const res = await apiFetch(`/accounts/waitlist/${userId}/action`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        setUsers(u => u.filter(x => x.id !== userId))
      }
    } catch (e) {}
    setActing(a => { const n = { ...a }; delete n[userId]; return n })
  }

  const pending_count = filter === 'pending' ? users.length : undefined

  return (
    <>
      <Head><title>Waitlist — Admin — By The Fruit</title></Head>
      <AdminLayout active="waitlist">
        <div className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Admin</p>
            <h1 className={styles.pageTitle}>Waitlist</h1>
            <p className={styles.pageSub}>Approve or reject signup requests.</p>
          </div>
        </div>

        <div className={styles.filterBar}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f.key}
              className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className={styles.sectionCard}>
          {loading ? (
            <div className={styles.empty}>Loading…</div>
          ) : users.length === 0 ? (
            <div className={styles.empty}>No users with status "{filter}".</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Location</th>
                    <th>Joined</th>
                    <th>Status</th>
                    {filter !== 'approved' && filter !== 'rejected' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className={styles.cellPrimary}>{u.full_name || '—'}</td>
                      <td className={styles.cellEmail}>{u.email}</td>
                      <td className={styles.cellMuted}>{u.location || '—'}</td>
                      <td className={styles.cellMuted}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td>
                        <ApprovalPill status={u.approval_status} />
                      </td>
                      {filter !== 'approved' && filter !== 'rejected' && (
                        <td>
                          <div className={styles.actionRow}>
                            <button
                              className={styles.approveBtn}
                              disabled={!!acting[u.id]}
                              onClick={() => act(u.id, 'approve')}
                            >
                              Approve
                            </button>
                            <button
                              className={styles.rejectBtn}
                              disabled={!!acting[u.id]}
                              onClick={() => act(u.id, 'reject')}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      )}
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

function ApprovalPill({ status }) {
  const cls = status === 'approved' ? styles.pillGreen : status === 'rejected' ? styles.pillRed : styles.pillOrange
  return <span className={`${styles.pill} ${cls}`}>{status}</span>
}
