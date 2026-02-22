import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import styles from '../styles/Home.module.css'
import { useEffect, useState } from 'react'
import { getToken, isAdmin, isApproved, apiFetch } from '../lib/api'
import NotificationBell from '../components/NotificationBell'

// Scroll-triggered: fire when element enters viewport (amount = how much visible to trigger)
const viewportScroll = { once: true, amount: 0.12 }
const viewportScrollSoft = { once: true, amount: 0.08 }

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
}
const fadeLeft = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
}
const fadeRight = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
}
const stagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.12, delayChildren: 0.06 } }
}

export default function Home() {
  const [token, setToken] = useState(false)
  const [admin, setAdmin] = useState(false)
  const [approved, setApproved] = useState(false)
  const [testimonials, setTestimonials] = useState([])
  const [newsletterStatus, setNewsletterStatus] = useState('') // '' | 'sending' | 'sent' | 'error'
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterMessage, setNewsletterMessage] = useState('')
  const [newsletterAgree, setNewsletterAgree] = useState(false)

  useEffect(() => {
    setToken(!!getToken())
    setAdmin(isAdmin())
    setApproved(isApproved())
  }, [])

  useEffect(() => {
    let mounted = true
    apiFetch('/profiles/testimonials/')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (mounted && Array.isArray(data)) setTestimonials(data) })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  async function handleNewsletterSubmit(e) {
    e.preventDefault()
    if (!newsletterEmail.trim() || !newsletterAgree) return
    setNewsletterStatus('sending')
    try {
      const res = await apiFetch('/profiles/contact-messages/', {
        method: 'POST',
        body: JSON.stringify({ email: newsletterEmail.trim(), message: newsletterMessage.trim() || 'No message' })
      })
      if (res.ok) {
        setNewsletterStatus('sent')
        setNewsletterEmail('')
        setNewsletterMessage('')
        setNewsletterAgree(false)
      } else {
        setNewsletterStatus('error')
      }
    } catch {
      setNewsletterStatus('error')
    }
  }

  return (
    <>
      <Head>
        <title>By The Fruit — Redemptive Tech Investing</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className={styles.main}>
        <section className={styles.hero} aria-label="By The Fruit" />

        <div className={styles.contentWrap}>
          <motion.header
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className={styles.nav}
          >
            <div className={styles.navBrand}>
              <h1 className={styles.title}>By The Fruit</h1>
              <p className={styles.lead}>Investing in innovation with clarity, care, and covenant.</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {token && approved && (
                <>
                  <Link href="/community">Feed</Link>
                  <Link href="/events">Events</Link>
                  <Link href="/deals">Deals</Link>
                  <Link href="/profile/settings">Profile</Link>
                  <Link href="/connections">Connections</Link>
                  <Link href="/channels">Channels</Link>
                  <NotificationBell />
                  {admin && (
                    <>
                      <Link href="/founders">Founders</Link>
                      <Link href="/investors">Investors</Link>
                      <Link href="/admin">Admin</Link>
                    </>
                  )}
                </>
              )}
              {token && !approved && <Link href="/pending">Pending request</Link>}
              <Link href="/signup"><button className="btn" style={{ marginRight: 8 }}>Join the waitlist</button></Link>
              <Link href="/login"><button className="btn" style={{ background: token ? 'var(--orange)' : '#fff', color: token ? '#fff' : 'var(--orange)', border: '1px solid var(--orange)' }}>Log in</button></Link>
            </div>
          </motion.header>

          {/* Focus block: first thing the eye lands on */}
          <motion.section
            initial="initial"
            animate="animate"
            variants={stagger}
            className={styles.focusBlock}
          >
            <motion.p className={styles.focusTagline} variants={fadeUp}>
              By the Fruit is a community driving redemption through investment.
            </motion.p>
            <motion.p className={styles.focusTagline} variants={fadeUp}>
              <span className={styles.focusHighlight}>Where everyone has a seat at the table.</span>
            </motion.p>
            <motion.p className={styles.focusSub} variants={fadeUp}>
              Built on radical hospitality, accessibility, and the conviction to fuel a better tomorrow—starting with media, tech, and entertainment.
            </motion.p>
            <motion.div className={styles.scrollCue} variants={fadeUp} aria-hidden="true">
              <div className={styles.scrollCueIcon} />
            </motion.div>
          </motion.section>

          {/* Zigzag 1: Waitlist (left) → How it works + visual (right) */}
          <motion.section
            className={`${styles.sectionSpace} ${styles.zigzagRow}`}
            initial="initial"
            whileInView="animate"
            viewport={viewportScroll}
            variants={stagger}
          >
            <motion.div className={styles.zigzagContent} variants={fadeLeft}>
              <h2 className={styles.sectionTitle}>Join the waitlist</h2>
              <p className={styles.sectionSub}>
                Request access as a founder or investor. Our team reviews each request to keep the community trusted and intentional. Once approved, you can log in and complete your profile.
              </p>
              <div className={styles.ctaGroup}>
                <Link href="/signup/founder"><button className="btn">Join as Founder</button></Link>
                <Link href="/signup/investor"><button className="btn" style={{ background: '#fff', color: 'var(--orange)', border: '1px solid var(--orange)' }}>Join as Investor</button></Link>
                <Link href="/login"><button className="btn" style={{ background: 'transparent', color: 'var(--dark)' }}>Log in</button></Link>
              </div>
              <p className={styles.disclaimer}>
                Community access is by approval only. Joining the waitlist does not guarantee access. We may contact you by email before approving. This helps us protect our members and maintain a faith-aligned, intentional space.
              </p>
            </motion.div>
            <motion.div className={styles.zigzagVisual} variants={fadeRight}>
              <div className={styles.card}>
                <h3 className={styles.sectionTitle} style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>How it works</h3>
                <ul className={styles.howList}>
                  <li>Request access as founder or investor.</li>
                  <li>After approval, complete your profile and connect.</li>
                  <li>Community, events, and channels open once you&apos;re in.</li>
                </ul>
              </div>
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Image src="/images/Mango tree-pana.svg" alt="Mango Tree" width={220} height={220} priority />
              </div>
            </motion.div>
          </motion.section>

          {/* Testimonials: scroll-triggered */}
          <motion.section
            className={`${styles.testimonials} ${styles.sectionSpaceLg}`}
            initial="initial"
            whileInView="animate"
            viewport={viewportScroll}
            variants={stagger}
          >
            <motion.h2 className={styles.testimonialsTitle} variants={fadeUp}>What our users say</motion.h2>
            {testimonials.length === 0 ? (
              <motion.p className="small" style={{ color: 'var(--muted)', textAlign: 'center' }} variants={fadeUp}>
                No testimonials yet. Admins can add them from the Django admin.
              </motion.p>
            ) : (
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
                {testimonials.map((t) => (
                  <motion.div key={t.id} className={styles.testimonialCard} variants={fadeUp}>
                    <p>{t.quote}</p>
                    <span>— {t.author_name}{t.role ? `, ${t.role}` : ''}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>

          {/* Newsletter: scroll-triggered */}
          <motion.section
            className={`${styles.sectionSpace} ${styles.newsletterWrap}`}
            initial="initial"
            whileInView="animate"
            viewport={viewportScrollSoft}
            variants={stagger}
          >
            <motion.div className={styles.cardLg} variants={fadeUp}>
              <h2 className={styles.sectionTitle} style={{ textAlign: 'center' }}>Newsletter</h2>
              <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 16 }}>The latest news about By the Fruit in your inbox? Sign me up!</p>
              <form onSubmit={handleNewsletterSubmit} className="form" style={{ marginTop: 12, textAlign: 'left' }}>
                <label>
                  Your email
                  <input type="email" value={newsletterEmail} onChange={e => setNewsletterEmail(e.target.value)} placeholder="you@example.com" required style={{ width: '100%' }} />
                </label>
                <label>
                  Message (optional)
                  <textarea value={newsletterMessage} onChange={e => setNewsletterMessage(e.target.value)} rows={3} placeholder="Questions or feedback..." style={{ width: '100%' }} />
                </label>
                <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={newsletterAgree} onChange={e => setNewsletterAgree(e.target.checked)} required />
                  <span>I agree to receive updates</span>
                </label>
                <button className="btn" type="submit" disabled={newsletterStatus === 'sending' || !newsletterAgree}>
                  {newsletterStatus === 'sending' ? 'Sending…' : newsletterStatus === 'sent' ? 'Sent!' : 'Send'}
                </button>
                {newsletterStatus === 'error' && <p className="error" style={{ marginTop: 8 }}>Something went wrong. Try again.</p>}
              </form>
            </motion.div>
          </motion.section>

          <footer className={`small ${styles.footer}`}>
            Short. Clean. Actionable. — By The Fruit
            <div className={styles.footerLinks}>
              <a href="https://twitter.com/yourprofile" target="_blank" rel="noopener" style={{ margin: '0 8px' }}>Twitter</a>
              <a href="https://facebook.com/yourprofile" target="_blank" rel="noopener" style={{ margin: '0 8px' }}>Facebook</a>
              <a href="https://linkedin.com/company/yourprofile" target="_blank" rel="noopener" style={{ margin: '0 8px' }}>LinkedIn</a>
            </div>
          </footer>
        </div>
      </main>
    </>
  )
}
