import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { apiFetch } from '../lib/api'
import styles from '../styles/Auth.module.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await apiFetch('/user/request-reset-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      <Head><title>Forgot password — By The Fruit</title></Head>
      <div className={styles.authPage}>
        <motion.div
          className={styles.authCard}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Link href="/" className={styles.authLogo}>
            <Image src="/images/logo.png" alt="By The Fruit" width={44} height={44} />
            <span>By The Fruit</span>
          </Link>

          <h1 className={styles.authTitle}>Reset password</h1>
          <p className={styles.authSub}>Enter your email and we&apos;ll send you a reset link.</p>

          {status === 'sent' ? (
            <div className={styles.successBox}>
              <p style={{ margin: 0 }}>If an account exists for that email, we sent a reset link. Check your inbox and spam folder.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.authForm}>
              <label className={styles.fieldLabel}>
                Email address
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className={styles.fieldInput}
                />
              </label>
              {status === 'error' && <div className={styles.errorBox}>Something went wrong. Please try again.</div>}
              <button className={styles.submitBtn} type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}

          <div className={styles.authFooter}>
            <Link href="/login" className={styles.authLink}>Back to login</Link>
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
