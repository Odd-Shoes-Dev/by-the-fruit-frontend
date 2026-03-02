import { useState, useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { getToken, isApproved } from '../../lib/api'
import FluffyButton from '../../components/FluffyButton'
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

  // Role-specific fields
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [raiseStage, setRaiseStage] = useState('')
  const [investmentRange, setInvestmentRange] = useState('')
  const [isAccredited, setIsAccredited] = useState(false)

  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

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
          intended_role: role || 'general',
          ...(location && { location }),
          ...(address && { address }),
          ...(phone && { phone }),
          ...(postalCode && { postal_code: postalCode }),
          ...(linkedinUrl && { linkedin_url: linkedinUrl }),
          ...(companyName && { company_name: companyName }),
          ...(raiseStage && { raise_stage: raiseStage }),
          ...(investmentRange && { investment_range: investmentRange }),
          ...(role === 'investor' && { is_accredited: isAccredited }),
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
      // Renderer wraps as { data: { error: true, errors: [...] } } OR { errors: {...} }
      const inner = errData?.data ?? errData
      const errs = inner?.errors ?? {}

      // errors can be an array of plain strings  ["Email already exists"]
      if (Array.isArray(errs)) {
        setError(errs.join(' · ') || 'Registration failed. Please try again.')
      } else {
        // errors is an object  { email: [...], password: [...] }
        const fieldErrs = {}
        for (const [k, v] of Object.entries(errs)) {
          if (k !== 'detail' && k !== 'non_field_errors') {
            fieldErrs[k] = Array.isArray(v) ? v[0] : v
          }
        }
        if (Object.keys(fieldErrs).length > 0) {
          setFieldErrors(fieldErrs)
          setError(Object.values(fieldErrs).join(' · '))
        } else {
          setError(
            errs?.detail ||
            errs?.non_field_errors?.[0] ||
            inner?.error ||    // { error: "..." } top-level string
            'Registration failed. Please try again.'
          )
        }
      }
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
            <span style={{ fontStyle: 'italic' }}><span style={{ fontSize: '1.2em' }}>B</span>y <span style={{ fontSize: '1.2em' }}>T</span>he <span style={{ fontSize: '1.2em' }}>F</span>ruit</span>
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
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <FluffyButton href="/login" label="Check your status" width={185} height={44} strands={1000} strandLen={7} fontSize={14} />
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
                    onChange={e => { setName(e.target.value); setFieldErrors(f => ({ ...f, full_name: undefined })) }}
                    required
                    placeholder="Your full name"
                    className={`${styles.fieldInput}${fieldErrors.full_name ? ' '+styles.fieldInputError : ''}`}
                  />
                  {fieldErrors.full_name && <p className={styles.fieldError}>{fieldErrors.full_name}</p>}
                </label>
                <label className={styles.fieldLabel}>
                  Email address
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setFieldErrors(f => ({ ...f, email: undefined })) }}
                    required
                    placeholder="you@example.com"
                    className={`${styles.fieldInput}${fieldErrors.email ? ' '+styles.fieldInputError : ''}`}
                  />
                  {fieldErrors.email && <p className={styles.fieldError}>{fieldErrors.email}</p>}
                </label>
                <label className={styles.fieldLabel}>
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setFieldErrors(f => ({ ...f, password: undefined })) }}
                    minLength={8}
                    required
                    placeholder="Min. 8 characters"
                    className={`${styles.fieldInput}${fieldErrors.password ? ' '+styles.fieldInputError : ''}`}
                  />
                  {fieldErrors.password && <p className={styles.fieldError}>{fieldErrors.password}</p>}
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
              </div>

              {/* ── Founder-specific fields ── */}
              {role === 'founder' && (
                <div className={styles.roleSection}>
                  <p className={styles.roleSectionLabel}>About your venture</p>
                  <div className={styles.fieldGrid}>
                    <label className={styles.fieldLabel}>
                      Company / Project name <span className={styles.optional}>(optional)</span>
                      <input
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        placeholder="e.g. Haiven Finance"
                        className={styles.fieldInput}
                      />
                    </label>
                    <label className={styles.fieldLabel}>
                      LinkedIn profile <span className={styles.optional}>(optional)</span>
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={e => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/yourname"
                        className={styles.fieldInput}
                      />
                    </label>
                    <label className={styles.fieldLabel}>
                      Fundraising stage <span className={styles.optional}>(optional)</span>
                      <select value={raiseStage} onChange={e => setRaiseStage(e.target.value)} className={styles.fieldInput}>
                        <option value="">Select stage…</option>
                        <option value="idea">Idea / Pre-product</option>
                        <option value="pre-seed">Pre-Seed</option>
                        <option value="seed">Seed</option>
                        <option value="series-a">Series A</option>
                        <option value="growth">Growth / Series B+</option>
                      </select>
                    </label>
                  </div>
                </div>
              )}

              {/* ── Investor-specific fields ── */}
              {role === 'investor' && (
                <div className={styles.roleSection}>
                  <p className={styles.roleSectionLabel}>About your investing</p>
                  <div className={styles.fieldGrid}>
                    <label className={styles.fieldLabel}>
                      LinkedIn profile <span className={styles.optional}>(optional)</span>
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={e => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/yourname"
                        className={styles.fieldInput}
                      />
                    </label>
                    <label className={styles.fieldLabel}>
                      Typical investment range <span className={styles.optional}>(optional)</span>
                      <select value={investmentRange} onChange={e => setInvestmentRange(e.target.value)} className={styles.fieldInput}>
                        <option value="">Select range…</option>
                        <option value="under-1k">Under $1,000</option>
                        <option value="1k-10k">$1,000 – $10,000</option>
                        <option value="10k-50k">$10,000 – $50,000</option>
                        <option value="50k-250k">$50,000 – $250,000</option>
                        <option value="250k-plus">$250,000+</option>
                      </select>
                    </label>
                  </div>
                  <label className={styles.checkboxLabel} style={{ marginTop: 12 }}>
                    <input
                      type="checkbox"
                      checked={isAccredited}
                      onChange={e => setIsAccredited(e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span>I am an accredited investor</span>
                  </label>
                </div>
              )}

              <div className={styles.fieldGrid}>
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

              <FluffyButton
                type="submit"
                disabled={loading}
                label={loading ? 'Submitting…' : 'Submit application'}
                fullWidth
                height={48}
                strands={1500}
                strandLen={8}
                fontSize={15}
              />
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
