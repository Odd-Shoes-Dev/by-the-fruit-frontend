import { useRouter } from 'next/router'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FiMapPin, FiPhone, FiGlobe, FiMail, FiLock, FiFeather, FiTrendingUp } from 'react-icons/fi'
import { apiFetch, getToken, getUserId } from '../../lib/api'
import ConnectionButtons from '../../components/ConnectionButtons'
import FluffyButton from '../../components/FluffyButton'
import styles from '../../styles/ProfilePage.module.css'

function Avatar({ src, name, size = 96 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (src) return <img src={src} alt={name} className={styles.avatar} style={{ width: size, height: size }} />
  return (
    <div className={styles.avatarFallback} style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  )
}

function SocialLink({ href, icon, label }) {
  if (!href) return null
  return (
    <a href={href} target="_blank" rel="noreferrer" className={styles.socialLink} title={label}>
      {icon}
    </a>
  )
}

function InfoRow({ icon: Icon, text }) {
  if (!text) return null
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoIcon}><Icon size={14} /></span>
      <span>{text}</span>
    </div>
  )
}

function RoleBadge({ type }) {
  return (
    <span className={styles.roleBadge} data-type={type}>
      {type === 'founder'
        ? <><FiFeather size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />Founder</>
        : <><FiTrendingUp size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />Investor</>}
    </span>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { id } = router.query
  const [profile, setProfile] = useState(null)
  const [type, setType] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewerId, setViewerId] = useState(null)

  useEffect(() => {
    setViewerId(getUserId())
    if (!id || !getToken()) {
      if (!getToken()) setError('Log in to view profiles.')
      setLoading(false)
      return
    }
    let mounted = true
    apiFetch(`/user/${id}`)
      .then(res => {
        if (!mounted) return
        if (res.ok) return res.json()
        if (res.status === 403 || res.status === 404) setError('Profile not found or access denied.')
        return null
      })
      .then(json => {
        if (!mounted || !json) { setLoading(false); return }
        const data = json?.data ?? json
        if (!data) { setLoading(false); return }
        const hasBusiness = data.businesses?.length > 0
        const hasInvestor = data.investment_profiles?.length > 0
        setProfile(data)
        setType(hasBusiness ? 'founder' : hasInvestor ? 'investor' : null)
        setLoading(false)
      })
      .catch(() => {
        if (mounted) { setError('Failed to load profile.'); setLoading(false) }
      })
    return () => { mounted = false }
  }, [id])

  if (loading) {
    return (
      <div className="container">
        <div className={styles.skeleton}>
          <div className={styles.skeletonAvatar} />
          <div className={styles.skeletonLines}>
            <div className={styles.skeletonLine} style={{ width: '40%' }} />
            <div className={styles.skeletonLine} style={{ width: '60%' }} />
            <div className={styles.skeletonLine} style={{ width: '80%' }} />
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="container">
        <div className={styles.errorState}>
          <span className={styles.errorIcon}><FiLock size={32} /></span>
          <p>{error || 'Profile not found.'}</p>
          <Link href="/community" className={styles.backLink}>Back to feed</Link>
        </div>
      </div>
    )
  }

  const isOwnProfile = String(viewerId) === String(id)
  const business = profile.businesses?.[0]
  const investorProfile = profile.investment_profiles?.[0]
  const name = profile.full_name || 'Member'

  // Social links from investor profile
  const socials = investorProfile || {}

  return (
    <motion.div
      className="container"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.profileGrid}>

        {/* ── Left column: identity card ── */}
        <aside className={styles.sidebar}>
          <div className={styles.identityCard}>
            {/* Cover strip */}
            <div className={styles.coverStrip} />

            <div className={styles.identityBody}>
              <div className={styles.avatarWrap}>
                <Avatar src={profile.photo} name={name} size={88} />
                {type && <RoleBadge type={type} />}
                {!type && profile.is_staff && (
                  <span className={styles.roleBadge} data-type="admin">⚙ Admin</span>
                )}
              </div>

              <h1 className={styles.profileName}>{name}</h1>
              {profile.email && <p className={styles.profileEmail}>{profile.email}</p>}

              {/* Bio */}
              {profile.bio && (
                <p className={styles.profileBio}>{profile.bio}</p>
              )}

              {/* Info rows */}
              <div className={styles.infoList}>
                <InfoRow icon={FiMapPin} text={profile.location} />
                <InfoRow icon={FiPhone} text={profile.phone} />
                {business?.website && (
                  <InfoRow icon={FiGlobe} text={
                    <a href={business.website} target="_blank" rel="noreferrer" className={styles.inlineLink}>
                      {business.website.replace(/^https?:\/\//, '')}
                    </a>
                  } />
                )}
              </div>

              {/* Social links */}
              {(socials.linkedin || socials.twitter || socials.instagram || socials.facebook) && (
                <div className={styles.socialRow}>
                  <SocialLink href={socials.linkedin} label="LinkedIn" icon={
                    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  } />
                  <SocialLink href={socials.twitter} label="Twitter / X" icon={
                    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  } />
                  <SocialLink href={socials.instagram} label="Instagram" icon={
                    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                  } />
                  <SocialLink href={socials.facebook} label="Facebook" icon={
                    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  } />
                </div>
              )}

              {/* Actions */}
              <div className={styles.actionRow}>
                {isOwnProfile ? (
                  <FluffyButton href="/profile/settings" label="Edit profile" width={150} height={40} strands={800} strandLen={6} fontSize={14} color="#F5A623" color2="#F57C00" />
                ) : (
                  <ConnectionButtons targetUserId={Number(id)} viewerRole="investor" />
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* ── Right column: details ── */}
        <main className={styles.mainCol}>

          {/* Founder: Business card */}
          {type === 'founder' && business && (
            <motion.section
              className={styles.detailCard}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <p className={styles.sectionEyebrow}><FiFeather size={12} style={{ marginRight: 5, verticalAlign: 'middle' }} />Founder Profile</p>
              <div className={styles.detailCardHeader}>
                {business.logo ? (
                  <img src={business.logo} alt={business.name} className={styles.businessLogo} />
                ) : (
                  <div className={styles.businessLogoFallback}>
                    {(business.name || 'B')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className={styles.detailCardTitle}>{business.name}</h2>
                  <div className={styles.detailCardMeta}>
                    {business.category && <span className={styles.categoryPill}>{business.category}</span>}
                    {business.is_verified && <span className={styles.verifiedBadge}>✓ Verified</span>}
                  </div>
                </div>
              </div>

              {business.description && <p className={styles.detailText}>{business.description}</p>}

              <div className={styles.detailGrid}>
                {business.city && <InfoRow icon={FiMapPin} text={`${business.city}${business.country ? ', ' + business.country : ''}`} />}
                {business.phone && <InfoRow icon={FiPhone} text={business.phone} />}
                {business.email && <InfoRow icon={FiMail} text={business.email} />}
                {business.website && (
                  <InfoRow icon={FiGlobe} text={
                    <a href={business.website} target="_blank" rel="noreferrer" className={styles.inlineLink}>
                      {business.website.replace(/^https?:\/\//, '')}
                    </a>
                  } />
                )}
              </div>

              {/* Milestones */}
              {business.milestones?.length > 0 && (
                <div className={styles.milestones}>
                  <h3 className={styles.subHeading}>Milestones</h3>
                  <ul className={styles.milestoneList}>
                    {business.milestones.map(m => (
                      <li key={m.id} className={styles.milestoneItem}>
                        <span className={styles.milestoneDot} />
                        <div>
                          <strong>{m.title}</strong>
                          {m.description && <p className={styles.milestoneDesc}>{m.description}</p>}
                          {m.achieved_at && <small className={styles.milestoneDate}>{new Date(m.achieved_at).toLocaleDateString()}</small>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.section>
          )}

          {/* Investor: Investment profile card */}
          {type === 'investor' && investorProfile && (
            <motion.section
              className={styles.detailCard}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <p className={styles.sectionEyebrow}><FiTrendingUp size={12} style={{ marginRight: 5, verticalAlign: 'middle' }} />Investor Profile</p>
              <h2 className={styles.detailCardTitle}>Investment profile</h2>

              {investorProfile.bio && <p className={styles.detailText}>{investorProfile.bio}</p>}
              {investorProfile.philosophy && (
                <blockquote className={styles.philosophy}>&ldquo;{investorProfile.philosophy}&rdquo;</blockquote>
              )}

              <div className={styles.investorStats}>
                {investorProfile.check_size_range && (
                  <div className={styles.statBox}>
                    <span className={styles.statLabel}>Check size</span>
                    <span className={styles.statValue}>${investorProfile.check_size_range}</span>
                  </div>
                )}
                {investorProfile.investment_type && (
                  <div className={styles.statBox}>
                    <span className={styles.statLabel}>Focus</span>
                    <span className={styles.statValue}>{investorProfile.investment_type}</span>
                  </div>
                )}
                {investorProfile.is_micro_investor && (
                  <div className={styles.statBox}>
                    <span className={styles.statLabel}>Type</span>
                    <span className={styles.statValue}>Micro-investor</span>
                  </div>
                )}
                {investorProfile.is_creator_influencer && (
                  <div className={styles.statBox}>
                    <span className={styles.statLabel}>Creator</span>
                    <span className={styles.statValue}>{investorProfile.audience_reach || 'Yes'}</span>
                  </div>
                )}
              </div>

              <div className={styles.detailGrid}>
                {investorProfile.location && <InfoRow icon={FiMapPin} text={investorProfile.location} />}
                {investorProfile.phone && <InfoRow icon={FiPhone} text={investorProfile.phone} />}
              </div>
            </motion.section>
          )}

          {/* No role yet — only show to non-admin users */}
          {!type && isOwnProfile && !profile.is_staff && (
            <motion.section
              className={styles.detailCard}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <p className={styles.detailText} style={{ color: 'var(--muted)' }}>
                You haven&apos;t set up your founder or investor profile yet.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <FluffyButton href="/onboarding/founder" label="Set up as Founder" width={165} height={40} strands={850} strandLen={6} fontSize={13} color="#F5A623" color2="#F57C00" />
                <FluffyButton href="/onboarding/investor" label="Set up as Investor" width={165} height={40} strands={850} strandLen={6} fontSize={13} color="#1A4A2E" />
              </div>
            </motion.section>
          )}

          {/* Admin overview card */}
          {profile.is_staff && (
            <motion.section
              className={styles.detailCard}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <p className={styles.sectionEyebrow} style={{ color: 'var(--orange)' }}>
                ⚙ Platform Administrator
              </p>
              <p className={styles.detailText} style={{ color: 'var(--muted)', marginTop: 8 }}>
                This account oversees the platform — reviewing deals, moderating the community, and supporting founders and investors.
              </p>
            </motion.section>
          )}

          {/* Family members */}
          {profile.family_members?.length > 0 && (
            <motion.section
              className={styles.detailCard}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className={styles.detailCardTitle}>Family</h2>
              <ul className={styles.familyList}>
                {profile.family_members.map((f, i) => (
                  <li key={f.id || i} className={styles.familyItem}>
                    <div className={styles.familyAvatar}>
                      {(f.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <strong>{f.name}</strong>
                      {f.relationship && <span className={styles.familyRel}>{f.relationship}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </motion.section>
          )}

        </main>
      </div>
    </motion.div>
  )
}
