import { useState, useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { getToken, isApproved } from '../../lib/api'
import styles from '../../styles/Auth.module.css'

export default function Signup() {
  const router = useRouter()
  const role = router.query.role || ''

  useEffect(() => {
    if (!router.isReady) return
    if (getToken()) {
      router.replace(isApproved() ? '/community' : '/pending')
    }
  }, [router.isReady])
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [location, setLocation] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [newsletterOptIn, setNewsletterOptIn] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, full_name: name, password,
          newsletter_opt_in: newsletterOptIn,
          ...(location && { location }),
          ...(address && { address }),
          ...(phone && { phone }),
          ...(postalCode && { postal_code: postalCode })
        })
      })
      if (res.ok) {
        const data = await res.json()
        
        console.log('Registration response:', data)
        if (role === 'investor' || role === 'founder') {
          if (typeof window !== 'undefined') {
            const userData = data.data ?? data  // Renderer wraps success as {"data": {...}}
            localStorage.setItem('btf_pending_role', role)
            localStorage.setItem('btf_pending_token', userData.token)
            localStorage.setItem('btf_pending_user_id', userData.id)
          }
          router.push('/signup/profile')
        } else {
          setSaved(true)
        }
        return
      }
      const errData = await res.json().catch(() => ({}))
      console.error('Registration error response:', errData)
      setError(errData?.error || errData?.email?.[0] || 'Registration failed. Please try again.')
    } catch (err) {
      console.error('Registration network error:', err)
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  const roleLabel = role === 'founder' ? ' as Founder' : role === 'investor' ? ' as Investor' : ''

  return (
    <>
      <Head><title>Join the waitlist — By The Fruit</title></Head>
      <div className={styles.authPage}>
        <motion.div
          className={`${styles.authCard} ${styles.authCardWide}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Link href="/" className={styles.authLogo}>
            <Image src="/images/logo.png" alt="By The Fruit" width={44} height={44} />
            <span>By The Fruit</span>
          </Link>

          <h1 className={styles.authTitle}>
            Join the waitlist{roleLabel}
          </h1>
          <p className={styles.authSub}>
            Community access is by approval only. We review each request to keep the community trusted.
          </p>

          {saved ? (
            <div className={styles.successBox}>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>You&apos;re on the waitlist!</p>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: 16 }}>
                We review each request to keep the community trusted. We may contact you by email before approving. Once approved, you can log in and access the full app.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/login" className={styles.submitBtn} style={{ textDecoration: 'none', textAlign: 'center' }}>
                  Check your status
                </Link>
                <Link href="/" className={styles.authLink} style={{ alignSelf: 'center' }}>
                  Back to home
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.authForm}>
              <div className={styles.fieldGrid}>
                <label className={styles.fieldLabel}>
                  Full name
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="Your full name"
                    className={styles.fieldInput}
                  />
                </label>
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
                    minLength={8}
                    required
                    placeholder="Min. 8 characters"
                    className={styles.fieldInput}
                  />
                </label>
                <label className={styles.fieldLabel}>
                  Location <span className={styles.optional}>(optional)</span>
                  <input
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="City / Region"
                    className={styles.fieldInput}
                  />
                </label>
                <label className={styles.fieldLabel}>
                  Phone <span className={styles.optional}>(optional)</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                    className={styles.fieldInput}
                  />
                </label>
                <label className={styles.fieldLabel}>
                  Postal / ZIP Code <span className={styles.optional}>(optional)</span>
                  <input
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value)}
                    placeholder="e.g., 94102"
                    className={styles.fieldInput}
                  />
                </label>
              </div>

              <label className={styles.fieldLabel} style={{ gridColumn: '1 / -1' }}>
                Address <span className={styles.optional}>(optional)</span>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows={2}
                  placeholder="Street address"
                  className={styles.fieldInput}
                />
              </label>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={newsletterOptIn}
                  onChange={e => setNewsletterOptIn(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>I agree to receive updates — the latest news about By the Fruit in my inbox.</span>
              </label>

              {error && <div className={styles.errorBox}>{error}</div>}

              <button className={styles.submitBtn} type="submit" disabled={loading}>
                {loading ? 'Submitting…' : 'Submit application'}
              </button>
            </form>
          )}

          <div className={styles.authFooter}>
            <span>Already have an account?</span>
            <Link href="/login" className={styles.authLink}>Log in</Link>
          </div>
        </motion.div>
      </div>
    </>
  )
}
