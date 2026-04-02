/**
 * SeedProjectCard.js — reusable card for The Orchard project listing.
 */
import Link from 'next/link'
import styles from '../styles/Orchard.module.css'
import { SeedSymbol, SeedCount } from './SeedSymbol'

const STAGE_LABELS = {
  concept: 'Concept',
  pilot: 'Pilot',
  development: 'Development',
  launched: 'Launched',
}

const STAGE_CLASS = {
  concept: '',
  pilot: styles.stagePilot,
  development: styles.stageDev,
  launched: styles.stageLaunched,
}

export default function SeedProjectCard({ project, onAllocate, userAllocation = 0, hasAccess = false }) {
  const pct = project.progress_percent || 0
  const isAllocated = userAllocation > 0
  const isUnlocked = project.milestone_unlocked

  function handleAllocate(e) {
    e.preventDefault()
    e.stopPropagation()
    if (onAllocate) onAllocate(project)
  }

  const founderName = project.founder_detail?.full_name || project.founder_detail?.email || ''
  const founderPhoto = project.founder_detail?.photo || null
  const founderInitials = founderName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Link href={`/orchard/${project.id}`} className={styles.card} style={{ textDecoration: 'none' }}>
      {/* Cover image */}
      {project.cover_image ? (
        <img src={project.cover_image} alt={project.title} className={styles.cardImage} />
      ) : (
        <div className={styles.cardImagePlaceholder}>🌱</div>
      )}

      <div className={styles.cardBody}>
        {/* Stage + featured */}
        <div className={styles.cardStageRow}>
          <span className={`${styles.stagePill} ${STAGE_CLASS[project.stage] || ''}`}>
            {STAGE_LABELS[project.stage] || project.stage}
          </span>
          {project.is_featured && <span className={styles.featuredBadge}>Featured</span>}
          {isUnlocked && <span className={styles.featuredBadge} style={{ background: 'linear-gradient(90deg,#4caf50,#2e7d32)' }}>✓ Unlocked</span>}
        </div>

        <h3 className={styles.cardTitle}>{project.title}</h3>
        {project.tagline && <p className={styles.cardTagline}>{project.tagline}</p>}

        {/* Progress */}
        <div className={styles.progressWrap}>
          <div className={styles.progressTop}>
            <span className={styles.progressSeeds}>
              <SeedCount amount={project.total_seeds} size={12} />
            </span>
            <span className={styles.progressTarget}>
              of <SeedCount amount={project.seed_threshold} size={11} />
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={`${styles.progressFill} ${pct >= 100 ? styles.progressFillComplete : ''}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <div className={styles.progressPct}>{pct}%</div>
        </div>

        {/* Footer */}
        <div className={styles.cardFooter}>
          <div className={styles.founderRow}>
            {founderPhoto ? (
              <img src={founderPhoto} alt={founderName} className={styles.founderAvatar} />
            ) : founderName ? (
              <div className={styles.founderAvatarFallback}>{founderInitials}</div>
            ) : null}
            {founderName && <span className={styles.founderName}>{founderName}</span>}
            {!founderName && (
              <span className={styles.supporterCount}>{(project.supporter_count || 0).toLocaleString()} supporters</span>
            )}
          </div>

          {hasAccess ? (
            isAllocated ? (
              <button
                className={styles.allocatedBtn}
                onClick={handleAllocate}
                title={`You've allocated ${userAllocation.toLocaleString()} seeds. Click to reallocate.`}
              >
                <SeedSymbol size={12} />
                {userAllocation.toLocaleString()} seeded
              </button>
            ) : (
              <button className={styles.allocateBtn} onClick={handleAllocate}>
                <SeedSymbol size={12} />
                Allocate
              </button>
            )
          ) : null}
        </div>
      </div>
    </Link>
  )
}
