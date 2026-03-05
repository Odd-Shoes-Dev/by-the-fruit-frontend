import Head from 'next/head'
import '../styles/globals.css'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { getToken, isApproved } from './../lib/api'
import Layout from '../components/Layout'

const AUTH_ROUTES = ['/login', '/signup', '/pending', '/forgot-password', '/reset-password', '/verify-email', '/onboarding']

const PROTECTED_PATHS = ['/community', '/events', '/deals', '/connections', '/channels', '/notifications', '/profile', '/founders', '/investors', '/admin', '/settings', '/matcher']

// Pages that manage their own full-page layout (landing, auth, onboarding)
const NO_LAYOUT_PREFIXES = ['/', '/login', '/signup', '/pending', '/forgot-password', '/reset-password', '/verify-email', '/onboarding']

function needsLayout(pathname) {
  return !NO_LAYOUT_PREFIXES.some(p =>
    p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(p + '/')
  )
}

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

  // Redirect to login when the server rejects our token (401 from any API call)
  useEffect(() => {
    if (typeof window === 'undefined') return
    function onExpired() {
      const onAuthRoute = AUTH_ROUTES.some(p => pathname === p || pathname.startsWith(p + '/'))
      if (!onAuthRoute) router.replace('/login')
    }
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [pathname, router])

  // Re-check session when the user comes back to the tab (e.g. switches apps on mobile)
  useEffect(() => {
    if (typeof window === 'undefined') return
    function onVisibility() {
      if (document.visibilityState !== 'visible') return
      const onAuthRoute = AUTH_ROUTES.some(p => pathname === p || pathname.startsWith(p + '/'))
      if (!onAuthRoute && !getToken()) {
        router.replace('/login')
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [pathname, router])

  const page = <Component {...pageProps} />

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Block all crawlers, scrapers, and AI training bots */}
        <meta name="robots" content="noindex, nofollow, nosnippet, noarchive, noimageindex" />
        <meta name="googlebot" content="noindex, nofollow" />
        <meta name="bingbot" content="noindex, nofollow" />
      </Head>
      {needsLayout(pathname) ? <Layout>{page}</Layout> : page}
    </>
  )
}
