import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { getToken, isAdmin, isApproved, clearAuth, getUserId, getStoredUser, apiFetch } from '../lib/api'
import NotificationBell from './NotificationBell'
import FluffyButton from './FluffyButton'
import styles from '../styles/Layout.module.css'

function NavAvatar({ userId, photo, name, admin, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useState(null)
  const router = useRouter()
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (!e.target.closest('[data-nav-avatar]')) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on route change
  useEffect(() => { setOpen(false) }, [router.pathname])

  return (
    <div className={styles.avatarWrap} data-nav-avatar>
      <button className={styles.avatarBtn} onClick={() => setOpen(o => !o)} aria-label="Profile menu">
        {photo ? (
          <img src={photo} alt={name} className={styles.avatarImg} />
        ) : (
          <div className={styles.avatarInitials}>{initials}</div>
        )}
        <svg className={`${styles.avatarChevron} ${open ? styles.avatarChevronOpen : ''}`} viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.avatarDropdown}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {/* User info header */}
            <div className={styles.dropdownHeader}>
              {photo ? (
                <img src={photo} alt={name} className={styles.dropdownAvatar} />
              ) : (
                <div className={styles.dropdownAvatarFallback}>{initials}</div>
              )}
              <div className={styles.dropdownName}>{name || 'My Account'}</div>
            </div>

            <div className={styles.dropdownDivider} />

            {userId && (
              <Link href={`/profile/${userId}`} className={styles.dropdownItem}>
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                My Profile
              </Link>
            )}
            <Link href="/settings" className={styles.dropdownItem}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              Settings
            </Link>
            <Link href="/kyc" className={styles.dropdownItem}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 12l2 2 4-4"/><path d="M20 6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3"/><path d="M14 2H10a2 2 0 0 0-2 2v2h8V4a2 2 0 0 0-2-2z"/></svg>
              KYC Verification
            </Link>
            <Link href="/notifications" className={styles.dropdownItem}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              Notifications
            </Link>
            <Link href="/saved" className={styles.dropdownItem}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              Saved Posts
            </Link>
            {admin && (
              <Link href="/admin" className={styles.dropdownItem}>
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Admin
              </Link>
            )}

            <div className={styles.dropdownDivider} />

            <button className={`${styles.dropdownItem} ${styles.dropdownLogout}`} onClick={onLogout}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Layout({ children }) {
  const [token, setToken] = useState(false)
  const [admin, setAdmin] = useState(false)
  const [approved, setApproved] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userId, setUserId] = useState(null)
  const [userPhoto, setUserPhoto] = useState(null)
  const [userName, setUserName] = useState('')
  const [isCreatorInfluencer, setIsCreatorInfluencer] = useState(false)
  const router = useRouter()

  function syncUserFromStorage() {
    const u = getStoredUser()
    if (u) {
      setUserId(u.id ?? u.user_data?.id ?? null)
      setUserPhoto(u.photo || null)
      setUserName(u.full_name || u.email || '')
    }
  }

  useEffect(() => {
    const t = !!getToken()
    const a = isApproved()
    setToken(t)
    setAdmin(isAdmin())
    setApproved(a)
    setUserId(getUserId())
    syncUserFromStorage()
    // Read cached creator flag immediately, then refresh from API
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('btf_creator')
      if (cached === 'true') setIsCreatorInfluencer(true)
    }
    if (t && a) {
      apiFetch('/profiles/investments/me/')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (!data) return
          const val = !!data.is_creator_influencer
          setIsCreatorInfluencer(val)
          if (typeof window !== 'undefined') {
            localStorage.setItem('btf_creator', val ? 'true' : 'false')
          }
        })
        .catch(() => {})
    }
  }, [])

  useEffect(() => {
    function handleUserUpdate() {
      syncUserFromStorage()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('btf:user-updated', handleUserUpdate)
      window.addEventListener('storage', handleUserUpdate)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('btf:user-updated', handleUserUpdate)
        window.removeEventListener('storage', handleUserUpdate)
      }
    }
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [router.pathname])

  // Lock body scroll while mobile menu is open
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [menuOpen])

  function handleLogout() {
    clearAuth()
    setToken(false)
    setApproved(false)
    setAdmin(false)
    setUserId(null)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('btf:logged-out'))
    }
    router.push('/')
  }

  const isAdminPage = router.pathname === '/admin' || router.pathname.startsWith('/admin/')

  return (
    <div className={styles.layout}>
      <nav className={styles.navbar}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.brand}>
            <Image src="/images/logo.png" alt="By The Fruit" width={36} height={36} className={styles.logo} />
            <span className={styles.brandName}><span style={{ fontSize: '1.2em' }}>B</span>y <span style={{ fontSize: '1.2em' }}>T</span>he <span style={{ fontSize: '1.2em' }}>F</span>ruit</span>
          </Link>

          {/* Notification bell — mobile only, shown next to hamburger */}
          {token && approved && (
            <span className={styles.mobileNavBell}><NotificationBell /></span>
          )}

          <button
            className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>

          {/* Desktop nav links */}
          <div className={styles.navLinks}>
            {token && approved && (
              <>
                <Link href="/community" className={`${styles.navLink} ${router.pathname === '/community' ? styles.active : ''}`}>Feed</Link>
                <Link href="/events" className={`${styles.navLink} ${router.pathname === '/events' ? styles.active : ''}`}>Events</Link>
                <Link href="/offerings" className={`${styles.navLink} ${router.pathname === '/offerings' || router.pathname.startsWith('/offerings/') ? styles.active : ''}`}>Offerings</Link>
                <Link href="/my-offerings" className={`${styles.navLink} ${router.pathname === '/my-offerings' ? styles.active : ''}`}>My Deals</Link>
                <Link href="/portfolio" className={`${styles.navLink} ${router.pathname === '/portfolio' ? styles.active : ''}`}>Portfolio</Link>
                <Link href="/matcher" className={`${styles.navLink} ${router.pathname === '/matcher' ? styles.active : ''}`}>Matcher</Link>
                {isCreatorInfluencer && (
                  <Link href="/deals" className={`${styles.navLink} ${router.pathname === '/deals' ? styles.active : ''}`}>Deals</Link>
                )}
                <Link href="/channels" className={`${styles.navLink} ${router.pathname === '/channels' || router.pathname.startsWith('/channels/') ? styles.active : ''}`}>Messages</Link>
                {admin && (
                  <>
                    <Link href="/founders" className={`${styles.navLink} ${router.pathname === '/founders' ? styles.active : ''}`}>Founders</Link>
                    <Link href="/investors" className={`${styles.navLink} ${router.pathname === '/investors' ? styles.active : ''}`}>Investors</Link>
                    <Link href="/admin" className={`${styles.navLink} ${router.pathname === '/admin' || router.pathname.startsWith('/admin/') ? styles.active : ''}`}>Admin</Link>
                  </>
                )}
                <span className={styles.navBell}><NotificationBell /></span>
                <NavAvatar
                  userId={userId} photo={userPhoto} name={userName}
                  admin={admin} onLogout={handleLogout}
                />
              </>
            )}
            {token && !approved && (
              <>
                <Link href="/pending" className={styles.navLink}>Pending request</Link>
                <button onClick={handleLogout} className={styles.navLogout}>Log out</button>
              </>
            )}
            {!token && (
              <>
                <FluffyButton href="/signup" label="Join the waitlist" width={180} height={40} strands={900} strandLen={6} fontSize={14} />
                <Link href="/login" className={styles.navLink}>Log in</Link>
              </>
            )}
          </div>

          {/* Mobile dropdown */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                className={styles.mobileMenu}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {token && approved && (
                  <>
                    <Link href="/community" className={`${styles.navLink} ${router.pathname === '/community' ? styles.active : ''}`}>Feed</Link>
                    <Link href="/events" className={`${styles.navLink} ${router.pathname === '/events' ? styles.active : ''}`}>Events</Link>
                    <Link href="/offerings" className={`${styles.navLink} ${router.pathname === '/offerings' || router.pathname.startsWith('/offerings/') ? styles.active : ''}`}>Offerings</Link>
                    <Link href="/my-offerings" className={`${styles.navLink} ${router.pathname === '/my-offerings' ? styles.active : ''}`}>My Deals</Link>
                    <Link href="/portfolio" className={`${styles.navLink} ${router.pathname === '/portfolio' ? styles.active : ''}`}>Portfolio</Link>
                    <Link href="/matcher" className={`${styles.navLink} ${router.pathname === '/matcher' ? styles.active : ''}`}>Matcher</Link>
                    {isCreatorInfluencer && (
                      <Link href="/deals" className={`${styles.navLink} ${router.pathname === '/deals' ? styles.active : ''}`}>Deals</Link>
                    )}
                    <Link href="/channels" className={`${styles.navLink} ${router.pathname === '/channels' || router.pathname.startsWith('/channels/') ? styles.active : ''}`}>Messages</Link>
                    {admin && (
                      <>
                        <Link href="/founders" className={`${styles.navLink} ${router.pathname === '/founders' ? styles.active : ''}`}>Founders</Link>
                        <Link href="/investors" className={`${styles.navLink} ${router.pathname === '/investors' ? styles.active : ''}`}>Investors</Link>
                        <Link href="/admin" className={`${styles.navLink} ${router.pathname === '/admin' || router.pathname.startsWith('/admin/') ? styles.active : ''}`}>Admin</Link>
                      </>
                    )}
                    <div className={styles.mobileMenuDivider} />
                    {userId && <Link href={`/profile/${userId}`} className={`${styles.navLink} ${router.pathname === `/profile/${userId}` ? styles.active : ''}`}>My Profile</Link>}
                    <Link href="/settings" className={`${styles.navLink} ${router.pathname === '/settings' ? styles.active : ''}`}>Settings</Link>
                    <Link href="/saved" className={`${styles.navLink} ${router.pathname === '/saved' ? styles.active : ''}`}>Saved Posts</Link>
                    <button onClick={handleLogout} className={styles.navLogout}>Log out</button>
                  </>
                )}
                {token && !approved && (
                  <>
                    <Link href="/pending" className={styles.navLink}>Pending request</Link>
                    <button onClick={handleLogout} className={styles.navLogout}>Log out</button>
                  </>
                )}
                {!token && (
                  <>
                    <FluffyButton href="/signup" label="Join the waitlist" fullWidth height={40} strands={900} strandLen={6} fontSize={13} />
                    <Link href="/login" className={styles.navLink}>Log in</Link>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        <motion.main
          key={router.pathname}
          className={styles.main}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {children}
        </motion.main>
      </AnimatePresence>

      {!isAdminPage && (
      <motion.footer
        className={styles.footer}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.footerOverlay} />
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Link href="/" className={styles.footerBrandRow}>
              <Image src="/images/logo.png" alt="By The Fruit" width={30} height={30} />
              <span>By The Fruit</span>
            </Link>
            <p className={styles.footerTagline}>Know them by their fruit. A trusted community for founders and investors.</p>
            <p className={styles.footerDisclaimer}>Community access is by approval only. Nothing here constitutes financial advice.</p>
          </div>

          <div className={styles.footerCol}>
            <span className={styles.footerColTitle}>Platform</span>
            <Link href="/community" className={styles.footerLink}>Feed</Link>
            <Link href="/events" className={styles.footerLink}>Events</Link>
            <Link href="/channels" className={styles.footerLink}>Messages</Link>
          </div>

          <div className={styles.footerCol}>
            <span className={styles.footerColTitle}>Join</span>
            <Link href="/signup" className={styles.footerLink}>Join the waitlist</Link>
            <Link href="/login" className={styles.footerLink}>Log in</Link>
            <a href="mailto:hello@bythefruit.com" className={styles.footerLink}>Contact us</a>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} By The Fruit. All rights reserved.</span>
          <div className={styles.footerSocial}>
            <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer">Twitter</a>
            <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://linkedin.com/company/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </div>
        </div>
      </motion.footer>
      )}
    </div>
  )
}
