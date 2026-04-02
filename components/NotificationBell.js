import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { FiBell } from 'react-icons/fi'
import { apiFetch, getToken } from '../lib/api'

export default function NotificationBell() {
  const [count, setCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    function fetchCount() {
      // Skip protected request once auth is cleared (e.g., during logout).
      if (!getToken()) {
        if (mounted) setCount(0)
        return
      }

      apiFetch('/profiles/notifications/unread-count/')
        .then(r => r.ok ? r.json() : {})
        .then(json => {
          if (!mounted) return
          const raw = json?.data ?? json
          setCount(raw?.count || 0)
        })
        .catch(() => {})
    }

    fetchCount()

    // Re-fetch whenever the user navigates away from /notifications
    const handleRouteChange = (url) => {
      if (url !== '/notifications') fetchCount()
    }
    const handleAuthCleared = () => {
      if (!mounted) return
      setCount(0)
    }

    router.events.on('routeChangeComplete', handleRouteChange)
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:expired', handleAuthCleared)
      window.addEventListener('btf:logged-out', handleAuthCleared)
    }

    return () => {
      mounted = false
      router.events.off('routeChangeComplete', handleRouteChange)
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth:expired', handleAuthCleared)
        window.removeEventListener('btf:logged-out', handleAuthCleared)
      }
    }
  }, [router])

  return (
    <Link
      href="/notifications"
      style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', padding: 4 }}
      aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
    >
      {/* Bell icon */}
      <FiBell size={22} aria-hidden="true" style={{ display: 'block', flexShrink: 0, color: '#5C637E' }} />
      {count > 0 && (
        <span
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            background: 'var(--orange)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            lineHeight: 1,
          }}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
