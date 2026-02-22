import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

export default function NotificationBell() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let mounted = true
    apiFetch('/profiles/notifications/unread-count/')
      .then(r => r.ok ? r.json() : { count: 0 })
      .then(data => { if (mounted) setCount(data.count || 0) })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  return (
    <Link href="/notifications" style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', padding: 4 }} aria-label="Notifications">
      <img src="/icons/notifications.svg" alt="" width={24} height={24} style={{ display: 'block', verticalAlign: 'middle' }} />
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
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px'
          }}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
