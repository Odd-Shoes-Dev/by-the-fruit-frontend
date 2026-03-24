import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { apiFetch, getToken } from '../lib/api'
import styles from '../styles/Admin.module.css'

const NAV = [
  { key: 'overview', label: 'Overview', href: '/admin' },
  { key: 'waitlist', label: 'Waitlist', href: '/admin/waitlist', badgeKey: 'pending_users' },
  { key: 'users', label: 'All Users', href: '/admin/users' },
  { key: 'kyc', label: 'KYC Queue', href: '/admin/kyc', badgeKey: 'pending_kyc' },
  { key: 'offerings', label: 'Offerings', href: '/admin/offerings' },
  { key: 'contacts', label: 'Contact Messages', href: '/admin/contacts' },
  { key: 'landing-page', label: 'Landing Page', href: '/admin/landing-page' },
  { key: 'sunday-page', label: 'Sunday Page', href: '/admin/sunday-page' },
  { key: 'hidden-posts', label: 'Hidden Posts', href: '/admin/hidden-posts' },
]

export default function AdminLayout({ children, active }) {
  const router = useRouter()
  const [badges, setBadges] = useState({})

  useEffect(() => {
    if (!getToken()) return
    async function fetchBadges() {
      try {
        const [waitlistRes, kycRes] = await Promise.all([
          apiFetch('/user/waitlist?status=pending'),
          apiFetch('/profiles/kyc-documents/'),
        ])
        const newBadges = {}
        if (waitlistRes.ok) {
          const json = await waitlistRes.json()
          const raw = json?.data ?? json
          newBadges.pending_users = Array.isArray(raw) ? raw.length : (raw?.results?.length || 0)
        }
        if (kycRes.ok) {
          const json = await kycRes.json()
          const raw = json?.data ?? json
          const list = Array.isArray(raw) ? raw : (raw?.results || [])
          newBadges.pending_kyc = list.filter(k => k.status === 'pending').length
        }
        setBadges(newBadges)
      } catch (e) {}
    }
    fetchBadges()
  }, [router.pathname])

  return (
    <div className={styles.adminWrap}>
      {/* Sidebar */}
      <nav className={styles.sidebar}>
        <span className={styles.sidebarHeading}>Admin</span>
        {NAV.map(item => (
          <Link
            key={item.key}
            href={item.href}
            className={`${styles.sidebarLink} ${active === item.key ? styles.sidebarLinkActive : ''}`}
          >
            {item.label}
            {item.badgeKey && badges[item.badgeKey] > 0 && (
              <span className={styles.badge}>{badges[item.badgeKey]}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Content */}
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}
