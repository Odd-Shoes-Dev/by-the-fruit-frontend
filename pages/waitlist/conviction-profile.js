import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { getToken, getStoredUser, apiFetch } from '../../lib/api'
import styles from '../../styles/Auth.module.css'

/**
 * POST-SUBMIT CONVICTION PROFILE PAGE
 * 
 * Shown immediately after signup.
 * Users see:
 * 1. Their generated "Conviction Profile" (archetype + descriptor)
 * 2. Next actions: Share, Follow, Watch
 * 3. Sense of belonging ("you're not joining a list, you're helping fund what comes next")
 */

export default function ConvictionProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copiedShare, setCopiedShare] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.replace('/login')
      return
    }

    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await apiFetch('/user/me/conviction-profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data.data || data)
      }
    } catch (err) {
      console.error('Failed to fetch conviction profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const user = getStoredUser()
  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/signup/multi-step?ref=${user?.user_code || ''}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopiedShare(true)
    setTimeout(() => setCopiedShare(false), 2000)
  }

  if (loading) {
    return (
      <div className={styles.authPage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading your profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={styles.authPage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Could not load your profile. Please try again.</p>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Your Conviction Profile — By The Fruit</title>
      </Head>
      <div className={styles.authPage}>
        <motion.div
          className={styles.authCard}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{ textAlign: 'center', maxWidth: '500px' }}
        >
          <Link href="/" className={styles.authLogo} style={{ justifyContent: 'center' }}>
            <Image src="/images/logo.png" alt="By The Fruit" width={44} height={44} />
            <span style={{ fontStyle: 'italic' }}>
              <span style={{ fontSize: '1.2em' }}>B</span>y{' '}
              <span style={{ fontSize: '1.2em' }}>T</span>he{' '}
              <span style={{ fontSize: '1.2em' }}>F</span>ruit
            </span>
          </Link>

          {/* Profile Label & Descriptor */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              margin: '2rem 0',
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(255, 174, 66, 0.1), rgba(245, 162, 35, 0.1))',
              borderRadius: '16px',
              border: '2px solid rgba(245, 162, 35, 0.2)',
            }}
          >
            <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem', color: 'var(--orange)' }}>
              {profile.profile_label || 'Community Member'}
            </h2>
            <p style={{ fontSize: '1.1rem', margin: 0, color: '#333', fontWeight: 500 }}>
              {profile.profile_descriptor}
            </p>
          </motion.div>

          {/* Message */}
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '1rem', color: '#666', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
              You're not joining a list. You're helping fund what comes next.
            </p>
            <p style={{ fontSize: '0.95rem', color: '#999', margin: 0 }}>
              Here's how you can get involved:
            </p>
          </div>

          {/* Next Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            {/* Action 1: Share */}
            <div
              style={{
                padding: '1.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                background: '#fafafa',
                textAlign: 'left',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem', color: '#333' }}>
                📤 Share
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#666', margin: '0 0 0.75rem' }}>
                Invite 3 people who care about this
              </p>
              <button
                onClick={handleCopyLink}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: copiedShare ? '#22c55e' : 'var(--orange)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                {copiedShare ? '✓ Link copied!' : 'Copy referral link'}
              </button>
            </div>

            {/* Action 2: Follow */}
            <a
              href="https://linkedin.com/company/by-the-fruit"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  padding: '1.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  background: '#fafafa',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3f4f6'
                  e.currentTarget.style.borderColor = 'var(--orange)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fafafa'
                  e.currentTarget.style.borderColor = '#e5e7eb'
                }}
              >
                <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem', color: '#333' }}>
                  🔗 Follow
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#666', margin: '0' }}>
                  Stay updated on what's coming →
                </p>
              </div>
            </a>

            {/* Action 3: Watch */}
            <div
              style={{
                padding: '1.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                background: '#fafafa',
                textAlign: 'left',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.75rem', color: '#333' }}>
                🎬 Watch
              </h3>
              <div
                style={{
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#000',
                  aspectRatio: '16 / 9',
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
              <p style={{ fontSize: '0.9rem', color: '#666', margin: '0.75rem 0 0 0' }}>
                60-sec vision from Chantelle
              </p>
            </div>
          </motion.div>

          {/* Final CTA */}
          <div style={{ padding: '1.5rem', background: '#f0fdf4', borderRadius: '12px', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.95rem', color: '#166534', margin: 0, lineHeight: 1.6 }}>
              <strong>We're reviewing your application</strong> and will be in touch soon with next steps. In the meantime, help us grow by sharing! 🌱
            </p>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link
              href="/"
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: 'var(--orange)',
                border: '2px solid var(--orange)',
                borderRadius: '8px',
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--orange)'
                e.currentTarget.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--orange)'
              }}
            >
              Back to home
            </Link>
            <Link
              href="/login"
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--orange)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              Log in
            </Link>
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
