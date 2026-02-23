import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { apiFetch } from '../lib/api'

export default function NotificationBell() {
  const [count, setCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    function fetchCount() {
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
    router.events.on('routeChangeComplete', handleRouteChange)

    return () => {
      mounted = false
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router])

  return (
    <Link
      href="/notifications"
      style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', padding: 4 }}
      aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
    >
      {/* Inline SVG — bell icon extracted from the original file, tight viewBox */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="232 345 132 148"
        width={22}
        height={22}
        fill="currentColor"
        aria-hidden="true"
        style={{ display: 'block', flexShrink: 0 }}
      >
        {/* Bell body outline */}
        <path d="M294.24,388.05c-2.89,0.23-5.52,0.78-8.09,0.58c-15.4-1.25-22.69-11.66-25.46-25.26c-0.14-0.7,1.49-2.41,2.5-2.61
          c13.71-2.69,26.54,4.3,31.83,17.14c0.23,0.57,0.52,1.12,0.67,1.44c1.89-3.14,3.62-6.46,5.82-9.43c0.77-1.03,3.04-1.99,4.04-1.57
          c1.81,0.76,3.34,2.46,4.61,4.06c0.27,0.34-0.84,2.14-1.65,2.93c-4.55,4.43-7.35,9.71-8.19,16.27c0.79,0.27,1.55,0.67,2.35,0.8
          c10.14,1.56,16.45,7.63,18.09,17.43c1.94,11.65,5.94,22.27,11.6,32.58c2.54,4.63,3.76,10.36,4.13,15.7
          c0.61,8.66-4.28,15.62-12.44,18.53c-4.53,1.61-9.47,2.02-14.17,3.21c-1.32,0.34-2.87,1.29-3.51,2.41
          c-1.99,3.47-4.77,5.46-8.72,5.53c-3.98,0.07-6.75-1.9-8.8-5.34c-0.73-1.22-2.39-2.25-3.82-2.61c-3.85-0.98-7.94-1.13-11.69-2.36
          c-11.06-3.63-16.62-12.92-14.18-24.29c1.06-4.91,3.01-9.83,5.52-14.19c4.75-8.26,7.93-16.85,9.11-26.33
          c1.45-11.68,6.86-17.52,18.3-20.31C294.73,391.72,294.82,390.37,294.24,388.05z"/>
        {/* Clapper */}
        <path d="M290.7,480.52c1.47,3.5,3.9,4.94,7.08,4.81c2.97-0.13,5.41-1.43,6.39-4.81C299.65,480.52,295.41,480.52,290.7,480.52z"/>
      </svg>
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
