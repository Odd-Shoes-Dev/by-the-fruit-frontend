import { useState, useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { getToken, isApproved, refreshAuthUser, setAuth } from '../../lib/api'
import FluffyButton from '../../components/FluffyButton'
import styles from '../../styles/Auth.module.css'

/**
 * New multi-step signup form with conviction profile capture
 * Follows the 7-section structure:
 * 1. Role selection (identity first)
 * 2. What do you want to fund? (convictions)
 * 3. How do you want to show up? (activation modes)
 * 4. Capacity (for investors/donors)
 * 5. Creator lever (if creator selected)
 * 6. Founder intake (if founder selected)
 * 7. Contact info (name, email)
 */

const CONVICTION_OPTIONS = [
  { id: 'faith_media', label: 'Faith-driven media' },
  { id: 'safe_tech', label: 'Safe / ethical technology' },
  { id: 'family_entertainment', label: 'Family-first entertainment' },
  { id: 'education', label: 'Education / next generation' },
  { id: 'health_flourishing', label: 'Health + human flourishing' },
  { id: 'underserved_founders', label: 'Underserved founders' },
  { id: 'other', label: 'Other' },
]

const ACTIVATION_OPTIONS = [
  { id: 'invest', label: 'Invest' },
  { id: 'donate', label: 'Donate' },
  { id: 'share', label: 'Share it with others' },
  { id: 'advisory', label: 'Get involved (community / advisory)' },
  { id: 'learn', label: 'Learn first' },
]

export default function SignupMultiStep() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  // Basic auth fields
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')

  // Role selection
  const [role, setRole] = useState('')

  // Conviction profile fields
  const [convictions, setConvictions] = useState([])
  const [otherConviction, setOtherConviction] = useState('')
  const [activationModes, setActivationModes] = useState([])
  const [capacityLevel, setCapacityLevel] = useState('')
  const [hasAudience, setHasAudience] = useState('')
  const [audiencePlatforms, setAudiencePlatforms] = useState([])
  const [raisingStatus, setRaisingStatus] = useState('')
  const [buildingDescription, setBuildingDescription] = useState('')

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''

  useEffect(() => {
    let cancelled = false
    async function routeExistingSession() {
      if (!getToken()) return
      await refreshAuthUser()
      if (cancelled) return
      router.replace(isApproved() ? '/community' : '/pending')
    }
    routeExistingSession()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!role) return
    const roleDefaultMap = {
      investor: 'invest',
      donor: 'donate',
      creator: 'share',
      founder: 'advisory',
    }
    const defaultMode = roleDefaultMap[role]
    if (!defaultMode) return

    setActivationModes(prev => (prev.length ? prev : [defaultMode]))
  }, [role])

  // Multi-select handlers
  const toggleConviction = (id) => {
    setConvictions(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      if (id === 'other' && !next.includes('other')) {
        setOtherConviction('')
      }
      return next
    })
  }

  const toggleActivationMode = (id) => {
    setActivationModes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const togglePlatform = (id) => {
    setAudiencePlatforms(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const normalizedConvictions = convictions.includes('other') && otherConviction.trim()
        ? [...convictions, `other:${otherConviction.trim()}`]
        : convictions

      const payload = {
        email,
        full_name: fullName,
        password,
        ...(phone && { phone }),
        intended_role: role,
        convictions: normalizedConvictions,
        activation_modes: activationModes,
        audience_platforms: audiencePlatforms,
        ...(capacityLevel && { capacity_level: capacityLevel }),
        ...(hasAudience && { has_audience: hasAudience }),
        ...(raisingStatus && { raising_status: raisingStatus }),
        ...(buildingDescription && { building_description: buildingDescription }),
        newsletter_opt_in: false,
      }

      const res = await fetch(`${API_BASE}/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        const inner = errData?.data ?? errData
        const errs = inner?.errors ?? {}

        if (Array.isArray(errs)) {
          setError(errs.join(' · ') || 'Signup failed')
        } else {
          setError(
            errs?.detail ||
            errs?.non_field_errors?.[0] ||
            inner?.detail ||
            inner?.message ||
            inner?.error ||
            'Signup failed'
          )
        }
        setLoading(false)
        return
      }

      const data = await res.json()
      const userPayload = data?.data ?? data
      const user = userPayload?.user_data ? { ...userPayload.user_data, token: userPayload.token } : userPayload

      // Store auth tokens
      setAuth(user, userPayload.token)
      localStorage.setItem('btf_pending_role', role)

      // Redirect to conviction profile page
      router.push('/waitlist/conviction-profile')
    } catch (err) {
      setError(err.message || 'An error occurred')
      setLoading(false)
    }
  }

  const STEPS = [
    { title: 'How are you stepping in?', sub: 'Choose your role' },
    { title: 'What do you feel called to fund?', sub: 'Select your convictions' },
    { title: 'Beyond your primary role, how else do you want to show up?', sub: 'Choose all that apply' },
    { title: 'Capacity', sub: 'Level of participation' },
    { title: 'Creator leverage', sub: 'Do you have an audience?' },
    { title: 'Founder intake', sub: 'What are you building?' },
    { title: 'You\'re in', sub: 'Final step' },
  ]

  // Only show relevant steps
  const relevantSteps = [0, 1, 2]
  if (role === 'investor' || role === 'donor') relevantSteps.push(3)
  if (role === 'creator') relevantSteps.push(4)
  if (role === 'founder') relevantSteps.push(5)
  relevantSteps.push(6) // Always final step

  const currentRelevantIndex = relevantSteps.indexOf(step)
  const isLastStep = currentRelevantIndex === relevantSteps.length - 1

  const canProceed = () => {
    switch (step) {
      case 0:
        return !!role
      case 1:
        return convictions.length > 0 && (!convictions.includes('other') || !!otherConviction.trim())
      case 2:
        return activationModes.length > 0
      case 3:
        return !!capacityLevel
      case 4:
        return !!hasAudience
      case 5:
        return !!raisingStatus && !!buildingDescription.trim()
      case 6:
        return !!email && !!fullName && !!password && !!confirmPassword && password === confirmPassword
      default:
        return false
    }
  }

  const goNext = () => {
    if (!canProceed()) return
    const nextStep = relevantSteps[currentRelevantIndex + 1]
    if (nextStep !== undefined) {
      setStep(nextStep)
    }
  }

  const goBack = () => {
    if (currentRelevantIndex > 0) {
      const prevStep = relevantSteps[currentRelevantIndex - 1]
      setStep(prevStep)
    }
  }

  return (
    <>
      <Head>
        <title>Join the waitlist — By The Fruit</title>
      </Head>
      <div className={styles.authPage}>
        <motion.div
          className={styles.authCard}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Link href="/" className={styles.authLogo}>
            <Image src="/images/logo.png" alt="By The Fruit" width={44} height={44} />
            <span style={{ 
              fontFamily: 'var(--serif)', 
              fontSize: '1.25rem', 
              fontWeight: 500, 
              color: 'var(--blue)',
              letterSpacing: '-0.01em'
            }}>
              By The Fruit
            </span>
          </Link>

          <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--muted)', margin: 0 }}>
              {STEPS[step]?.sub}
            </p>
            <h1 style={{ fontSize: '1.4rem', margin: '0.5rem 0 0 0' }}>
              {STEPS[step]?.title}
            </h1>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* STEP 0: Role Selection */}
            {step === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { id: 'investor', label: 'Investor (deploying capital)' },
                  { id: 'donor', label: 'Donor (DAF / philanthropic)' },
                  { id: 'creator', label: 'Creator (audience + influence)' },
                  { id: 'founder', label: 'Founder (raising capital)' },
                  { id: 'exploring', label: 'Just exploring (for now)' },
                ].map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    style={{
                      padding: '0.75rem 1rem',
                      border: role === r.id ? '2px solid var(--orange)' : '1px solid #ddd',
                      background: role === r.id ? 'rgba(245, 162, 35, 0.05)' : 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: role === r.id ? 600 : 400,
                      transition: 'all 0.2s',
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}

            {/* STEP 1: Convictions */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {CONVICTION_OPTIONS.map(c => (
                  <label key={c.id} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={convictions.includes(c.id)}
                      onChange={() => toggleConviction(c.id)}
                      style={{ margin: 0, flexShrink: 0 }}
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
                {convictions.includes('other') && (
                  <input
                    type="text"
                    value={otherConviction}
                    onChange={(e) => setOtherConviction(e.target.value)}
                    placeholder="Tell us what else you feel called to fund"
                    style={{
                      padding: '0.75rem 1rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem',
                    }}
                  />
                )}
              </div>
            )}

            {/* STEP 2: Activation Modes */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p style={{ margin: '0 0 0.25rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                  We pre-selected one based on your role. Add any others that fit.
                </p>
                {ACTIVATION_OPTIONS.map(a => (
                  <label key={a.id} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={activationModes.includes(a.id)}
                      onChange={() => toggleActivationMode(a.id)}
                      style={{ margin: 0, flexShrink: 0 }}
                    />
                    <span>{a.label}</span>
                  </label>
                ))}
              </div>
            )}

            {/* STEP 3: Capacity */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { id: 'just_starting', label: 'Just getting started' },
                  { id: '1k_10k', label: '$1K–$10K' },
                  { id: '10k_50k', label: '$10K–$50K' },
                  { id: '50k_plus', label: '$50K+' },
                  { id: 'prefer_not_say', label: 'Prefer not to say' },
                ].map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCapacityLevel(c.id)}
                    style={{
                      padding: '0.75rem 1rem',
                      border: capacityLevel === c.id ? '2px solid var(--orange)' : '1px solid #ddd',
                      background: capacityLevel === c.id ? 'rgba(245, 162, 35, 0.05)' : 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: capacityLevel === c.id ? 600 : 400,
                      transition: 'all 0.2s',
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}

            {/* STEP 4: Creator Lever */}
            {step === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.95rem' }}>Do you have an audience you'd want to bring into this?</p>
                  {['yes_active', 'exploring', 'not_yet'].map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHasAudience(h)}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '0.75rem 1rem',
                        margin: '0.5rem 0',
                        border: hasAudience === h ? '2px solid var(--orange)' : '1px solid #ddd',
                        background: hasAudience === h ? 'rgba(245, 162, 35, 0.05)' : 'white',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: hasAudience === h ? 600 : 400,
                        transition: 'all 0.2s',
                      }}
                    >
                      {h === 'yes_active' && 'Yes — actively'}
                      {h === 'exploring' && 'Maybe — exploring'}
                      {h === 'not_yet' && 'Not yet'}
                    </button>
                  ))}
                </div>
                {hasAudience && (
                  <div>
                    <p style={{ margin: '1rem 0 0.75rem', fontSize: '0.95rem' }}>Where do you show up most?</p>
                    {['instagram', 'tiktok', 'youtube', 'linkedin'].map(p => (
                      <label
                        key={p}
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: '0.75rem',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          margin: '0.5rem 0',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={audiencePlatforms.includes(p)}
                          onChange={() => togglePlatform(p)}
                          style={{ margin: 0, flexShrink: 0 }}
                        />
                        <span style={{ textTransform: 'capitalize' }}>{p}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: Founder Intake */}
            {step === 5 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.95rem' }}>Are you currently raising?</p>
                  {['currently_raising', 'soon', 'exploring'].map(rs => (
                    <button
                      key={rs}
                      type="button"
                      onClick={() => setRaisingStatus(rs)}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '0.75rem 1rem',
                        margin: '0.5rem 0',
                        border: raisingStatus === rs ? '2px solid var(--orange)' : '1px solid #ddd',
                        background: raisingStatus === rs ? 'rgba(245, 162, 35, 0.05)' : 'white',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: raisingStatus === rs ? 600 : 400,
                        transition: 'all 0.2s',
                      }}
                    >
                      {rs === 'currently_raising' && 'Currently raising'}
                      {rs === 'soon' && 'Soon'}
                      {rs === 'exploring' && 'Exploring'}
                    </button>
                  ))}
                </div>
                <div>
                  <label style={{ display: 'block', margin: '1rem 0 0.5rem', fontSize: '0.95rem' }}>
                    What are you building?
                  </label>
                  <textarea
                    value={buildingDescription}
                    onChange={(e) => setBuildingDescription(e.target.value)}
                    placeholder="Brief description of your project..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      minHeight: '80px',
                    }}
                  />
                </div>
              </div>
            )}

            {/* STEP 6: Contact Info */}
            {step === 6 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ marginBottom: '0.25rem' }}>
                  <p style={{ margin: 0, color: '#4b5563', lineHeight: 1.5 }}>
                    This only works if people like you step in. You&apos;re not joining a list. You&apos;re helping fund what comes next.
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                  }}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                  }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                  }}
                />
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    padding: '0.75rem 1rem',
                    border: confirmPassword && password !== confirmPassword ? '2px solid #dc2626' : '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                  }}
                />
                {confirmPassword && password !== confirmPassword && (
                  <div style={{ color: '#dc2626', fontSize: '0.9rem', fontWeight: 600, marginTop: '0.25rem' }}>
                    ⚠️ Passwords don't match
                  </div>
                )}
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                  }}
                />
              </div>
            )}

            {error && (
              <div style={{ color: '#dc2626', fontSize: '0.9rem', padding: '0.75rem', background: '#fef2f2', borderRadius: '6px' }}>
                {error}
              </div>
            )}

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              {currentRelevantIndex > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--orange)',
                    background: 'white',
                    color: 'var(--orange)',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>
              )}
              {!isLastStep ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canProceed() || loading}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    background: canProceed() ? 'var(--orange)' : '#ddd',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: canProceed() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canProceed() || loading}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    background: canProceed() ? 'var(--orange)' : '#ddd',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: canProceed() ? 'pointer' : 'not-allowed',
                  }}
                >
                  {loading ? 'Creating account...' : 'Join the waitlist'}
                </button>
              )}
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted)', margin: '1rem 0 0' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: 'var(--orange)', textDecoration: 'none', fontWeight: 600 }}>
                Log in
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
      <div className={styles.authPageBar}>
        <span>© {new Date().getFullYear()} By The Fruit</span>
        <Link href="/">Home</Link>
      </div>
    </>
  )
}
