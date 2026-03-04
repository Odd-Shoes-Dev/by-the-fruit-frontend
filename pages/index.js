import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/Home.module.css'
import { useEffect, useRef, useState } from 'react'
import { getToken, isApproved, apiFetch } from '../lib/api'
import FluffyButton from '../components/FluffyButton'
import {
  IconSprout, IconTree, IconApple,
  IconMedia, IconTech, IconEntertainment,
  IconDollar, IconInfinity, IconLeaf, IconStar,
} from '../components/BrandIcons'

const STEPS = [
  {
    n: '01',
    ico: <IconSprout size={28} />,
    title: 'Share Your Story',
    text: 'Founders share their mission and empty chairs. Investors share their gifts and expertise. No pitch decks required upfront.',
  },
  {
    n: '02',
    ico: <IconTree size={28} />,
    title: 'The Orchard Matches',
    text: 'Our alignment engine maps founder needs to investor gifts — skills, domains, stage fit, and capital range.',
  },
  {
    n: '03',
    ico: <IconApple size={28} />,
    title: 'Come to the Table',
    text: 'Curated introductions lead to genuine conversation. No cold outreach. Every connection is intentional.',
  },
]

const PILLARS = [
  {
    dot: <IconDollar size={16} />,
    title: 'Redemptive Capital',
    text: 'Investments measured not just by ROI, but by their capacity to restore, renew, and rebuild communities.',
  },
  {
    dot: <IconInfinity size={16} />,
    title: 'Radical Hospitality',
    text: 'Every founder has an empty chair at their table. We help fill it with the right gifts — wisdom, networks, and operational support.',
  },
  {
    dot: <IconLeaf size={16} />,
    title: 'Ecosystem Growth',
    text: "We don't just fund companies. We cultivate an orchard where ventures cross-pollinate, share roots, and bear fruit together.",
  },
  {
    dot: <IconStar size={16} />,
    title: 'Founder-First Philosophy',
    text: "Transparent terms, no dark patterns, no predatory structures. The founder's mission is the north star.",
  },
]

export default function Home() {
  const [token, setToken] = useState(false)
  const [approved, setApproved] = useState(false)
  const [testimonials, setTestimonials] = useState([])
  const [newsletterStatus, setNewsletterStatus] = useState('')
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterMessage, setNewsletterMessage] = useState('')
  const [newsletterAgree, setNewsletterAgree] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [navVisible, setNavVisible] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setToken(!!getToken())
    setApproved(isApproved())
    // Scroll to top on page load and disable browser scroll restoration
    window.scrollTo(0, 0)
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    let prevScroll = 0
    const onScroll = () => {
      const currentScroll = window.scrollY
      setScrolled(currentScroll > 20)
      // Hide nav when scrolling down, show when scrolling up
      if (currentScroll > prevScroll && currentScroll > 100) {
        setNavVisible(false)
      } else {
        setNavVisible(true)
      }
      prevScroll = currentScroll
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Fade-up on scroll
  useEffect(() => {
    const els = document.querySelectorAll('.' + styles.fadeUp)
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add(styles.fadeUpVisible)
      })
    }, { threshold: 0.12 })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
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
        body: JSON.stringify({
          email: newsletterEmail.trim(),
          message: newsletterMessage.trim() || 'Newsletter signup',
        }),
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

      <div className={styles.main}>

        {/* ── NAV ─────────────────────────────────────────────────── */}
        <nav className={`${styles.nav}${scrolled ? ' ' + styles.navScrolled : ''}${!navVisible ? ' ' + styles.navHidden : ''}`}>
          <a href="/" className={styles.navLogo}>
            <img src="/images/logo.png" alt="By The Fruit" />
            <span className={styles.navBrandName}>By The Fruit</span>
          </a>

          <ul className={styles.navLinks}>
            <li><a href="#vision">The Vision</a></li>
            <li><a href="#how">How It Works</a></li>
            <li><a href="#sectors">Sectors</a></li>
            <li><a href="#manifesto">Manifesto</a></li>
          </ul>

          <div className={styles.navCta}>
            {token && approved ? (
              <a href="/community" className={styles.navPrimaryBtn}>Dashboard</a>
            ) : token ? (
              <a href="/pending" className={styles.navPrimaryBtn}>Pending Approval</a>
            ) : (
              <FluffyButton
                href="/login"
                label="Log in"
                width={140}
                height={44}
                strands={800}
                strandLen={6}
                fontSize={14}
                color="#F5A623"
              />
            )}
          </div>

          {/* Hamburger — mobile only */}
          <button
            className={`${styles.hamburger}${menuOpen ? ' ' + styles.hamburgerOpen : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <span /><span /><span />
          </button>
        </nav>

        {/* ── MOBILE MENU ─────────────────────────────────────────── */}
        {menuOpen && (
          <div className={styles.mobileMenu}>
            <a href="#vision"  className={styles.mobileLink} onClick={() => setMenuOpen(false)}>The Vision</a>
            <a href="#how"     className={styles.mobileLink} onClick={() => setMenuOpen(false)}>How It Works</a>
            <a href="#sectors" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Sectors</a>
            <a href="#manifesto" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Manifesto</a>
            <div className={styles.mobileDivider} />
            {token && approved ? (
              <a href="/community" className={styles.mobilePrimaryBtn}>Dashboard</a>
            ) : token ? (
              <a href="/pending" className={styles.mobilePrimaryBtn}>Pending Approval</a>
            ) : (
              <FluffyButton
                href="/login"
                label="Log in"
                width={140}
                height={44}
                strands={800}
                strandLen={6}
                fontSize={14}
                color="#F5A623"
              />
            )}
          </div>
        )}

        {/* ── HERO ────────────────────────────────────────────────── */}
        <section className={styles.hero} id="vision">
          <div className={styles.heroEyebrow}><img src="/images/logo.png" alt="By The Fruit" style={{ width: 22, height: 22, objectFit: 'contain', verticalAlign: 'middle', marginRight: 6 }} /> Redemptive Tech Investing</div>

          <h1 className={styles.heroH1}>
            Investing in Innovation.<br />
            <em>Known by its Fruit.</em>
          </h1>

          <p className={styles.heroSub}>
            The Venture Capital system is broken. We&apos;re fixing it through radical
            hospitality, decentralized power, and capital that acts as an advocate—not just a check.
          </p>

          <div className={styles.heroCtas}>
            <FluffyButton
              href="/signup?role=founder"
              label="I have a Project to Fund →"
              width={240}
              height={52}
              strands={1000}
              strandLen={8}
              fontSize={16}
              color="#F5A623"
            />

            <FluffyButton
              href={token && approved ? '/deals' : '/signup?role=investor'}
              label="Join the Investor Collective →"
              width={240}
              height={52}
              strands={950}
              strandLen={8}
              fontSize={16}
              color="#4F6BD9"
            />
          </div>
        </section>

        {/* ── SECTORS STRIP ───────────────────────────────────────── */}
        <div className={styles.statsStrip} id="sectors">
          <div className={styles.statCell}>
            <div className={styles.statNum}><IconMedia size={36} /></div>
            <p className={styles.statLbl}>Media</p>
          </div>
          <div className={styles.statCell}>
            <div className={styles.statNum}><IconTech size={36} /></div>
            <p className={styles.statLbl}>Tech</p>
          </div>
          <div className={styles.statCell}>
            <div className={styles.statNum}><IconEntertainment size={36} /></div>
            <p className={styles.statLbl}>Entertainment</p>
          </div>
        </div>

        <div className={styles.hdiv} />

        {/* ── THE PROBLEM ─────────────────────────────────────────── */}
        <div className={styles.section}>
          <div className={styles.secLabel}>The Problem</div>
          <h2 className={styles.sectionH2}><em>Systemic Tension</em></h2>
          <p className={styles.secDesc} style={{ fontStyle: 'italic', maxWidth: 680 }}>
            &ldquo;Companies stay private longer. Liquidity is locked. Minimums are sky-high. The bridge
            between those who build and those who believe is crumbling.&rdquo;
          </p>

          <div className={styles.stepsGrid}>
            <div className={`${styles.stepCard} ${styles.fadeUp}`}>
              <h3 className={styles.stepCardH3}>The Locked Table</h3>
              <p className={styles.stepCardP}>High barriers to entry keep brilliant minds away from the table. Companies stay private longer. Liquidity is locked. Minimums are sky-high.</p>
            </div>
            <div className={`${styles.stepCard} ${styles.fadeUp}`}>
              <h3 className={styles.stepCardH3}>The Bridge is Crumbling</h3>
              <p className={styles.stepCardP}>The connection between those who build and those who believe is breaking down. The traditional VC model leaves too many out.</p>
            </div>
            <div className={`${styles.stepCard} ${styles.fadeUp}`}>
              <h3 className={styles.stepCardH3}>Transactional vs. Transformational</h3>
              <p className={styles.stepCardP}>&apos;Capital In, Returns Out.&apos; We believe in &apos;Gifts In, Growth Out.&apos; True value comes from aligned relationships, not just transactions.</p>
            </div>
          </div>
        </div>

        <div className={styles.hdiv} />

        {/* ── THE VISION ──────────────────────────────────────────── */}
        <div className={styles.section} id="vision">
          <div className={styles.secLabel}>The Vision</div>
          <h2 className={styles.sectionH2}>A <em>Redemptive Ecosystem</em></h2>
          <p className={styles.secDesc}>What if funding mechanics were designed to align both sides of the table?</p>
          <p className={styles.secDesc} style={{ maxWidth: 680, marginTop: '1rem' }}>
            We curate a space where investors aren&apos;t just line items on a cap table. They are partners
            who bring more than capital—they bring their gifts, expertise, and commitment to the mission.
          </p>

          <div className={styles.stepsGrid} style={{ marginTop: '2.5rem' }}>
            <div className={`${styles.stepCard} ${styles.fadeUp}`}>
              <span className={styles.stepIco}><IconMedia size={28} /></span>
              <h3 className={styles.stepCardH3}>Evangelists</h3>
              <p className={styles.stepCardP}>Spreading the mission and amplifying the voices of founders building redemptive ventures.</p>
            </div>
            <div className={`${styles.stepCard} ${styles.fadeUp}`}>
              <span className={styles.stepIco}><IconLeaf size={28} /></span>
              <h3 className={styles.stepCardH3}>Fractional Operators</h3>
              <p className={styles.stepCardP}>Applying their God-given gifts to serve and strengthen the ventures they believe in.</p>
            </div>
            <div className={`${styles.stepCard} ${styles.fadeUp}`}>
              <span className={styles.stepIco}><IconDollar size={28} /></span>
              <h3 className={styles.stepCardH3}>Strategic Partners</h3>
              <p className={styles.stepCardP}>Ensuring the roots are healthy so the fruit is sweet. True partnership, not just capital.</p>
            </div>
          </div>
        </div>

        <div className={styles.hdiv} />

        {/* ── HOW IT WORKS ────────────────────────────────────────── */}
        <div className={styles.section} id="how">
          <div className={styles.secLabel}>How It Works</div>
          <h2 className={styles.sectionH2}>From <em>Seed</em> to Harvest</h2>

          <div className={styles.stepsGrid}>
            {STEPS.map(s => (
              <div className={`${styles.stepCard} ${styles.fadeUp}`} key={s.n}>
                <div className={styles.stepNum}>{s.n}</div>
                <span className={styles.stepIco}>{s.ico}</span>
                <h3 className={styles.stepCardH3}>{s.title}</h3>
                <p className={styles.stepCardP}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.hdiv} />

        {/* ── MANIFESTO ───────────────────────────────────────────── */}
        <div id="manifesto">
          <div className={styles.manifestoBlock}>
            <div>
              <div className={styles.secLabel}>The Redemptive Tech Manifesto</div>
              <h2 className={styles.manifestoH2}>
                A table set for <em>everyone</em>
              </h2>
              <blockquote className={styles.manifestoQuote}>
                &ldquo;Something amazing happens when we operate in our God-given gifts as a collective whole.&rdquo;
              </blockquote>
              <p style={{ marginTop: '1.25rem', lineHeight: 1.75, color: 'var(--text-mid, #5C637E)', maxWidth: 560 }}>
                We are decentralizing the power of who and what gets funded—and why. By aligning capital
                with calling, we&apos;re building an ecosystem where every venture is strengthened not just by
                funding, but by the collective gifts of those who believe in it.
              </p>
            </div>

            <div className={styles.manifestoPillars}>
              {PILLARS.map(p => (
                <div className={styles.pillar} key={p.title}>
                  <div className={styles.pillarDot}>{p.dot}</div>
                  <div className={styles.pillarTxt}>
                    <span className={styles.pillarTxtStrong}>{p.title}</span>
                    <span className={styles.pillarTxtSpan}>{p.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TESTIMONIALS (if any) ────────────────────────────────── */}
        {testimonials.length > 0 && (
          <>
            <div className={styles.hdiv} />
            <div className={styles.section}>
              <div className={styles.secLabel}>Community Voices</div>
              <h2 className={styles.sectionH2}>What Members <em>Say.</em></h2>
              <div className={styles.stepsGrid}>
                {testimonials.slice(0, 3).map((t, i) => (
                  <div className={`${styles.sectorCard} ${styles.fadeUp}`} key={i}>
                    <p className={styles.sectorCardP} style={{ lineHeight: 1.75, fontStyle: 'italic', marginBottom: 16 }}>
                      &ldquo;{t.content || t.text || t.quote}&rdquo;
                    </p>
                    <span className={styles.pillarTxtStrong} style={{ fontSize: '.82rem', opacity: .7 }}>
                      — {t.author || t.name || 'Community Member'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── NEWSLETTER ──────────────────────────────────────────── */}
        <div className={styles.newsletterSection}>
          <div className={styles.newsletterInner}>
            <div className={styles.newsletterGrid}>
              <div>
                <div className={styles.secLabel}>Stay Updated on the Harvest</div>
                <h2 className={styles.newsletterLeftH2}>
                  Stay Updated on the <em>Harvest</em>
                </h2>
                <p className={styles.newsletterLeftP}>
                  Join our newsletter for curated insights, founder stories, and investment opportunities.
                </p>
              </div>

              <form className={styles.formStack} onSubmit={handleNewsletterSubmit}>
                {newsletterStatus === 'sent' ? (
                  <div className={styles.formSuccess}>
                    You&apos;re in. Welcome to the orchard.
                  </div>
                ) : (
                  <>
                    <div className={styles.formGroup}>
                      <input
                        id="nl-email"
                        type="email"
                        className={styles.formInput}
                        placeholder="Enter your email"
                        value={newsletterEmail}
                        onChange={e => setNewsletterEmail(e.target.value)}
                        required
                      />
                    </div>
                    {newsletterStatus === 'error' && (
                      <div className={styles.formError}>Something went wrong. Please try again.</div>
                    )}
                    <FluffyButton 
                      type="submit"
                      label={newsletterStatus === 'sending' ? 'Subscribing…' : 'Subscribe'}
                      disabled={newsletterStatus === 'sending' || !newsletterEmail}
                      fullWidth
                      height={48}
                      strands={1200}
                      strandLen={8}
                      fontSize={15}
                      color="#F5A623"
                    />
                  </>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* ── CTA BLOCK ───────────────────────────────────────────── */}
        <div className={styles.ctaWrap}>
          <div className={`${styles.ctaBlock} ${styles.fadeUp}`}>
            <div className={styles.ctaSecLabel}>A Table Set For Everyone</div>
            <h2 className={styles.ctaH2}>
              Known by its <em>Fruit.</em>
            </h2>
            <p className={styles.ctaP}>
              The Venture Capital system is broken. We&apos;re fixing it through radical hospitality,
              decentralized power, and capital that acts as an advocate—not just a check.
            </p>
            <div className={styles.ctaButtons}>
              <FluffyButton
                href='/signup?role=founder'
                label="I have a Project to Fund"
                width={220}
                height={52}
                strands={1000}
                strandLen={8}
                fontSize={16}
                color="#F5A623"
              />
              <FluffyButton
                href={token && approved ? '/deals' : '/signup?role=investor'}
                label="Join the Investor Collective →"
                width={240}
                height={52}
                strands={950}
                strandLen={8}
                fontSize={16}
                color="#4F6BD9"
              />
            </div>
          </div>
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────── */}
        <footer className={styles.footer}>
          <div className={styles.footBrandWrap}>
            <div className={styles.footBrand}>
              <img src="/images/logo.png" alt="By The Fruit" />
            </div>
            <div className={styles.footSub}>bythefruit.com · © {new Date().getFullYear()} By the Fruit</div>
          </div>

          <div className={styles.footLinks}>
            <a href="#vision">The Vision</a>
            <a href="#how">How It Works</a>
            <a href="#manifesto">Manifesto</a>
            {token ? (
              <Link href="/community">Dashboard</Link>
            ) : (
              <Link href="/login">Log in</Link>
            )}
          </div>

          <div className={styles.footTagline}>Redemptive Tech Investing</div>
        </footer>

      </div>
    </>
  )
}
