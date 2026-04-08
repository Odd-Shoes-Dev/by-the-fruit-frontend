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

const ROLE_LABELS = {
  founder: 'Founder / Builder',
  investor: 'Investor',
  donor: 'Donor',
  creator: 'Creator',
  exploring: 'Just exploring',
  general: 'General Member',
}

const CAPACITY_LABELS = {
  just_starting: 'Just getting started',
  '1k_10k': '$1K-$10K',
  '10k_50k': '$10K-$50K',
  '50k_plus': '$50K+',
  prefer_not_say: 'Prefer not to say',
}

const AUDIENCE_LABELS = {
  yes_active: 'Yes – actively',
  exploring: 'Maybe – exploring',
  not_yet: 'Not yet',
}

const RAISING_LABELS = {
  currently_raising: 'Currently raising',
  soon: 'Soon',
  exploring: 'Exploring',
}

export default function AdminWaitlistPage() {
  const router = useRouter()
  const [filter, setFilter] = useState('pending')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState({})
  const [drawer, setDrawer] = useState(null) // user object or null

  const load = useCallback(async (f = filter) => {
    setLoading(true)
    try {
      const res = await apiFetch(`/user/waitlist?status=${f}`)
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

  // close drawer on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') setDrawer(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  async function act(userId, action) {
    setActing(a => ({ ...a, [userId]: true }))
    try {
      const res = await apiFetch(`/user/waitlist/${userId}/action`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        setUsers(u => u.filter(x => x.id !== userId))
        setDrawer(null)
      }
    } catch (e) {}
    setActing(a => { const n = { ...a }; delete n[userId]; return n })
  }

  return (
    <>
      <Head><title>Waitlist – Admin – By The Fruit</title></Head>
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
            <div className={styles.empty}>No users with status &quot;{filter}&quot;.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr
                      key={u.id}
                      className={styles.clickableRow}
                      onClick={() => setDrawer(u)}
                    >
                      <td className={styles.cellPrimary}>{u.full_name || '–'}</td>
                      <td className={styles.cellEmail}>{u.email}</td>
                      <td className={styles.cellMuted}>{ROLE_LABELS[u.intended_role] || u.intended_role || '–'}</td>
                      <td className={styles.cellMuted}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '–'}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <ApprovalPill status={u.approval_status} />
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        {filter !== 'approved' && filter !== 'rejected' ? (
                          <div className={styles.actionRow}>
                            <button className={styles.approveBtn} disabled={!!acting[u.id]} onClick={() => act(u.id, 'approve')}>Approve</button>
                            <button className={styles.rejectBtn} disabled={!!acting[u.id]} onClick={() => act(u.id, 'reject')}>Reject</button>
                          </div>
                        ) : (
                          <button className={styles.viewBtn} onClick={e => { e.stopPropagation(); setDrawer(u) }}>View</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdminLayout>

      {/* Drawer overlay */}
      {drawer && (
        <>
          <div className={styles.drawerOverlay} onClick={() => setDrawer(null)} />
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <div>
                <p className={styles.drawerName}>{drawer.full_name || '—'}</p>
                <p className={styles.drawerEmail}>{drawer.email}</p>
              </div>
              <button className={styles.drawerClose} onClick={() => setDrawer(null)}>x</button>
            </div>

            <div className={styles.drawerBody}>
              <div className={styles.drawerSection}>
                <p className={styles.drawerLabel}>Status</p>
                <ApprovalPill status={drawer.approval_status} />
              </div>
              <div className={styles.drawerSection}>
                <p className={styles.drawerLabel}>Role</p>
                <p className={styles.drawerValue}>{ROLE_LABELS[drawer.intended_role] || drawer.intended_role || '–'}</p>
              </div>
              <div className={styles.drawerSection}>
                <p className={styles.drawerLabel}>Joined</p>
                <p className={styles.drawerValue}>
                  {drawer.created_at ? new Date(drawer.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '–'}
                </p>
              </div>

              {drawer.conviction_profile && (
                <>
                  <hr className={styles.drawerDivider} />
                  <p className={styles.drawerSectionTitle}>Intake Answers</p>

                  {drawer.conviction_profile.profile_label && (
                    <div className={styles.drawerSection}>
                      <p className={styles.drawerLabel}>Profile</p>
                      <p className={styles.drawerValue}>{drawer.conviction_profile.profile_label}</p>
                    </div>
                  )}
                  {drawer.conviction_profile.convictions?.length > 0 && (
                    <div className={styles.drawerSection}>
                      <p className={styles.drawerLabel}>Convictions</p>
                      <div className={styles.drawerTags}>
                        {drawer.conviction_profile.convictions.map(c => (
                          <span key={c} className={styles.drawerTag}>{c.replace(/_/g, ' ')}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {drawer.conviction_profile.activation_modes?.length > 0 && (
                    <div className={styles.drawerSection}>
                      <p className={styles.drawerLabel}>How they want to show up</p>
                      <div className={styles.drawerTags}>
                        {drawer.conviction_profile.activation_modes.map(m => (
                          <span key={m} className={styles.drawerTag}>{m.replace(/_/g, ' ')}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {drawer.conviction_profile.capacity_level && (
                    <div className={styles.drawerSection}>
                      <p className={styles.drawerLabel}>Capacity</p>
                      <p className={styles.drawerValue}>{CAPACITY_LABELS[drawer.conviction_profile.capacity_level] || drawer.conviction_profile.capacity_level}</p>
                    </div>
                  )}
                  {drawer.conviction_profile.has_audience && (
                    <div className={styles.drawerSection}>
                      <p className={styles.drawerLabel}>Has audience</p>
                      <p className={styles.drawerValue}>{AUDIENCE_LABELS[drawer.conviction_profile.has_audience] || drawer.conviction_profile.has_audience}</p>
                    </div>
                  )}
                  {drawer.conviction_profile.audience_platforms?.length > 0 && (
                    <div className={styles.drawerSection}>
                      <p className={styles.drawerLabel}>Platforms</p>
                      <div className={styles.drawerTags}>
                        {drawer.conviction_profile.audience_platforms.map(p => (
                          <span key={p} className={styles.drawerTag}>{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {drawer.conviction_profile.raising_status && (
                    <div className={styles.drawerSection}>
                      <p className={styles.drawerLabel}>Raising status</p>
                      <p className={styles.drawerValue}>{RAISING_LABELS[drawer.conviction_profile.raising_status] || drawer.conviction_profile.raising_status}</p>
                    </div>
                  )}
                  {drawer.conviction_profile.building_description && (
                    <div className={styles.drawerSection}>
                      <p className={styles.drawerLabel}>What they&apos;re building</p>
                      <p className={styles.drawerValue}>{drawer.conviction_profile.building_description}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {drawer.approval_status === 'pending' && (
              <div className={styles.drawerFooter}>
                <button
                  className={styles.approveBtn}
                  disabled={!!acting[drawer.id]}
                  onClick={() => act(drawer.id, 'approve')}
                >
                  {acting[drawer.id] ? 'Approving…' : 'Approve'}
                </button>
                <button
                  className={styles.rejectBtn}
                  disabled={!!acting[drawer.id]}
                  onClick={() => act(drawer.id, 'reject')}
                >
                  {acting[drawer.id] ? 'Rejecting…' : 'Reject'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}

function ApprovalPill({ status }) {
  const cls = status === 'approved' ? styles.pillGreen : status === 'rejected' ? styles.pillRed : styles.pillOrange
  return <span className={`${styles.pill} ${cls}`}>{status}</span>
}
