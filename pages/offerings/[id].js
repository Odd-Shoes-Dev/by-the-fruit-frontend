import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { apiFetch, getToken, isAdmin } from '../../lib/api'
import styles from '../../styles/Offerings.module.css'

const unwrap = json => { const r = json?.data ?? json; return r }

function getYouTubeEmbedUrl(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    let videoId = null
    if (u.hostname === 'youtu.be') {
      // https://youtu.be/VIDEO_ID
      videoId = u.pathname.slice(1).split('?')[0]
    } else if (u.pathname.includes('/shorts/')) {
      // https://youtube.com/shorts/VIDEO_ID
      videoId = u.pathname.split('/shorts/')[1].split('?')[0]
    } else {
      // https://www.youtube.com/watch?v=VIDEO_ID
      videoId = u.searchParams.get('v')
    }
    if (!videoId) return null
    return `https://www.youtube.com/embed/${videoId}`
  } catch {
    return null
  }
}

export default function OfferingDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const [offering, setOffering] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)
  const [admin, setAdmin] = useState(false)
  const [seedCount, setSeedCount] = useState(0)
  const [userHasSeeded, setUserHasSeeded] = useState(false)
  const [recentSeeders, setRecentSeeders] = useState([])
  const [seeding, setSeeding] = useState(false)
  const [showDeck, setShowDeck] = useState(false)

  useEffect(() => {
    setToken(getToken())
    setAdmin(isAdmin())
  }, [])

  useEffect(() => {
    if (!id) return
    let mounted = true
    async function load() {
      try {
        const res = await apiFetch(`/profiles/offerings/${id}/`)
        if (res.ok && mounted) {
          const data = unwrap(await res.json())
          setOffering(data)
          setSeedCount(data.seed_count || 0)
          setUserHasSeeded(data.user_has_seeded || false)
          setRecentSeeders(data.recent_seeders || [])
        } else if (res.status === 404) {
          router.replace('/offerings')
        }
      } catch (e) {}
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [id, router])

  async function handleSeed() {
    if (!token) { router.push('/login'); return }
    setSeeding(true)
    const action = userHasSeeded ? 'unseed' : 'seed'
    try {
      const res = await apiFetch(`/profiles/offerings/${id}/${action}/`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setSeedCount(data.seed_count)
        setUserHasSeeded(!userHasSeeded)
      }
    } catch (e) {}
    setSeeding(false)
  }

  if (loading) return <div className="container"><div className="spinner">Loading…</div></div>
  if (!offering) return null

  return (
    <>
      <Head><title>{offering.title} — By The Fruit</title></Head>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <Link href="/offerings" className={styles.backLink}>← All Offerings</Link>
            {admin && (
              <Link href={`/offerings/dashboard/${id}`} className={styles.dashboardLink}>
                Pipeline Dashboard →
              </Link>
            )}
          </div>

          <div className={styles.detailGrid}>
            {/* Left — main content */}
            <div>
              <div className={styles.detailHeader}>
                {offering.business_logo && (
                  <img src={offering.business_logo} alt={offering.business_name} className={styles.logoLg} />
                )}
                <div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span className={styles.category}>{offering.business_category || 'Other'}</span>
                    {offering.round_type_display && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '2px 10px', borderRadius: 20, background: 'rgba(245,166,35,0.12)', color: 'var(--orange)', border: '1px solid rgba(245,166,35,0.3)' }}>
                        {offering.round_type_display}
                      </span>
                    )}
                  </div>
                  <h1 className={styles.detailTitle}>{offering.title}</h1>
                  <p className={styles.cardSub}>{offering.business_name}</p>
                </div>
              </div>

              {offering.tagline && (
                <p className={styles.tagline} style={{ fontSize: '1.1rem', margin: '1.25rem 0' }}>&quot;{offering.tagline}&quot;</p>
              )}

              {/* Business / founder info */}
              {offering.business_description && (
                <div style={{ margin: '1.25rem 0', padding: '1.25rem', background: 'rgba(61,46,30,0.04)', borderRadius: 10, borderLeft: '3px solid var(--orange)' }}>
                  <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.55 }}>About the Company</h3>
                  <p style={{ margin: 0, lineHeight: 1.7, fontSize: '0.95rem' }}>{offering.business_description}</p>
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.82rem', opacity: 0.6 }}>
                    {offering.business_city && <span>📍 {offering.business_city}</span>}
                    {offering.founder_name && <span>👤 {offering.founder_name}</span>}
                    {offering.business_website && (
                      <a href={offering.business_website} target="_blank" rel="noreferrer" style={{ color: 'var(--orange)', textDecoration: 'none' }}>🔗 Website</a>
                    )}
                  </div>
                </div>
              )}

              {getYouTubeEmbedUrl(offering.video_url) && (
                <div className={styles.videoWrap}>
                  <iframe
                    src={getYouTubeEmbedUrl(offering.video_url)}
                    title="Pitch video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className={styles.videoEmbed}
                  />
                </div>
              )}

              {offering.terms_text && (
                <div className={styles.termsBox}>
                  <h3 className={styles.sectionLabel}>About this Project</h3>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#3d2e1e', fontSize: '0.95rem' }}>
                    {offering.terms_text}
                  </p>
                </div>
              )}

              {/* Pitch Deck */}
              {offering.pitch_deck && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: showDeck ? 12 : 0 }}>
                    <a href={offering.pitch_deck} target="_blank" rel="noreferrer" className={styles.deckLink}>
                      📎 Download Pitch Deck
                    </a>
                    <button
                      onClick={() => setShowDeck(v => !v)}
                      style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.5rem 1rem', fontSize: '0.88rem', cursor: 'pointer', color: 'inherit', fontWeight: 600 }}
                    >
                      {showDeck ? 'Hide Preview ▲' : 'Preview ▼'}
                    </button>
                  </div>
                  {showDeck && (
                    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', marginTop: 4 }}>
                      <iframe
                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(offering.pitch_deck)}&embedded=true`}
                        title="Pitch Deck Preview"
                        width="100%"
                        height="520"
                        style={{ display: 'block', border: 'none' }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right — seed panel */}
            <div>
              <div className={styles.investPanel}>
                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem 1.5rem', marginBottom: '1.25rem' }}>
                  {offering.target_raise && (
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5, marginBottom: 4 }}>Target Raise</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>${Number(offering.target_raise).toLocaleString()}</div>
                    </div>
                  )}
                  {offering.min_investment && (
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5, marginBottom: 4 }}>Min. Investment</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>${Number(offering.min_investment).toLocaleString()}</div>
                    </div>
                  )}
                  {offering.closing_date && (
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5, marginBottom: 4 }}>Closes</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{new Date(offering.closing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                  )}
                </div>

                {/* Seed progress bar */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ height: 6, borderRadius: 10, background: 'rgba(61,46,30,0.1)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 10, background: 'var(--orange)', width: `${offering.seed_progress_percent || 0}%`, transition: 'width 0.5s' }} />
                  </div>
                  <p style={{ fontSize: '0.78rem', margin: '0.4rem 0 0', opacity: 0.5 }}>
                    {seedCount} / {offering.target_seeds ?? '—'} seeds · {offering.seed_progress_percent || 0}% toward seed goal
                  </p>
                </div>

                {/* Seed count */}
                <div style={{ textAlign: 'center', padding: '0.75rem 0', borderTop: '1px solid var(--border)', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '1.5rem' }}>🌱</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.25rem 0 0.1rem' }}>{seedCount}</div>
                  <div style={{ fontSize: '0.82rem', opacity: 0.6 }}>{seedCount === 1 ? 'person believes' : 'people believe'} in this project</div>
                  {recentSeeders.length > 0 && (
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', opacity: 0.5 }}>
                      {recentSeeders.slice(0, 3).join(', ')}{recentSeeders.length > 3 ? ` +${recentSeeders.length - 3} more` : ''}
                    </p>
                  )}
                </div>

                {/* Seed button */}
                <button
                  onClick={handleSeed}
                  disabled={seeding}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 12,
                    border: userHasSeeded ? '2px solid rgba(245,166,35,0.6)' : 'none',
                    background: userHasSeeded ? 'transparent' : '#F5A623',
                    color: userHasSeeded ? '#F5A623' : '#fff',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: seeding ? 'not-allowed' : 'pointer',
                    opacity: seeding ? 0.6 : 1,
                    transition: 'all 0.15s',
                    marginBottom: '1rem',
                  }}
                >
                  {seeding ? '…' : userHasSeeded ? '✓ You believe in this' : '🌱 Seed this project'}
                </button>

                {!token && (
                  <p style={{ fontSize: '0.8rem', textAlign: 'center', opacity: 0.55, margin: 0 }}>
                    <Link href="/login" style={{ color: 'var(--orange)' }}>Log in</Link> to seed this project
                  </p>
                )}

                <p style={{ fontSize: '0.72rem', textAlign: 'center', opacity: 0.4, marginTop: '1.25rem', lineHeight: 1.5 }}>
                  Seeding signals your belief in this project. Investors use seed counts to identify community-backed opportunities.
                </p>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </>
  )
}

