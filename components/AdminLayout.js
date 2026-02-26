import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from '../styles/Admin.module.css'

const NAV = [
  { key: 'overview', label: 'Overview', href: '/admin' },
  { key: 'waitlist', label: 'Waitlist', href: '/admin/waitlist', badgeKey: 'pending_users' },
  { key: 'users', label: 'All Users', href: '/admin/users' },
  { key: 'kyc', label: 'KYC Queue', href: '/admin/kyc', badgeKey: 'pending_kyc' },
  { key: 'offerings', label: 'Offerings', href: '/admin/offerings' },
  { key: 'contacts', label: 'Contact Messages', href: '/admin/contacts' },
]

export default function AdminLayout({ children, active, badges = {} }) {
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
