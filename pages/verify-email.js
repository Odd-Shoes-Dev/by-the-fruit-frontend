import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FiCheckCircle, FiAlertCircle, FiMail } from 'react-icons/fi'
import styles from '../styles/Auth.module.css'

export default function VerifyEmail() {
  const router = useRouter()
  const { token } = router.query
  const [status, setStatus] = useState('idle') // idle | loading | success | error | no-token
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!router.isReady) return
    if (!token) { setStatus('no-token'); return }
    setStatus('loading')
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''
    fetch(`${API_BASE}/user/verify-email?token=${encodeURIComponent(token)}`)
      .then(async res => {
        const data = await res.json().catch(() => ({}))
        if (res.ok) { setStatus('success'); setMessage(data.email || 'Your email has been verified.') }
        else { setStatus('error'); setMessage(data.email || 'This link is invalid or has already been used.') }
      })
      .catch(() => { setStatus('error'); setMessage('Network error — please try again.') })
  }, [router.isReady, token])

  return (
    <>
      <Head><title>Verify your email — By The Fruit</title></Head>
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

          <h1 className={styles.authTitle}>Verify your email</h1>

          {(status === 'idle' || status === 'loading') && (
            <p className={styles.authSub}>Verifying your email address…</p>
          )}

          {status === 'success' && (
            <>
              <FiCheckCircle size={44} style={{ color: 'var(--teal)', margin: '0.5rem auto 1rem', display: 'block' }} />
              <p style={{ color: 'var(--teal)', fontWeight: 600, marginBottom: 8 }}>{message}</p>
              <p className={styles.authSub} style={{ marginBottom: 16 }}>You can now log in to your account.</p>
              <Link href="/login" className={styles.submitBtn} style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>
                Go to login
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <FiAlertCircle size={44} style={{ color: '#e53e3e', margin: '0.5rem auto 1rem', display: 'block' }} />
              <div className={styles.errorBox}>{message}</div>
              <div className={styles.authFooter}>
                <Link href="/login" className={styles.authLink}>Log in</Link>
                <span style={{ color: 'var(--muted)' }}>·</span>
                <Link href="/" className={styles.authLink}>Home</Link>
              </div>
            </>
          )}

          {status === 'no-token' && (
            <>
              <FiMail size={44} style={{ color: 'var(--muted)', margin: '0.5rem auto 1rem', display: 'block' }} />
              <p className={styles.authSub}>Check your inbox for a verification link. If you don&apos;t see it, check your spam folder.</p>
              <div className={styles.authFooter}>
                <Link href="/login" className={styles.authLink}>Log in</Link>
                <span style={{ color: 'var(--muted)' }}>·</span>
                <Link href="/" className={styles.authLink}>Home</Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
      <div className={styles.authPageBar}>
        <span>© {new Date().getFullYear()} By The Fruit</span>
        <Link href="/">Home</Link>
      </div>
    </>
  )
}
