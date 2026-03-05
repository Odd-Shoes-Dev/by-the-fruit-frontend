import Head from 'next/head'
import '../styles/globals.css'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { getToken, isApproved } from './../lib/api'
import Layout from '../components/Layout'

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

  const page = <Component {...pageProps} />

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      {needsLayout(pathname) ? <Layout>{page}</Layout> : page}
    </>
  )
}
