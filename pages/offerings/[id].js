import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { apiFetch } from '../../lib/api'
import styles from '../../styles/Offerings.module.css'

const unwrap = json => json?.data ?? json
const SALLY_PORTAL_URL = process.env.NEXT_PUBLIC_SALLY_PORTAL_URL || 'https://auth.sally.co/'

function ProgressBar({ percent }) {
  return (
    <div className={styles.progressTrack}>
      <div className={styles.progressFill} style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  )
}

export default function OfferingDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const [offering, setOffering] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let mounted = true
    async function load() {
      try {
        const res = await apiFetch(`/profiles/offerings/${id}/`)
        if (res.ok && mounted) {
          setOffering(unwrap(await res.json()))
        } else if (res.status === 404) {
          router.replace('/offerings')
        }
      } catch (e) {}
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [id, router])

  if (loading) return <div className="container"><div className="spinner">Loading…</div></div>
  if (!offering) return null

  return (
    <>
      <Head><title>{offering.title} — By The Fruit</title></Head>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <Link href="/offerings" className={styles.backLink}>← All Offerings</Link>
          </div>

          <div className={styles.detailGrid}>
            <div>
              <div className={styles.detailHeader}>
                {offering.business_logo && (
                  <img src={offering.business_logo} alt={offering.business_name} className={styles.logoLg} />
                )}
                <div>
                  <span className={styles.category}>{offering.business_category || 'Other'}</span>
                  <h1 className={styles.detailTitle}>{offering.title}</h1>
                  <p className={styles.cardSub}>{offering.business_name}</p>
                </div>
              </div>

              {offering.tagline && (
                <p className={styles.tagline} style={{ fontSize: '1.1rem', margin: '1.25rem 0' }}>&quot;{offering.tagline}&quot;</p>
              )}

              {offering.video_url && (
                <div className={styles.videoWrap}>
                  <iframe
                    src={offering.video_url.replace('watch?v=', 'embed/')}
                    title="Pitch video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className={styles.videoEmbed}
                  />
                </div>
              )}

              {offering.terms_text && (
                <div className={styles.termsBox}>
                  <h3 className={styles.sectionLabel}>Deal Terms</h3>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'rgba(244,239,230,0.75)', fontSize: '0.95rem' }}>
                    {offering.terms_text}
                  </p>
                </div>
              )}
            </div>

            <div>
              <div className={styles.investPanel}>
                <div className={styles.stats} style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '1rem' }}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Target Raise</span>
                    <span className={styles.statVal}>${Number(offering.target_raise).toLocaleString()}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Committed</span>
                    <span className={styles.statVal}>${Number(offering.total_committed || 0).toLocaleString()}</span>
                  </div>
                </div>

                <ProgressBar percent={offering.progress_percent || 0} />
                <p className={styles.progressLabel}>{offering.progress_percent || 0}% of target raised</p>

                <div className={styles.loginPrompt} style={{ marginTop: '1rem' }}>
                  <p>Investments, KYC, checkout, and signatures are handled in Sally.</p>
                  <p style={{ marginTop: '0.5rem' }}>
                    <a href={SALLY_PORTAL_URL} target="_blank" rel="noreferrer">Continue on Sally →</a>
                  </p>
                </div>

                <p className={styles.disclaimer}>
                  Investment operations are managed by Sally. By The Fruit provides discovery, community, and relationship tools.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}
