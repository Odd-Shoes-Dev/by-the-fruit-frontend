import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import styles from '../styles/Home.module.css'
import { useEffect, useState } from 'react'
import { getToken, isAdmin, isApproved, apiFetch } from '../lib/api'
import { FiUsers, FiUserCheck, FiVideo } from 'react-icons/fi'

const viewport = { once: true, amount: 0.1 }
const fadeUp = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
const stagger = { initial: {}, animate: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } }

const VALUES = [
  { Icon: FiUsers,     title: 'Faith-aligned community',  text: 'A vetted network built on radical hospitality, shared values, and the conviction that business can redeem culture.' },
  { Icon: FiUserCheck, title: 'Trusted connections',        text: 'Every member is reviewed by our team. Every connection is intentional. No noise — just the right people.' },
  { Icon: FiVideo,     title: 'Live pitch competitions',    text: 'Admin-organised pitch events open to the whole community. Watch live, register as a founder, or invest.' },
]

const STEPS = [
  { n: '01', title: 'Request access', text: 'Sign up and tell us whether you\'re joining as a founder or an investor. Our team reviews each request.' },
  { n: '02', title: 'Get approved', text: 'Once approved you\'ll receive an email. Complete your profile so the community can find and evaluate you.' },
  { n: '03', title: 'Connect & pitch', text: 'Access the feed, channels, live competitions, and investment deals. Build relationships that last.' },
]

export default function Home() {
  const [token, setToken] = useState(false)
  const [approved, setApproved] = useState(false)
  const [testimonials, setTestimonials] = useState([])
  const [newsletterStatus, setNewsletterStatus] = useState('')
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterMessage, setNewsletterMessage] = useState('')
  const [newsletterAgree, setNewsletterAgree] = useState(false)

  useEffect(() => {
    setToken(!!getToken())
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
        body: JSON.stringify({ email: newsletterEmail.trim(), message: newsletterMessage.trim() || 'Newsletter signup' })
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
        <meta name="description" content="A faith-aligned platform connecting founders and investors in media, tech, and entertainment." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className={styles.main}>

        {/* ── Hero ────────────────────────────────────────────────────── */}
        <section className={styles.hero} aria-label="Hero">
          <div className={styles.heroOverlay} aria-hidden="true" />

          {/* Navbar inside hero */}
          <nav className={styles.heroNav}>
            <Link href="/" className={styles.heroNavBrand}>
              <Image src="/images/logo.png" alt="By The Fruit" width={38} height={38} className={styles.heroNavLogo} priority />
              <span className={styles.heroNavName}>By The Fruit</span>
            </Link>
            <div className={styles.heroNavActions}>
              {token && !approved && (
                <Link href="/pending" className={styles.btnOutline}>Pending request</Link>
              )}
              {token && approved && (
                <Link href="/community" className={styles.btnPrimary}>Go to app →</Link>
              )}
              {!token && (
                <>
                  <Link href="/login" className={styles.btnOutline}>Log in</Link>
                  <Link href="/signup" className={styles.btnPrimary}>Join waitlist</Link>
                </>
              )}
            </div>
          </nav>

          {/* Hero copy */}
          <motion.div
            className={styles.heroBody}
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <div className={styles.heroInner}>
              <motion.span className={styles.heroEyebrow} variants={fadeUp}>
                Faith · Innovation · Covenant
              </motion.span>
              <motion.h1 className={styles.heroHeadline} variants={fadeUp}>
                Where innovation meets{' '}
                <span className={styles.heroHighlight}>covenant investment.</span>
              </motion.h1>
              <motion.p className={styles.heroSub} variants={fadeUp}>
                By The Fruit connects faith-aligned founders with investors who believe business can redeem culture — starting with media, tech, and entertainment.
              </motion.p>
              {!token && (
                <motion.div className={styles.heroCta} variants={fadeUp}>
                  <Link href="/signup?role=founder" className={styles.btnPrimary}>Join as Founder →</Link>
                  <Link href="/signup?role=investor" className={styles.btnOutline}>Join as Investor</Link>
                </motion.div>
              )}
              {!token && (
                <motion.p className={styles.heroLoginNote} variants={fadeUp}>
                  Already have an account?{' '}
                  <Link href="/login">Log in</Link>
                </motion.p>
              )}
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <div className={styles.heroScroll} aria-hidden="true">
            <div className={styles.heroScrollDot} />
            <span>Scroll</span>
          </div>
        </section>

        <div className={styles.contentWrap}>

          {/* ── Value props ───────────────────────────────────────────── */}
          <motion.section
            className={styles.sectionSpace}
            initial="initial"
            whileInView="animate"
            viewport={viewport}
            variants={stagger}
          >
            <motion.div className={`${styles.centeredLabel}`} variants={fadeUp}>
              <span className={styles.sectionEyebrow}>Why By The Fruit</span>
              <h2 className={styles.sectionTitle}>Built for purpose, not just profit</h2>
              <p className={styles.sectionSub}>
                A community where every seat at the table matters — from first-time founders to seasoned investors.
              </p>
            </motion.div>
            <div className={styles.valueStrip}>
              {VALUES.map((v, i) => (
                <motion.div key={i} className={styles.valueCard} variants={fadeUp}>
                  <v.Icon className={styles.valueIcon} aria-hidden="true" />
                  <h3 className={styles.valueTitle}>{v.title}</h3>
                  <p className={styles.valueText}>{v.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* ── Who it's for ──────────────────────────────────────────── */}
          <motion.section
            className={styles.sectionSpace}
            style={{ paddingTop: 0 }}
            initial="initial"
            whileInView="animate"
            viewport={viewport}
            variants={stagger}
          >
            <motion.div className={styles.centeredLabel} variants={fadeUp}>
              <span className={styles.sectionEyebrow}>Who it's for</span>
              <h2 className={styles.sectionTitle}>Pick your path</h2>
            </motion.div>
            <div className={styles.audienceGrid}>
              <motion.div className={`${styles.audienceCard} ${styles.audienceCardFounder}`} variants={fadeUp}>
                <span className={`${styles.audienceBadge} ${styles.audienceBadgeFounder}`}>For Founders</span>
                <h3 className={styles.audienceTitle}>Raise with purpose</h3>
                <p className={styles.audienceSub}>
                  Pitch your idea to investors who are aligned with your values. Get funded by people who believe in what you're building.
                </p>
                <ul className={styles.audienceList}>
                  <li>Showcase your business and milestones</li>
                  <li>Pitch live in admin-organised competitions</li>
                  <li>Connect directly with interested investors</li>
                  <li>Access channels, events and a trusted network</li>
                </ul>
                <Link href="/signup?role=founder" className={styles.btnTeal}>Join as Founder →</Link>
              </motion.div>

              <motion.div className={`${styles.audienceCard} ${styles.audienceCardInvestor}`} variants={fadeUp}>
                <span className={`${styles.audienceBadge} ${styles.audienceBadgeInvestor}`}>For Investors</span>
                <h3 className={styles.audienceTitle}>Invest with conviction</h3>
                <p className={styles.audienceSub}>
                  Discover vetted founders building in media, tech and entertainment — all aligned with faith and redemptive values.
                </p>
                <ul className={styles.audienceList}>
                  <li>Browse investment-ready founder profiles</li>
                  <li>Watch live and recorded pitch competitions</li>
                  <li>Set investment preferences and deal size</li>
                  <li>Engage with founders through channels and DMs</li>
                </ul>
                <Link href="/signup?role=investor" className={styles.btnPrimary}>Join as Investor →</Link>
              </motion.div>
            </div>

            <motion.p className={styles.disclaimer} variants={fadeUp}>
              Community access is by approval only. Joining the waitlist does not guarantee access. We review each request to protect our members and maintain a faith-aligned, intentional space.
            </motion.p>
          </motion.section>

          {/* ── How it works ──────────────────────────────────────────── */}
          <motion.section
            className={styles.sectionSpace}
            style={{ paddingTop: 0 }}
            initial="initial"
            whileInView="animate"
            viewport={viewport}
            variants={stagger}
          >
            <motion.div className={styles.centeredLabel} variants={fadeUp}>
              <span className={styles.sectionEyebrow}>Getting started</span>
              <h2 className={styles.sectionTitle}>How it works</h2>
            </motion.div>
            <div className={styles.stepsGrid}>
              {STEPS.map((s, i) => (
                <motion.div key={i} className={styles.stepCard} variants={fadeUp}>
                  <span className={styles.stepNum}>{s.n}</span>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepText}>{s.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

        </div>{/* end contentWrap */}

        {/* ── Testimonials ──────────────────────────────────────────── */}
        {testimonials.length > 0 && (
          <motion.section
            className={styles.testimonialsWrap}
            initial="initial"
            whileInView="animate"
            viewport={viewport}
            variants={stagger}
          >
            <div className={styles.testimonialsGrid}>
              <motion.h2 className={styles.testimonialsTitle} variants={fadeUp}>
                What our community says
              </motion.h2>
              <div className={styles.testimonialCards}>
                {testimonials.map(t => (
                  <motion.div key={t.id} className={styles.testimonialCard} variants={fadeUp}>
                    <div className={styles.testimonialQuoteMark}>&ldquo;</div>
                    <p className={styles.testimonialQuote}>{t.quote}</p>
                    <span className={styles.testimonialAuthor}>
                      — {t.author_name}{t.role ? `, ${t.role}` : ''}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        <div className={styles.contentWrap}>

          {/* ── Newsletter ────────────────────────────────────────────── */}
          <motion.section
            className={styles.sectionSpace}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.06 }}
            variants={stagger}
          >
            <div className={styles.newsletterWrap}>
              <motion.h2 className={styles.sectionTitle} style={{ textAlign: 'center', marginBottom: '0.5rem' }} variants={fadeUp}>
                Stay in the loop
              </motion.h2>
              <motion.p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: '1.75rem', fontSize: '0.97rem' }} variants={fadeUp}>
                Get the latest news about By The Fruit straight to your inbox.
              </motion.p>
              <motion.div className={styles.cardLg} variants={fadeUp}>
                {newsletterStatus === 'sent' ? (
                  <p className={styles.formSuccess}>✓ You're on the list — we'll be in touch!</p>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className={styles.formStack}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="nl-email">Your email</label>
                      <input
                        id="nl-email"
                        type="email"
                        className={styles.formInput}
                        value={newsletterEmail}
                        onChange={e => setNewsletterEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="nl-msg">Message <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
                      <textarea
                        id="nl-msg"
                        className={`${styles.formInput} ${styles.formTextarea}`}
                        value={newsletterMessage}
                        onChange={e => setNewsletterMessage(e.target.value)}
                        rows={3}
                        placeholder="Questions or feedback..."
                      />
                    </div>
                    <label className={styles.formCheckLabel}>
                      <input
                        type="checkbox"
                        checked={newsletterAgree}
                        onChange={e => setNewsletterAgree(e.target.checked)}
                        required
                      />
                      I agree to receive updates from By The Fruit
                    </label>
                    <button
                      type="submit"
                      className={styles.btnSubmit}
                      disabled={newsletterStatus === 'sending' || !newsletterAgree}
                    >
                      {newsletterStatus === 'sending' ? 'Sending…' : 'Subscribe'}
                    </button>
                    {newsletterStatus === 'error' && (
                      <p className={styles.formError}>Something went wrong. Please try again.</p>
                    )}
                  </form>
                )}
              </motion.div>
            </div>
          </motion.section>

        </div>{/* end contentWrap */}

        {/* ── Footer ───────────────────────────────────────────────── */}
        <footer className={styles.footer}>
          <div className={styles.footerOverlay} aria-hidden="true" />
          <div className={styles.footerInner}>
            <div className={styles.footerBrand}>
              <span className={styles.footerBrandName}>By The Fruit</span>
              <p className={styles.footerTagline}>
                Investing in innovation with clarity, care, and covenant.
              </p>
            </div>
            <div className={styles.footerCol}>
              <span className={styles.footerColTitle}>Platform</span>
              <Link href="/signup" className={styles.footerLink}>Join the waitlist</Link>
              <Link href="/login" className={styles.footerLink}>Log in</Link>
              <Link href="/signup?role=founder" className={styles.footerLink}>For Founders</Link>
              <Link href="/signup?role=investor" className={styles.footerLink}>For Investors</Link>
            </div>
            <div className={styles.footerCol}>
              <span className={styles.footerColTitle}>Company</span>
              <a href="mailto:hello@bythefruit.com" className={styles.footerLink}>Contact us</a>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>© {new Date().getFullYear()} By The Fruit. All rights reserved.</span>
            <div className={styles.footerSocial}>
              <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer">Twitter</a>
              <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href="https://linkedin.com/company/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            </div>
          </div>
        </footer>

      </main>
    </>
  )
}
