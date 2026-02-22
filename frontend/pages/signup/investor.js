import { useEffect } from 'react'
import { useRouter } from 'next/router'

/**
 * Dedicated entry point: /signup/investor
 * Redirects to /signup?role=investor so the same form shows "Sign up as Investor"
 * and after signup redirects to complete investor profile.
 */
export default function SignupInvestor() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/signup?role=investor')
  }, [router])
  return <div className="container"><p>Redirecting…</p></div>
}
