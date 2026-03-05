import { useEffect } from 'react'
import { useRouter } from 'next/router'

// Connections are now frictionless - investor messages founder directly,
// channel opens immediately. This page redirects to /channels.
export default function ConnectionsPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/channels')
  }, [])
  return null
}
