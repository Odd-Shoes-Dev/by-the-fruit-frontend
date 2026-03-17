import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { apiFetch, getToken } from '../lib/api'
import styles from '../styles/MyOfferings.module.css'

const unwrap = json => json?.data ?? json

const STATUS_COLORS = {
  draft: '#9E9E9E',
  live: '#4CAF50',
  closed: '#2196F3',
  cancelled: '#e53935',
}

const SALLY_PORTAL_URL = process.env.NEXT_PUBLIC_SALLY_PORTAL_URL || 'https://auth.sally.co/'

export default function MyOfferingsPage() {
  const router = useRouter()
  const [offerings, setOfferings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return }
    async function load() {
      try {
        const res = await apiFetch('/profiles/offerings/my-offerings/')
        if (res.ok) {
          const data = unwrap(await res.json())
          setOfferings(Array.isArray(data) ? data : (data?.results || []))
        }
      } catch (e) {}
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <div className="container"><div className="spinner">Loading…</div></div>

  return (
    <>
      <Head><title>My Offerings — By The Fruit</title></Head>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

          <div className={styles.header}>
            <div>
              <p className={styles.eyebrow}>Issuer Dashboard</p>
              <h1 className={styles.title}>My Offerings</h1>
              <p className={styles.sub}>View offering progress here and manage transactions in Sally.</p>
            </div>
            <a href={SALLY_PORTAL_URL} target="_blank" rel="noreferrer" className={styles.newBtn}>
              Open Sally
            </a>
          </div>

          {offerings.length === 0 ? (
            <div className={styles.empty}>
              <p>You haven&apos;t created any offerings yet.</p>
              <a href={SALLY_PORTAL_URL} target="_blank" rel="noreferrer" className={styles.emptyBtn}>
                Create Offering in Sally →
              </a>
            </div>
          ) : (
            <div className={styles.list}>
              {offerings.map(o => (
                <div key={o.id} className={styles.card}>
                  <div className={styles.cardLeft}>
                    <div className={styles.cardTitleRow}>
                      <h2 className={styles.cardTitle}>{o.title}</h2>
                      <span
                        className={styles.statusPill}
                        style={{ background: STATUS_COLORS[o.status] || '#555' }}
                      >
                        {o.status}
                      </span>
                    </div>
                    {o.tagline && <p className={styles.cardTagline}>{o.tagline}</p>}
                    <div className={styles.cardMeta}>
                      <span>Target: <strong>${Number(o.target_raise).toLocaleString()}</strong></span>
                      {o.closing_date && (
                        <span>Closes: <strong>{new Date(o.closing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
                      )}
                      <span>
                        Progress: <strong>{o.progress_percent ?? 0}%</strong>
                        {' '}(${Number(o.total_committed || 0).toLocaleString()} raised)
                      </span>
                    </div>
                  </div>
                  <div className={styles.cardActions}>
                    <Link href={`/offerings/${o.id}`} className={styles.viewBtn}>
                      View
                    </Link>
                    <a href={SALLY_PORTAL_URL} target="_blank" rel="noreferrer" className={styles.dashBtn}>
                      Manage in Sally
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

        </motion.div>
      </div>
    </>
  )
}
