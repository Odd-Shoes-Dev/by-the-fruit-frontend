import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { FiClock } from 'react-icons/fi'
import { getToken, getStoredUser, clearAuth, isApproved, refreshAuthUser } from '../lib/api'
import FluffyButton from '../components/FluffyButton'
import styles from '../styles/Auth.module.css'

export default function Pending() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    async function syncApprovalState() {
      if (typeof window === 'undefined') return
      if (!getToken()) {
        router.replace('/login')
        return
      }
      await refreshAuthUser()
      if (cancelled) return
      if (isApproved()) {
        router.replace('/community')
      }
    }
    syncApprovalState()
    return () => { cancelled = true }
  }, [router])

  const user = typeof window !== 'undefined' ? getStoredUser() : null
  const status = user?.approval_status ?? user?.user_data?.approval_status

  return (
    <>
      <Head>
        <title>Request pending — By The Fruit</title>
      </Head>
      <div className={styles.authPage}>
        <motion.div
          className={styles.authCard}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{ textAlign: 'center' }}
        >
          <Link href="/" className={styles.authLogo} style={{ justifyContent: 'center' }}>
            <Image src="/images/logo.png" alt="By The Fruit" width={44} height={44} />
            <span style={{ fontStyle: 'italic' }}><span style={{ fontSize: '1.2em' }}>B</span>y <span style={{ fontSize: '1.2em' }}>T</span>he <span style={{ fontSize: '1.2em' }}>F</span>ruit</span>
          </Link>

          <div style={{ marginBottom: '0.5rem' }}><FiClock size={40} style={{ color: 'var(--orange)' }} /></div>

          <h1 className={styles.authTitle}>Request pending</h1>
          <p className={styles.authSub}>
            Thanks for joining the waitlist. Your request to join the By the Fruit community is under review.
          </p>

          <div className={styles.successBox} style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
              We may reach out by email before approving. Once approved, you&apos;ll have full access to the feed, connections, channels, and events.
            </p>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--orange)' }}>
              You&apos;re on the list. We&apos;ll be in touch.
            </p>
          </div>

          <div
            style={{
              marginBottom: '1.25rem',
              padding: '1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              background: '#fafafa',
              textAlign: 'left',
            }}
          >
            <p style={{ margin: '0 0 0.75rem', fontWeight: 600, color: '#1f2937' }}>
              🎬 Watch the 60-sec vision from Chantelle
            </p>
            <div
              style={{
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#000',
                aspectRatio: '9 / 16',
                maxWidth: '100%',
              }}
            >
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/DMC55L_AgXc?autoplay=0"
                title="By The Fruit Vision"
                frameBorder="0"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ display: 'block' }}
              />
            </div>
            <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: '0.75rem 0 0 0' }}>
              Watch while your request is being reviewed
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            <FluffyButton href="/" label="Back to home" width={160} height={44} strands={900} strandLen={7} fontSize={14} color="#F5A623" color2="#F57C00" />
            <button
              type="button"
              style={{ padding: '0.65rem 1.25rem', background: 'transparent', color: 'var(--orange)', border: '1.5px solid var(--orange)', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}
              onClick={() => { clearAuth(); router.push('/login') }}
            >
              Log out
            </button>
          </div>
        </motion.div>
      </div>
      <div className={styles.authPageBar}>
        <span>© {new Date().getFullYear()} By The Fruit</span>
        <Link href="/">Home</Link>
      </div>
    </>
  )
}
