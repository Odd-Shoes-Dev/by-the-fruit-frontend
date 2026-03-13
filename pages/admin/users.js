import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiFetch, getToken, isAdmin } from '../../lib/api'
import AdminLayout from '../../components/AdminLayout'
import styles from '../../styles/Admin.module.css'

const unwrap = json => json?.data ?? json

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [acting, setActing] = useState({})

  useEffect(() => {
    if (!getToken() || !isAdmin()) { router.replace('/login'); return }
    async function load() {
      try {
        const res = await apiFetch('/user/waitlist?status=all')
        if (res.ok) {
          const data = unwrap(await res.json())
          setUsers(Array.isArray(data) ? data : (data?.results || []))
        }
      } catch (e) {}
      setLoading(false)
    }
    load()
  }, [router])

  async function act(userId, action) {
    setActing(a => ({ ...a, [userId]: true }))
    try {
      const res = await apiFetch(`/user/waitlist/${userId}/action`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        const newStatus = action === 'approve' ? 'approved' : 'rejected'
        setUsers(u => u.map(x => x.id === userId ? { ...x, approval_status: newStatus } : x))
      }
    } catch (e) {}
    setActing(a => { const n = { ...a }; delete n[userId]; return n })
  }

  const filtered = users.filter(u => {
    const matchSearch = !search || (u.full_name || '').toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || u.approval_status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <>
      <Head><title>Users — Admin — By The Fruit</title></Head>
      <AdminLayout active="users">
        <div className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Admin</p>
            <h1 className={styles.pageTitle}>All Users</h1>
            <p className={styles.pageSub}>Search and manage all registered members.</p>
          </div>
        </div>

        <div className={styles.filterBar}>
          <input
            className={styles.searchInput}
            placeholder="Search name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              className={`${styles.filterBtn} ${filterStatus === s ? styles.filterActive : ''}`}
              onClick={() => setFilterStatus(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.sectionCard}>
          {loading ? (
            <div className={styles.empty}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>No users found.</div>
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
                    <th>Businesses</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id}>
                      <td className={styles.cellPrimary}>{u.full_name || '—'}</td>
                      <td className={styles.cellEmail}>{u.email}</td>
                      <td className={styles.cellMuted}>{u.location || '—'}</td>
                      <td className={styles.cellMuted}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}
                      </td>
                      <td>
                        <span className={`${styles.pill} ${u.approval_status === 'approved' ? styles.pillGreen : u.approval_status === 'rejected' ? styles.pillRed : styles.pillOrange}`}>
                          {u.approval_status}
                        </span>
                      </td>
                      <td className={styles.cellMuted}>
                        {u.businesses?.length ? u.businesses.map(b => b.name).join(', ') : '—'}
                      </td>
                      <td>
                        <div className={styles.actionRow}>
                          {u.approval_status !== 'approved' && (
                            <button
                              className={styles.approveBtn}
                              disabled={!!acting[u.id]}
                              onClick={() => act(u.id, 'approve')}
                            >
                              Approve
                            </button>
                          )}
                          {u.approval_status !== 'rejected' && (
                            <button
                              className={styles.rejectBtn}
                              disabled={!!acting[u.id]}
                              onClick={() => act(u.id, 'reject')}
                            >
                              Reject
                            </button>
                          )}
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
