/**
 * pages/orchard.js — The Orchard: project listing page.
 *
 * Public page. Shows all active seed projects.
 * Paid subscribers can allocate seeds.
 */
import Head from 'next/head'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { apiFetch, getToken, isApproved, isAdmin, getStoredUser } from '../lib/api'
import SeedProjectCard from '../components/SeedProjectCard'
import SeedAllocateModal from '../components/SeedAllocateModal'
import { SeedSymbol, SeedCount } from '../components/SeedSymbol'
import styles from '../styles/Orchard.module.css'

const unwrap = json => {
  const r = json?.data ?? json
  return Array.isArray(r) ? r : Array.isArray(r?.results) ? r.results : []
}

export default function OrchardPage() {
  const [projects, setProjects] = useState([])
  const [featured, setFeatured] = useState([])
  const [wallet, setWallet] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [allocateTarget, setAllocateTarget] = useState(null)
  const [token, setToken] = useState(null)
  const [approved, setApproved] = useState(false)
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    const t = getToken()
    setToken(t)
    setApproved(isApproved())
    load(!!t)
  }, [])

  async function load(authed) {
    setLoading(true)
    try {
      const reqs = [
        apiFetch('/seeds/projects/'),
        apiFetch('/seeds/projects/featured/'),
      ]
      if (authed) {
        reqs.push(apiFetch('/seeds/wallet/me/'))
        reqs.push(apiFetch('/seeds/subscription/me/'))
      }
      const [projRes, featRes, walletRes, subRes] = await Promise.all(reqs)
      if (projRes.ok) setProjects(unwrap(await projRes.json()))
      if (featRes.ok) setFeatured(unwrap(await featRes.json()))
      if (walletRes?.ok) setWallet(await walletRes.json())
      if (subRes?.ok) setSubscription(await subRes.json())
    } catch (e) {}
    setLoading(false)
  }

  const hasAccess = isAdmin() || (!!token && !!subscription)
  const balance = wallet?.balance ?? 0
  const storedUser = getStoredUser()
  const isFounder = isAdmin()
    || storedUser?.intended_role === 'founder'
    || (Array.isArray(storedUser?.businesses) && storedUser.businesses.length > 0)

  function handleAllocate(project) {
    if (!token) {
      window.location.href = '/login'
      return
    }
    setAllocateTarget(project)
  }

  function handleAllocateSuccess({ amount, new_balance }) {
    setWallet(prev => prev ? { ...prev, balance: new_balance } : prev)
    setProjects(prev => prev.map(p =>
      p.id === allocateTarget.id
        ? { ...p, user_allocation: amount, total_seeds: (p.total_seeds || 0) + amount - (p.user_allocation || 0) }
        : p
    ))
    setFeatured(prev => prev.map(p =>
      p.id === allocateTarget.id
        ? { ...p, user_allocation: amount, total_seeds: (p.total_seeds || 0) + amount - (p.user_allocation || 0) }
        : p
    ))
    setAllocateTarget(null)
  }

  function daysUntilReset() {
    if (!wallet?.next_reset) return null
    const diff = new Date(wallet.next_reset) - new Date()
    const days = Math.ceil(diff / 86400000)
    return days > 0 ? days : 0
  }

  const filtered = projects.filter(p =>
    !search ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.tagline || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Head>
        <title>The Orchard — By The Fruit</title>
        <meta name="description" content="Allocate your monthly Seeds to projects you believe in. A cultural conviction engine — not investments." />
      </Head>

      {/* Hero */}
      <div className={styles.hero}>
        <p className={styles.heroEyebrow}>Seed Allocation Membership</p>
        <h1 className={styles.heroTitle}>
          <span className={styles.heroSeedIcon}><SeedSymbol size={36} /></span>
          The Orchard
        </h1>
        <p className={styles.heroSubtitle}>
          Allocate your monthly Seeds to projects you believe in.
          Signal cultural conviction — not financial investment.
        </p>
        <span className={styles.compliancePill} style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
          Seeds carry no monetary value · Not equity · Not investment
        </span>
        {token && isFounder && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 2rem',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.12))',
              border: '1.5px solid rgba(255,255,255,0.45)',
              borderRadius: '12px',
              color: '#fff',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              letterSpacing: '0.02em',
              transition: 'all 0.2s',
              backdropFilter: 'blur(4px)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.2))'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.12))'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            🌱 Submit Your Project
          </button>
        )}
      </div>

      <div className={styles.container}>
        {/* Wallet strip — all logged-in members */}
        {token && subscription && wallet && (
          <motion.div
            className={styles.walletCard}
            style={{ marginTop: '1.75rem', marginBottom: '-0.5rem' }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.walletRow}>
              <div>
                <div className={styles.walletLabel}>Your Seed Balance</div>
                <div className={styles.walletBalance}>
                  <SeedSymbol size={36} />
                  {balance.toLocaleString()}
                </div>
                <span className={styles.walletUnit}>seeds remaining</span>
                <span className={styles.walletTier}>{subscription?.tier} member</span>
              </div>
              <div className={styles.walletRight}>
                {daysUntilReset() !== null && (
                  <>
                    <div className={styles.walletCycleLabel}>Resets in</div>
                    <div className={styles.walletCountdown}>{daysUntilReset()}d</div>
                    <div className={styles.walletCountdownSub}>Don&apos;t let them expire</div>
                  </>
                )}
              </div>
            </div>
            <div className={styles.walletStats}>
              <div className={styles.walletStat}>
                <div className={styles.walletStatNum}>{(wallet.seeds_this_cycle || 0).toLocaleString()}</div>
                <div className={styles.walletStatLabel}>Issued this month</div>
              </div>
              <div className={styles.walletStat}>
                <div className={styles.walletStatNum}>{(wallet.seeds_allocated_this_cycle || 0).toLocaleString()}</div>
                <div className={styles.walletStatLabel}>Already allocated</div>
              </div>
              <div className={styles.walletStat}>
                <div className={styles.walletStatLabel} style={{ fontSize: '0.8rem', color: '#c8e6c8' }}>
                  <Link href="/my-orchard" style={{ color: '#81c784' }}>View dashboard →</Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Level-up nudge for community tier */}
        {token && subscription && subscription.tier === 'community' && (
          <div className={styles.upgradeBanner} style={{ marginTop: '1.25rem' }}>
            <p className={styles.upgradeTitle}>Want more seeds?</p>
            <p className={styles.upgradeSub}>
              You have 250 seeds this month as a Community member. Patron, Advocate, and Champion members get more.
            </p>
            <div className={styles.tierRow}>
              {[
                { name: 'Patron', seeds: '1,000' },
                { name: 'Advocate', seeds: '2,500' },
                { name: 'Champion', seeds: '5,000' },
              ].map(t => (
                <div key={t.name} className={styles.tierCard}>
                  <span className={styles.tierName}>{t.name}</span>
                  <span className={styles.tierSeeds}><SeedSymbol size={11} /> {t.seeds}</span>
                  <span className={styles.tierSeedsUnit}>/mo</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Not logged in teaser */}
        {!token && (
          <div className={styles.upgradeBanner} style={{ marginTop: '1.75rem' }}>
            <p className={styles.upgradeTitle}>Join to plant your seeds</p>
            <p className={styles.upgradeSub}>
              Members receive Seeds each month to allocate to the projects they believe in most.
            </p>
            <Link href="/signup" style={{
              display: 'inline-block',
              padding: '0.65rem 1.5rem',
              background: 'linear-gradient(135deg,#2d6a2d,#4caf50)',
              color: '#fff',
              borderRadius: '100px',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '0.9rem',
            }}>
              Join the waitlist →
            </Link>
          </div>
        )}

        {/* Featured */}
        {featured.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}><SeedSymbol size={18} /> Featured Projects</h2>
            <div className={styles.grid}>
              {featured.map(p => (
                <SeedProjectCard
                  key={p.id}
                  project={p}
                  onAllocate={handleAllocate}
                  userAllocation={p.user_allocation || 0}
                  hasAccess={!!token && hasAccess}
                />
              ))}
            </div>
          </div>
        )}

        {/* All projects */}
        <div className={styles.section}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>All Projects</h2>
            <input
              type="text"
              placeholder="Search projects…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                border: '1.5px solid #d4e8d4',
                borderRadius: '100px',
                fontSize: '0.88rem',
                outline: 'none',
                width: '220px',
              }}
            />
          </div>

          {loading ? (
            <div className={styles.loading}>Loading projects…</div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🌱</div>
              <p className={styles.emptyText}>No projects yet. Check back soon.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map(p => (
                <SeedProjectCard
                  key={p.id}
                  project={p}
                  onAllocate={handleAllocate}
                  userAllocation={p.user_allocation || 0}
                  hasAccess={!!token && hasAccess}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create project modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateProjectModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => { setShowCreateModal(false); load(true) }}
          />
        )}
      </AnimatePresence>

      {/* Allocation modal */}
      <AnimatePresence>
        {allocateTarget && (
          <SeedAllocateModal
            project={allocateTarget}
            wallet={wallet}
            onClose={() => setAllocateTarget(null)}
            onSuccess={handleAllocateSuccess}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ── Create Project Modal ─────────────────────────────────────────────────────

const PROJECT_STAGES = [
  { value: 'concept', label: 'Concept' },
  { value: 'pilot', label: 'Pilot' },
  { value: 'development', label: 'Development' },
  { value: 'launched', label: 'Launched' },
]

function CreateProjectModal({ onClose, onCreated }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const [form, setForm] = useState({
    title: '',
    tagline: '',
    description: '',
    stage: 'concept',
    seed_threshold: 10000,
    deadline: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function set(key, val) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('Title is required.'); return }
    setLoading(true)
    try {
      const body = {
        title: form.title.trim(),
        tagline: form.tagline.trim(),
        description: form.description.trim(),
        stage: form.stage,
        seed_threshold: parseInt(form.seed_threshold, 10) || 10000,
        ...(form.deadline && { deadline: new Date(form.deadline).toISOString() }),
      }
      const res = await apiFetch('/seeds/projects/', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setDone(true)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data?.detail || data?.title?.[0] || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setLoading(false)
  }

  return (
    <motion.div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', maxHeight: 'calc(100vh - 2rem)', display: 'flex', flexDirection: 'column' }}
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
      >
        {/* Modal header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--cream)' }}>Submit Your Project</h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--muted)' }}>Your project will be reviewed before going live on The Orchard.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--muted)', padding: '0.25rem' }}>✕</button>
        </div>

        {done ? (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', overflowY: 'auto', flex: 1 }}>
            <p style={{ fontSize: '2.5rem', margin: '0 0 1rem' }}>🌱</p>
            <h3 style={{ color: 'var(--cream)', margin: '0 0 0.5rem' }}>Submitted!</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
              Your project is under review. We&apos;ll reach out once it&apos;s live on The Orchard.
            </p>
            <button className="btn" onClick={onCreated}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1 }}>
            <label>
              Project title *
              <input
                type="text"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="e.g. Harvest Connect"
                maxLength={255}
                required
              />
            </label>
            <label>
              Tagline
              <input
                type="text"
                value={form.tagline}
                onChange={e => set('tagline', e.target.value)}
                placeholder="One sentence about what you do"
                maxLength={500}
              />
            </label>
            <label>
              Description
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Tell the community about your project…"
                rows={4}
                style={{ resize: 'vertical' }}
              />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <label>
                Stage
                <select value={form.stage} onChange={e => set('stage', e.target.value)}>
                  {PROJECT_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </label>
              <label>
                Seed target
                <input
                  type="number"
                  value={form.seed_threshold}
                  onChange={e => set('seed_threshold', e.target.value)}
                  min={100}
                  max={1000000}
                />
              </label>
            </div>
            <label>
              Deadline <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span>
              <input
                type="date"
                value={form.deadline}
                onChange={e => set('deadline', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </label>
            {error && <p className="error">{error}</p>}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn" disabled={loading} style={{ flex: 1 }}>
                {loading ? 'Submitting…' : 'Submit for review'}
              </button>
              <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}
