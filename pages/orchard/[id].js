/**
 * pages/orchard/[id].js — Individual project detail page.
 *
 * Shows full project info, progress bar, founder info, supporter count.
 * Paid members can allocate seeds from this page.
 */
import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch, getToken, isApproved, isAdmin } from '../../lib/api'
import SeedAllocateModal from '../../components/SeedAllocateModal'
import { SeedSymbol, SeedCount } from '../../components/SeedSymbol'
import styles from '../../styles/Orchard.module.css'

const STAGE_LABELS = { concept: 'Concept', pilot: 'Pilot', development: 'Development', launched: 'Launched' }

export default function ProjectDetailPage() {
  const router = useRouter()
  const { id } = router.query

  const [project, setProject] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const token = getToken()
  const approved = isApproved()
  const hasAccess = isAdmin() || (!!subscription)

  useEffect(() => {
    if (!id) return
    load()
  }, [id])

  async function load() {
    setLoading(true)
    try {
      const reqs = [apiFetch(`/seeds/projects/${id}/`)]
      if (token) {
        reqs.push(apiFetch('/seeds/wallet/me/'))
        reqs.push(apiFetch('/seeds/subscription/me/'))
      }
      const [projRes, walletRes, subRes] = await Promise.all(reqs)
      if (projRes.ok) setProject(await projRes.json())
      if (walletRes?.ok) setWallet(await walletRes.json())
      if (subRes?.ok) setSubscription(await subRes.json())
    } catch (e) {}
    setLoading(false)
  }

  function handleAllocateSuccess({ amount, new_balance }) {
    setWallet(prev => prev ? { ...prev, balance: new_balance } : prev)
    setProject(prev => prev ? {
      ...prev,
      user_allocation: amount,
      total_seeds: (prev.total_seeds || 0) + amount - (prev.user_allocation || 0),
    } : prev)
    setShowModal(false)
  }

  if (loading) return <div className={styles.loading}>Loading project…</div>
  if (!project) return <div className={styles.loading}>Project not found.</div>

  const pct = project.progress_percent || 0
  const isAllocated = (project.user_allocation || 0) > 0
  const isUnlocked = project.milestone_unlocked
  const founderName = project.founder_detail?.full_name || project.founder_detail?.email || ''
  const founderPhoto = project.founder_detail?.photo || null
  const founderInitials = founderName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      <Head>
        <title>{project.title} — The Orchard · By The Fruit</title>
        <meta name="description" content={project.tagline || project.description?.slice(0, 160)} />
      </Head>

      {/* Cover image */}
      {project.cover_image ? (
        <img src={project.cover_image} alt={project.title} className={styles.detailHero} />
      ) : (
        <div className={styles.detailHeroPlaceholder}>🌱</div>
      )}

      <div className={styles.detailContent}>
        <Link href="/orchard" className={styles.backLink}>
          ← Back to The Orchard
        </Link>

        {/* Unlock banner */}
        {isUnlocked && (
          <motion.div
            className={styles.unlockedBanner}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className={styles.unlockedIcon}>🎉</span>
            <div>
              <div className={styles.unlockedText}>Milestone Unlocked!</div>
              <div className={styles.unlockedSub}>
                This project reached its seed threshold. Thank you to all who participated.
              </div>
            </div>
          </motion.div>
        )}

        {/* Stage + featured badges */}
        <div className={styles.cardStageRow} style={{ marginBottom: '0.75rem' }}>
          <span className={styles.stagePill}>{STAGE_LABELS[project.stage] || project.stage}</span>
          {project.is_featured && <span className={styles.featuredBadge}>Featured</span>}
        </div>

        <h1 className={styles.detailTitle}>{project.title}</h1>
        {project.tagline && <p className={styles.detailTagline}>{project.tagline}</p>}

        {/* Founder row */}
        {founderName && (
          <div className={styles.founderRow} style={{ marginBottom: '1.5rem' }}>
            {founderPhoto ? (
              <img src={founderPhoto} alt={founderName} className={styles.founderAvatar} style={{ width: 36, height: 36 }} />
            ) : (
              <div className={styles.founderAvatarFallback} style={{ width: 36, height: 36, fontSize: '0.8rem' }}>{founderInitials}</div>
            )}
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#2d4a2d' }}>{founderName}</div>
              <div style={{ fontSize: '0.75rem', color: '#8aaa8a' }}>Founder</div>
            </div>
          </div>
        )}

        {/* Progress card */}
        <div style={{
          background: '#f0f7f0',
          borderRadius: 16,
          padding: '1.25rem 1.5rem',
          marginBottom: '1.75rem',
          border: '1.5px solid #d4e8d4',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#8aaa8a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Seeds</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#2d6a2d', display: 'flex', alignItems: 'center', gap: 6 }}>
                <SeedSymbol size={24} />
                {(project.total_seeds || 0).toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: '#8aaa8a' }}>Target</div>
              <div style={{ fontWeight: 700, color: '#5a7a5a', display: 'flex', alignItems: 'center', gap: 4 }}>
                <SeedSymbol size={14} />
                {(project.seed_threshold || 0).toLocaleString()}
              </div>
            </div>
          </div>
          <div className={styles.progressBar} style={{ height: 12 }}>
            <motion.div
              className={`${styles.progressFill} ${pct >= 100 ? styles.progressFillComplete : ''}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(pct, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#4caf50', fontWeight: 700 }}>{pct}% of goal</span>
            <span style={{ fontSize: '0.78rem', color: '#8aaa8a' }}>
              {(project.supporter_count || 0).toLocaleString()} supporters
            </span>
          </div>

          {project.deadline && (
            <div style={{ marginTop: '0.85rem', fontSize: '0.8rem', color: '#e65100', fontWeight: 600 }}>
              ⏰ Closes {new Date(project.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          )}

          {/* Your allocation */}
          {token && hasAccess && isAllocated && (
            <div style={{
              marginTop: '0.85rem', background: '#e8f5e9',
              borderRadius: 8, padding: '0.6rem 0.9rem',
              fontSize: '0.82rem', color: '#2d6a2d', fontWeight: 600,
            }}>
              <SeedSymbol size={12} /> You've allocated {(project.user_allocation || 0).toLocaleString()} seeds to this project this month.
            </div>
          )}
        </div>

        {/* Description */}
        {project.description && (
          <p className={styles.detailDescription}>{project.description}</p>
        )}

        {/* Compliance block */}
        <div className={styles.complianceNote} style={{ marginTop: '1.5rem' }}>
          <strong>Compliance disclosure:</strong> Seeds allocated to this project carry no monetary value,
          do not represent equity or ownership interests, are not investments, and cannot be converted
          to any financial instrument. Allocating Seeds is a cultural participation signal only.
          Any future capital formation opportunities will exist in a completely separate product flow.
        </div>
      </div>

      {/* Sticky bottom action bar */}
      {token && (
        <div className={styles.detailActions}>
          <div>
          {hasAccess && wallet && (
              <>
                <span style={{ fontSize: '0.78rem', color: '#8aaa8a' }}>Balance: </span>
                <strong style={{ color: '#2d6a2d' }}>
                  <SeedCount amount={wallet.balance} size={13} />
                </strong>
              </>
            )}
          </div>
          {hasAccess ? (
            <button className={isAllocated ? styles.allocatedBtn : styles.allocateBtn} onClick={() => setShowModal(true)}>
              <SeedSymbol size={14} />
              {isAllocated ? `${(project.user_allocation || 0).toLocaleString()} seeded — reallocate` : 'Allocate Seeds'}
            </button>
          ) : (
            <span style={{ fontSize: '0.82rem', color: '#8aaa8a' }}>
              <Link href="/my-orchard" style={{ color: '#4caf50', fontWeight: 700 }}>Browse your Orchard</Link> to allocate
            </span>
          )}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <SeedAllocateModal
            project={project}
            wallet={wallet}
            onClose={() => setShowModal(false)}
            onSuccess={handleAllocateSuccess}
          />
        )}
      </AnimatePresence>
    </>
  )
}
