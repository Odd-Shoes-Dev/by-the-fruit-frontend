import { useEffect } from 'react'
import { useRouter } from 'next/router'

/**
 * Dedicated entry point: /signup/founder
 * Redirects to /signup?role=founder so the same form shows "Sign up as Founder"
 * and after signup redirects to complete founder profile.
 */
export default function SignupFounder() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/signup?role=founder')
  }, [router])
  return <div className="container"><p>Redirecting…</p></div>
}
