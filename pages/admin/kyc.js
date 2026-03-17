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

export default function AdminKYCPage() {
  const router = useRouter()
  const [filter, setFilter] = useState('pending')
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState({})
  const [reasons, setReasons] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/profiles/kyc-documents/')
      if (res.ok) {
        const data = unwrap(await res.json())
        const all = Array.isArray(data) ? data : (data?.results || [])
        setDocs(all)
      }
    } catch (e) {}
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!getToken() || !isAdmin()) { router.replace('/login'); return }
    load()
  }, [router, load])

  async function approve(docId) {
    setActing(a => ({ ...a, [docId]: true }))
    try {
      const res = await apiFetch(`/profiles/kyc-documents/${docId}/approve/`, { method: 'POST' })
      if (res.ok) {
        const updated = unwrap(await res.json())
        setDocs(d => d.map(x => x.id === docId ? updated : x))
      }
    } catch (e) {}
    setActing(a => { const n = { ...a }; delete n[docId]; return n })
  }

  async function reject(docId) {
    setActing(a => ({ ...a, [docId]: true }))
    try {
      const reason = reasons[docId] || ''
      const res = await apiFetch(`/profiles/kyc-documents/${docId}/reject/`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
      if (res.ok) {
        const updated = unwrap(await res.json())
        setDocs(d => d.map(x => x.id === docId ? updated : x))
        setReasons(r => { const n = { ...r }; delete n[docId]; return n })
      }
    } catch (e) {}
    setActing(a => { const n = { ...a }; delete n[docId]; return n })
  }

  const filtered = filter === 'all' ? docs : docs.filter(d => d.status === filter)

  return (
    <>
      <Head><title>KYC Queue — Admin — By The Fruit</title></Head>
      <AdminLayout active="kyc">
        <div className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Admin</p>
            <h1 className={styles.pageTitle}>KYC Documents</h1>
            <p className={styles.pageSub}>Review and approve investor identity documents.</p>
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
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>No KYC documents with status "{filter}".</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Investor</th>
                    <th>Doc Type</th>
                    <th>Document</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(doc => (
                    <tr key={doc.id}>
                      <td>
                        <div className={styles.cellPrimary}>{doc.user_name || doc.user || '—'}</div>
                        <div className={styles.cellEmail}>{doc.user_email || ''}</div>
                      </td>
                      <td className={styles.cellMuted}>{doc.document_type || '—'}</td>
                      <td>
                        {doc.document_file ? (
                          <a href={doc.document_file} target="_blank" rel="noreferrer" style={{ color: 'var(--orange)', fontSize: '0.78rem' }}>
                            View file ↗
                          </a>
                        ) : (
                          <span className={styles.cellMuted}>—</span>
                        )}
                      </td>
                      <td className={styles.cellMuted}>
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td>
                        <span className={`${styles.pill} ${doc.status === 'approved' ? styles.pillGreen : doc.status === 'rejected' ? styles.pillRed : styles.pillOrange}`}>
                          {doc.status}
                        </span>
                        {doc.rejection_reason && (
                          <div className={styles.cellMuted} style={{ marginTop: 2 }}>Reason: {doc.rejection_reason}</div>
                        )}
                      </td>
                      <td>
                        {doc.status === 'pending' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <div className={styles.actionRow}>
                              <button
                                className={styles.approveBtn}
                                disabled={!!acting[doc.id]}
                                onClick={() => approve(doc.id)}
                              >
                                Approve
                              </button>
                              <button
                                className={styles.rejectBtn}
                                disabled={!!acting[doc.id]}
                                onClick={() => reject(doc.id)}
                              >
                                Reject
                              </button>
                            </div>
                            <input
                              className={styles.reasonInput}
                              placeholder="Rejection reason (optional)"
                              value={reasons[doc.id] || ''}
                              onChange={e => setReasons(r => ({ ...r, [doc.id]: e.target.value }))}
                            />
                          </div>
                        ) : (
                          <span className={styles.cellMuted}>
                            Reviewed {doc.reviewed_at ? new Date(doc.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                          </span>
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
    </>
  )
}
