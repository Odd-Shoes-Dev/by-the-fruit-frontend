import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { apiFetch, getToken } from '../../lib/api'
import styles from '../../styles/Offerings.module.css'

const unwrap = json => { const r = json?.data ?? json; return Array.isArray(r) ? r : Array.isArray(r?.results) ? r.results : [] }

function ProgressBar({ percent }) {
  return (
    <div className={styles.progressTrack}>
      <div className={styles.progressFill} style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  )
}

export default function OfferingsPage() {
  const [offerings, setOfferings] = useState([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  useEffect(() => {
    setToken(getToken())
    let mounted = true
    async function load() {
      try {
        const res = await apiFetch('/profiles/offerings/?status=live&is_public=true')
        // Client-side guard: only show live + public in case backend scope changes
        if (res.ok && mounted) {
          const all = unwrap(await res.json())
          setOfferings(all.filter(o => o.status === 'live' && o.is_public))
        }
      } catch (e) {}
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <>
      <Head><title>Offerings — By The Fruit</title></Head>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.header}>
            <div>
              <p className={styles.eyebrow}>Current Raises</p>
              <h1 className={styles.title}>Live Offerings</h1>
              <p className={styles.sub}>Founders raising capital on By The Fruit. Commit your interest — full investment flow coming soon.</p>
            </div>
          </div>

          {loading && <div className="spinner">Loading offerings…</div>}

          {!loading && offerings.length === 0 && (
            <div className={styles.empty}>
              <p>No live offerings at the moment. Check back soon.</p>
            </div>
          )}

          <div className={styles.grid}>
            {offerings.map(o => (
              <motion.div
                key={o.id}
                className={styles.card}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className={styles.cardTop}>
                  {o.business_logo && (
                    <img src={o.business_logo} alt={o.business_name} className={styles.logo} />
                  )}
                  <div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span className={styles.category}>{o.business_category || 'Other'}</span>
                      {o.round_type_display && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '2px 8px', borderRadius: 20, background: 'rgba(245,166,35,0.12)', color: 'var(--orange)', border: '1px solid rgba(245,166,35,0.3)' }}>
                          {o.round_type_display}
                        </span>
                      )}
                    </div>
                    <h2 className={styles.cardTitle}>{o.title}</h2>
                    <p className={styles.cardSub}>{o.business_name}</p>
                  </div>
                </div>

                {o.tagline && <p className={styles.tagline}>&quot;{o.tagline}&quot;</p>}

                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Target</span>
                    <span className={styles.statVal}>${Number(o.target_raise).toLocaleString()}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>🌱 Seeds</span>
                    <span className={styles.statVal}>{o.seed_count ?? 0}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Min. Investment</span>
                    <span className={styles.statVal}>${Number(o.min_investment).toLocaleString()}</span>
                  </div>
                  {o.closing_date && (
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Closes</span>
                      <span className={styles.statVal}>{new Date(o.closing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>

                <ProgressBar percent={o.progress_percent || 0} />
                <p className={styles.progressLabel}>{o.progress_percent || 0}% of target raised</p>

                <Link href={`/offerings/${o.id}`} className={styles.viewBtn}>
                  View Offering →
                </Link>
              </motion.div>
            ))}
          </div>

          {!token && (
            <div className={styles.loginPrompt}>
              <p>You must be <Link href="/login">logged in</Link> and approved to commit to an offering.</p>
            </div>
          )}
        </motion.div>
      </div>
    </>
  )
}
