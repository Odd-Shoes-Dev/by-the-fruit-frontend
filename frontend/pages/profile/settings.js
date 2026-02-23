import { useEffect } from 'react'
import { useRouter } from 'next/router'

// Profile settings have moved to /settings#profile
export default function ProfileSettingsRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/settings#profile')
  }, [router])
  return null
}
