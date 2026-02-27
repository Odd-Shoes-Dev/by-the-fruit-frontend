import { useState, useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { setAuth, getToken, isApproved } from '../lib/api'
import FluffyButton from '../components/FluffyButton'
import styles from '../styles/Auth.module.css'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [ok, setOk] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (getToken()) {
      router.replace(isApproved() ? '/community' : '/pending')
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (res.ok) {
        const result = await res.json()
        const raw = result?.user
        const token = raw?.token
        if (raw && token) {
          const user = raw.user_data ? { ...raw.user_data, token } : { ...raw }
          setAuth(user, token)
          setOk(true)
          if (typeof window !== 'undefined') {
            const approved = user.approval_status === 'approved' || user.is_staff
            const pendingRole = localStorage.getItem('btf_pending_role')

            if (!approved) {
              window.location.href = '/pending'
              return
            }

            if (pendingRole === 'investor' || pendingRole === 'founder') {
              localStorage.setItem('btf_pending_token', token)
              window.location.href = '/signup/profile'
              return
            }

            // Always clear any stale pending role if not pending
            localStorage.removeItem('btf_pending_role')
            localStorage.removeItem('btf_pending_user_id')
            localStorage.removeItem('btf_pending_token')

            // Send admins to admin dashboard, everyone else to the community feed
            if (user.is_staff) {
              window.location.href = '/admin'
            } else {
              window.location.href = '/community'
            }
            return
          }
          return
        }
      }
      const errData = await res.json().catch(() => ({}))
      // Renderer may wrap as { data: { error: true, errors: [...] } } OR { errors: {...} }
      const inner = errData?.data ?? errData
      const errs = inner?.errors ?? {}
      const msg = Array.isArray(errs)
        ? (errs.join(' · ') || 'Login failed. Check your email and password.')
        : (errs?.detail
            || errs?.non_field_errors?.[0]
            || Object.entries(errs).filter(([k]) => k !== 'detail').map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' · ')
            || inner?.error
            || 'Login failed. Check your email and password.')
      setError(msg)
    } catch (e) {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head><title>Log in — By The Fruit</title></Head>
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

          <h1 className={styles.authTitle}>Welcome back</h1>
          <p className={styles.authSub}>Log in to your account</p>

          {ok ? (
            <div className={styles.successBox}>
              <p>Logged in successfully.</p>
              <Link href="/" className={styles.authLink}>Go to home →</Link>
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
              <label className={styles.fieldLabel}>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className={styles.fieldInput}
                />
              </label>

              {error && <div className={styles.errorBox}>{error}</div>}

              <FluffyButton
                type="submit"
                disabled={loading}
                label={loading ? 'Logging in…' : 'Log in'}
                fullWidth
                height={48}
                strands={1500}
                strandLen={8}
                fontSize={15}
              />

              <p className={styles.forgotLink}>
                <Link href="/forgot-password">Forgot your password?</Link>
              </p>
            </form>
          )}

          <div className={styles.authFooter}>
            <span>Don&apos;t have an account?</span>
            <Link href="/signup" className={styles.authLink}>Join the waitlist</Link>
          </div>
        </motion.div>
      </div>
      <div className={styles.authPageBar}>
        <span>© {new Date().getFullYear()} By The Fruit</span>
        <Link href="/">Home</Link>
        <Link href="/signup">Join the waitlist</Link>
      </div>
    </>
  )
}
