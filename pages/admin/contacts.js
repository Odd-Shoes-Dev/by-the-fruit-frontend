import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiFetch, getToken, isAdmin } from '../../lib/api'
import AdminLayout from '../../components/AdminLayout'
import styles from '../../styles/Admin.module.css'

const unwrap = json => json?.data ?? json

export default function AdminContactsPage() {
  const router = useRouter()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (!getToken() || !isAdmin()) { router.replace('/login'); return }
    async function load() {
      try {
        const res = await apiFetch('/profiles/contact-messages/')
        if (res.ok) {
          const data = unwrap(await res.json())
          setMessages(Array.isArray(data) ? data : (data?.results || []))
        }
      } catch (e) {}
      setLoading(false)
    }
    load()
  }, [router])

  async function deleteMsg(id) {
    if (!confirm('Delete this message?')) return
    try {
      const res = await apiFetch(`/profiles/contact-messages/${id}/`, { method: 'DELETE' })
      if (res.ok || res.status === 204) {
        setMessages(m => m.filter(x => x.id !== id))
      }
    } catch (e) {}
  }

  return (
    <>
      <Head><title>Contact Messages — Admin — By The Fruit</title></Head>
      <AdminLayout active="contacts">
        <div className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Admin</p>
            <h1 className={styles.pageTitle}>Contact Messages</h1>
            <p className={styles.pageSub}>Messages submitted through the contact form.</p>
          </div>
        </div>

        <div className={styles.sectionCard}>
          {loading ? (
            <div className={styles.empty}>Loading…</div>
          ) : messages.length === 0 ? (
            <div className={styles.empty}>No contact messages yet.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Received</th>
                    <th>Message</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map(m => (
                    <tr key={m.id}>
                      <td className={styles.cellEmail}>{m.email || '—'}</td>
                      <td className={styles.cellMuted}>
                        {m.created_at ? new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td>
                        {expanded === m.id ? (
                          <div>
                            <p className={styles.msgBody}>{m.message}</p>
                            <button
                              style={{ fontSize: '0.72rem', color: 'rgba(244,239,230,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                              onClick={() => setExpanded(null)}
                            >
                              ▲ Collapse
                            </button>
                          </div>
                        ) : (
                          <button
                            style={{ fontSize: '0.72rem', color: 'var(--orange)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                            onClick={() => setExpanded(m.id)}
                          >
                            Read →
                          </button>
                        )}
                      </td>
                      <td>
                        <button className={styles.rejectBtn} onClick={() => deleteMsg(m.id)}>
                          Delete
                        </button>
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
