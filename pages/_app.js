import Head from 'next/head'
import '../styles/globals.css'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { getToken, isApproved } from './../lib/api'
import Layout from '../components/Layout'
import verses from '../data/verses.json'

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

  const [isSunday, setIsSunday] = useState(false)
  const [verse, setVerse] = useState(verses.default)

  useEffect(() => {
    // Check if it's Sunday in ET
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    
    const parts = formatter.formatToParts(new Date())
    const partMap = {}
    parts.forEach(p => partMap[p.type] = p.value)
    
    if (partMap.weekday === 'Sat') {
      setIsSunday(true)
      const dateKey = `${partMap.year}-${partMap.month}-${partMap.day}`
      if (verses[dateKey]) {
        setVerse(verses[dateKey])
      }
    }
  }, [])

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

  if (isSunday) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--dark)',
        color: 'var(--cream)',
        fontFamily: "'Source Sans 3', system-ui, sans-serif",
        padding: '24px',
        textAlign: 'center'
      }}>
        <Head>
          <title>Day of Rest | By the Fruit</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <meta name="robots" content="noindex, nofollow, nosnippet, noarchive, noimageindex" />
        </Head>
        
        <div style={{
          maxWidth: '600px',
          width: '100%',
          margin: '0 auto',
          padding: '48px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '40px'
        }}>
          <h1 style={{
            fontFamily: "'Oswald', 'Franklin Gothic Heavy', sans-serif",
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            color: 'var(--blue-dark)',
            fontWeight: 500,
            lineHeight: 1.1,
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            We’re Closed Today — <br/>
            <span style={{ fontStyle: 'italic', color: 'var(--orange2)' }}>On Purpose.</span>
          </h1>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
            fontSize: '1.15rem',
            color: 'var(--cream)',
            lineHeight: 1.6,
            fontWeight: 300
          }}>
            <p style={{ margin: 0 }}>
              At <strong style={{ fontWeight: 600, color: 'var(--blue-dark)' }}>By the Fruit</strong>, we believe capital should serve life — not consume it.
            </p>
            
            <div style={{
              background: 'var(--blue-light)',
              padding: '32px 40px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              color: 'var(--blue-dark)',
              fontWeight: 500,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '6px',
                height: '100%',
                background: 'var(--orange2)'
              }}></div>
              <p style={{ margin: '0 0 8px 0', fontSize: '1.25rem' }}>So every Sunday (12:00am–11:59pm ET), we pause.</p>
              <p style={{ margin: 0, color: 'var(--orange2)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.85rem' }}>No deals. No dashboards. No urgency.</p>
              <span style={{ display: 'block', marginTop: '24px', fontSize: '2.5rem', fontFamily: "'Oswald', sans-serif", fontStyle: 'italic' }}>Just rest.</span>
            </div>
            
            <p style={{ margin: 0 }}>
              We honor the Sabbath as a reminder that our worth isn’t measured in productivity — and that the world keeps turning without our striving.
            
              What an honor it is to rest in Him — as the first investment community to pause weekly to reflect, listen, and honor the One who gives to us so freely.
          
              Whether today looks like church, family dinner, a long walk, or quiet reflection — we hope you take this space to reset and recharge.
            </p>
          </div>
          
          <div style={{
            paddingTop: '48px',
            borderTop: '1px solid var(--border)',
            marginTop: '32px',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'var(--dark)',
              padding: '0 24px',
              fontSize: '2rem',
              color: 'var(--orange2)'
            }}>
              🕊️
            </div>
            <p style={{
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--orange2)',
              fontWeight: 700,
              margin: '0 0 24px 0'
            }}>This week’s encouragement:</p>
            <p style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              color: 'var(--blue-dark)',
              fontStyle: 'italic',
              lineHeight: 1.3,
              margin: 0,
              padding: '0 16px'
            }}>
              {verse}
            </p>
          </div>
          
          <div style={{ paddingTop: '40px', paddingBottom: '32px' }}>
            <p style={{ fontSize: '1.2rem', color: 'var(--cream2)', margin: 0, fontWeight: 500 }}>
              We’ll see you tomorrow <span style={{ color: 'var(--orange2)', marginLeft: '8px', fontSize: '1.5rem' }}>🧡</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

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
