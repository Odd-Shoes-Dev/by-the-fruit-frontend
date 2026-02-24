import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { FiClock } from 'react-icons/fi'
import { getToken, getStoredUser, clearAuth, isApproved } from '../lib/api'
import styles from '../styles/Auth.module.css'

export default function Pending() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!getToken()) {
      router.replace('/login')
      return
    }
    if (isApproved()) {
      router.replace('/')
      return
    }
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
            <span>By The Fruit</span>
          </Link>

          <div style={{ marginBottom: '0.5rem' }}><FiClock size={40} style={{ color: 'var(--teal)' }} /></div>

          <h1 className={styles.authTitle}>Request pending</h1>
          <p className={styles.authSub}>
            Thanks for joining the waitlist. Your request to join the By the Fruit community is under review.
          </p>

          <div className={styles.successBox} style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
              We may reach out by email before approving. Once approved, you&apos;ll have full access to the feed, connections, channels, and events.
            </p>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--teal)' }}>
              You&apos;re on the list. We&apos;ll be in touch.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" className={styles.submitBtn} style={{ textDecoration: 'none', display: 'inline-block', width: 'auto', padding: '0.65rem 1.5rem' }}>
              Back to home
            </Link>
            <button
              type="button"
              style={{ padding: '0.65rem 1.25rem', background: '#fff', color: 'var(--orange)', border: '1.5px solid var(--orange)', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}
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
