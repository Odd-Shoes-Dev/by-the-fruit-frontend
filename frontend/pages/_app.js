import '../styles/globals.css'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { getToken, isApproved } from './../lib/api'

const PROTECTED_PATHS = ['/community', '/events', '/deals', '/connections', '/channels', '/notifications', '/profile', '/founders', '/investors', '/admin']

export default function MyApp({ Component, pageProps }) {
  const router = useRouter()
  const pathname = router.pathname

  useEffect(() => {
    if (typeof window === 'undefined') return
    const token = getToken()
    if (!token) return
    if (pathname === '/pending' || pathname === '/login') return
    if (!isApproved() && PROTECTED_PATHS.some(p => pathname.startsWith(p))) {
      router.replace('/pending')
    }
  }, [pathname, router])

  return <Component {...pageProps} />
}
