/**
 * pages/orchard.js — My Orchard: personal seed activity page.
 *
 * Shows the user's seed usage stats and all offerings they've seeded.
 */
import Head from 'next/head'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { apiFetch, getToken } from '../lib/api'
import styles from '../styles/Orchard.module.css'

function SeedIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
      <path d="M12 22V12" />
      <path d="M12 12C12 7 7 3 2 4c0 5 3.5 9 10 8z" />
      <path d="M12 12c0-5 5-9 10-8-1 5-4.5 9-10 8z" />
    </svg>
  )
}

const unwrap = json => {
  const r = json?.data ?? json
  return Array.isArray(r) ? r : Array.isArray(r?.results) ? r.results : []
}

export default function OrchardPage() {
  const [seededOfferings, setSeededOfferings] = useState([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)
  const [unseeding, setUnseeding] = useState(null)

  useEffect(() => {
    const t = getToken()
    setToken(t)
    if (!t) { setLoading(false); return }
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await apiFetch('/profiles/offerings/my-seeds/')
      if (res.ok) setSeededOfferings(unwrap(await res.json()))
    } catch (e) {}
    setLoading(false)
  }

  async function handleUnseed(offeringId) {
    setUnseeding(offeringId)
    try {
      const res = await apiFetch(`/profiles/offerings/${offeringId}/unseed/`, { method: 'POST' })
      if (res.ok) setSeededOfferings(prev => prev.filter(o => o.id !== offeringId))
    } catch (e) {}
    setUnseeding(null)
  }

  return (
    <>
      <Head>
        <title>My Orchard — By The Fruit</title>
      </Head>

      {/* Hero */}
      <div style={{ padding: '2rem 1.5rem', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5 }}>Your Seed Activity</p>
        <h1 style={{ margin: '0 0 0.75rem', fontSize: '2.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <SeedIcon size={36} />
          My Orchard
        </h1>
        <p style={{ margin: 0, fontSize: '1rem', opacity: 0.65, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          Offerings you&apos;ve seeded. Your seeds signal belief to investors.
        </p>
      </div>

      <div className={styles.container}>
        {!token ? (
          <div className={styles.upgradeBanner} style={{ marginTop: '1.75rem' }}>
            <p className={styles.upgradeTitle}>Join to plant your seeds</p>
            <p className={styles.upgradeSub}>
              Seed offerings you believe in. Investors use seed counts to identify community-backed opportunities.
            </p>
            <Link href="/login" style={{
              display: 'inline-block',
              padding: '0.65rem 1.5rem',
              background: 'var(--orange)',
              color: '#fff',
              borderRadius: '100px',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '0.9rem',
            }}>
              Log in →
            </Link>
          </div>
        ) : (
          <>
            {/* Seed usage stats */}
            <motion.div
              style={{ 
                marginTop: '1.75rem', 
                marginBottom: '1.5rem',
                padding: '1.5rem',
                background: 'var(--cardBg)',
                border: '1px solid var(--border)',
                borderRadius: '12px'
              }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5, marginBottom: 6 }}>Seeds Planted</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <SeedIcon size={24} />
                    <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{seededOfferings.length}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                    Monthly seed limits coming with subscriptions
                  </span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800 }}>{seededOfferings.length}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Offerings seeded</div>
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800 }}>
                    {new Set(seededOfferings.map(o => o.business_name).filter(Boolean)).size}
                  </div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Companies supported</div>
                </div>
              </div>
            </motion.div>

            {/* Seeded offerings */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}><SeedIcon size={18} /> Offerings You&apos;ve Seeded</h2>
              {loading ? (
                <div className={styles.loading}>Loading…</div>
              ) : seededOfferings.length === 0 ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}><SeedIcon size={32} /></div>
                  <p className={styles.emptyText}>
                    You haven&apos;t seeded any offerings yet.{' '}
                    <Link href="/offerings" style={{ color: '#4caf50' }}>Explore offerings →</Link>
                  </p>
                </div>
              ) : (
                <div className={styles.grid}>
                  {seededOfferings.map(o => (
                    <div key={o.id} className={styles.projectCard}>
                      {o.business_logo && (
                        <img src={o.business_logo} alt={o.business_name} style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', marginBottom: 8 }} />
                      )}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                        {o.business_category && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--orange)' }}>
                            {o.business_category}
                          </span>
                        )}
                        {o.round_type_display && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '1px 8px', borderRadius: 20, background: 'rgba(245,166,35,0.1)', color: '#c87000', border: '1px solid rgba(245,166,35,0.25)' }}>
                            {o.round_type_display}
                          </span>
                        )}
                      </div>
                      <h3 style={{ margin: '0 0 2px', fontSize: '1rem', fontWeight: 800 }}>{o.title}</h3>
                      <p style={{ margin: '0 0 10px', fontSize: '0.82rem', opacity: 0.6 }}>{o.business_name}</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, fontSize: '0.78rem', opacity: 0.7 }}>
                        {o.target_raise && <span>🎯 ${Number(o.target_raise).toLocaleString()}</span>}
                        {o.seed_count != null && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><SeedIcon size={14} /> {o.seed_count} seeds</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link href={`/offerings/${o.id}`} style={{ flex: 1, textAlign: 'center', padding: '6px 0', background: 'var(--orange)', color: '#fff', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none' }}>
                          View →
                        </Link>
                        <button
                          onClick={() => handleUnseed(o.id)}
                          disabled={unseeding === o.id}
                          title="Remove seed"
                          style={{ padding: '6px 12px', background: 'none', border: '1px solid rgba(200,0,0,0.2)', color: '#c0392b', borderRadius: 8, fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600, opacity: unseeding === o.id ? 0.5 : 1 }}
                        >
                          {unseeding === o.id ? '…' : 'Unseed'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '2rem' }}>
              <Link href="/offerings" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.75rem 1.75rem',
                background: 'var(--orange)',
                color: '#fff', borderRadius: '100px',
                fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none',
              }}>
                <SeedIcon size={16} /> Discover more offerings
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  )
}
