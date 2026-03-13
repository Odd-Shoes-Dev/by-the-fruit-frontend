import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/Home.module.css'
import React, { useEffect, useRef, useState } from 'react'
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
  const [sections, setSections] = useState({})
  const [sectionOrder, setSectionOrder] = useState(['problem', 'vision', 'how_it_works', 'manifesto', 'newsletter', 'cta'])

  // Lock body scroll when the mobile menu is open (prevents page scrolling behind it)
  useEffect(() => {
    if (typeof document === 'undefined') return
    const body = document.body
    const html = document.documentElement
    if (menuOpen) {
      // Disable scrolling without changing layout
      body.style.overflow = 'hidden'
      html.style.overflow = 'hidden'
    } else {
      // Re-enable scrolling
      body.style.overflow = ''
      html.style.overflow = ''
    }
    return () => {
      body.style.overflow = ''
      html.style.overflow = ''
    }
  }, [menuOpen])

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

  // Fetch CMS landing sections
  useEffect(() => {
    let mounted = true
    apiFetch('/api/landing-sections/')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!mounted || !data) return
        const list = Array.isArray(data) ? data : (data.results || [])
        const map = {}
        list.forEach(s => { map[s.key] = s })
        setSections(map)
        // Derive render order from API, excluding hero which is always first
        const sorted = [...list]
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map(s => s.key)
          .filter(k => k !== 'hero')
        if (sorted.length > 0) setSectionOrder(sorted)
      })
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

  // CMS helpers — sec(key) returns section data, vis(key) = true unless admin hid it
  const sec = (key) => sections[key] || null
  const vis = (key) => sec(key) ? sec(key).is_visible !== false : true

  // CMS-driven items with hard-coded fallbacks
  const cmsSteps = sec('how_it_works')?.items?.length
    ? sec('how_it_works').items.map((item, i) => ({ ...STEPS[i], ...item, ico: STEPS[i]?.ico }))
    : STEPS
  const cmsPillars = sec('manifesto')?.items?.length
    ? sec('manifesto').items.map((item, i) => ({ ...PILLARS[i], ...item, dot: PILLARS[i]?.dot }))
    : PILLARS

  return (
    <>
      <Head>
        <title>By The Fruit — Redemptive Tech Investing</title>
        <meta name="description" content="A faith-aligned platform connecting founders and investors in media, tech, and entertainment. Know them by their fruit." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="faith-based investing, Christian investors, founders, media investing, tech investing, entertainment funding, redemptive capital" />
        <link rel="canonical" href="https://bythefruit.com/" />

        {/* ── Open Graph ─────────────────────────────────────────── */}
        <meta property="og:title" content="By The Fruit — Redemptive Tech Investing" />
        <meta property="og:description" content="A faith-aligned platform connecting founders and investors in media, tech, and entertainment. Know them by their fruit." />
        <meta property="og:url" content="https://bythefruit.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://bythefruit.com/images/logo.png" />
        <meta property="og:image:alt" content="By The Fruit logo" />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />

        {/* ── Twitter / X Card ────────────────────────────────────── */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="By The Fruit — Redemptive Tech Investing" />
        <meta name="twitter:description" content="A faith-aligned platform connecting founders and investors in media, tech, and entertainment." />
        <meta name="twitter:image" content="https://bythefruit.com/images/logo.png" />
        <meta name="twitter:image:alt" content="By The Fruit logo" />

        {/* ── Landing page is public — allow indexing ─────────────── */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
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
              <FluffyButton
                href="/community"
                label="Dashboard"
                width={110}
                height={38}
                strands={700}
                strandLen={6}
                fontSize={12}
                color="#F5A623"
              />
            ) : token ? (
              <FluffyButton
                href="/pending"
                label="Pending Approval"
                width={180}
                height={44}
                strands={800}
                strandLen={6}
                fontSize={14}
                color="#F5A623"
              />
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
              <FluffyButton
                href="/community"
                label="Dashboard"
                width={110}
                height={38}
                strands={700}
                strandLen={6}
                fontSize={12}
                color="#F5A623"
              />
            ) : token ? (
              <FluffyButton
                href="/pending"
                label="Pending Approval"
                width={180}
                height={44}
                strands={800}
                strandLen={6}
                fontSize={14}
                color="#F5A623"
              />
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
        {vis('hero') && (
        <section className={styles.hero} id="vision">
          <div className={styles.heroEyebrow}><img src="/images/logo.png" alt="By The Fruit" style={{ width: 22, height: 22, objectFit: 'contain', verticalAlign: 'middle', marginRight: 6 }} /> {sec('hero')?.subtitle || 'Redemptive Tech Investing'}</div>

          <h1 className={styles.heroH1}>
            {(sec('hero')?.title || 'Investing in Innovation.\nKnown by its Fruit.').split('\n')[0]}<br />
            <span className={styles.heroH1Orange}>{(sec('hero')?.title || 'Investing in Innovation.\nKnown by its Fruit.').split('\n')[1] || 'Known by its Fruit.'}</span>
          </h1>

          <p className={styles.heroSub}>
            {sec('hero')?.body || "The Venture Capital system is broken. We're fixing it through radical hospitality, decentralized power, and capital that acts as an advocate—not just a check."}
          </p>

          <div className={styles.heroCtas}>
            <FluffyButton
              href={sec('hero')?.cta_primary_link || '/signup?role=founder'}
              label={sec('hero')?.cta_primary_text || 'Submit a Company →'}
              width={240}
              height={52}
              strands={1000}
              strandLen={8}
              fontSize={16}
              color="#F5A623"
            />

            <FluffyButton
              href={token && approved ? '/deals' : (sec('hero')?.cta_secondary_link || '/signup?role=investor')}
              label={sec('hero')?.cta_secondary_text || 'Join the Investor Collective →'}
              width={240}
              height={52}
              strands={950}
              strandLen={8}
              fontSize={16}
              color="#4F6BD9"
            />
          </div>
        </section>
        )}

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

        {sectionOrder.map(key => {
          if (key === 'problem') return !vis('problem') ? null : (
            <React.Fragment key="problem">
            <div className={styles.hdiv} />
            <div className={styles.section}>
              <div className={styles.secLabel}>{sec('problem')?.label || 'The Problem'}</div>
              <h2 className={styles.sectionH2}><em>{sec('problem')?.title || 'Systemic Tension'}</em></h2>
              <p className={styles.secDesc} style={{ maxWidth: 680 }}>
                {sec('problem')?.body || '"Companies stay private longer. Liquidity is locked. Minimums are sky-high. The bridge between those who build and those who believe is crumbling."'}
              </p>
              <div className={styles.stepsGrid}>
                {(sec('problem')?.items?.length ? sec('problem').items : [
                  { title: 'The Locked Table', text: 'High barriers to entry keep brilliant minds away from the table. Companies stay private longer. Liquidity is locked. Minimums are sky-high.' },
                  { title: 'The Bridge is Crumbling', text: 'The connection between those who build and those who believe is breaking down. The traditional VC model leaves too many out.' },
                  { title: 'Transactional vs. Transformational', text: '\u2018Capital In, Returns Out.\u2019 We believe in \u2018Gifts In, Growth Out.\u2019 True value comes from aligned relationships, not just transactions.' },
                ]).map((card, i) => (
                  <div key={i} className={`${styles.stepCard} ${styles.fadeUp}`}>
                    <h3 className={styles.stepCardH3}>{card.title}</h3>
                    <p className={styles.stepCardP}>{card.text}</p>
                  </div>
                ))}
              </div>
            </div>
            </React.Fragment>
          )

          if (key === 'vision') return !vis('vision') ? null : (
            <React.Fragment key="vision">
            <div className={styles.hdiv} />
            <div className={styles.section} id="vision">
              <div className={styles.secLabel}>{sec('vision')?.label || 'The Vision'}</div>
              <h2 className={styles.sectionH2}>A <em>{sec('vision')?.title || 'Redemptive Ecosystem'}</em></h2>
              <p className={styles.secDesc}>{sec('vision')?.subtitle || 'What if funding mechanics were designed to align both sides of the table?'}</p>
              <p className={styles.secDesc} style={{ maxWidth: 680, marginTop: '1rem' }}>
                {sec('vision')?.body || "We curate a space where investors aren\u2019t just line items on a cap table. They are partners who bring more than capital\u2014they bring their gifts, expertise, and commitment to the mission."}
              </p>
              <div className={styles.stepsGrid} style={{ marginTop: '2.5rem' }}>
                {(sec('vision')?.items?.length ? sec('vision').items : [
                  { title: 'Evangelists', text: 'Spreading the mission and amplifying the voices of founders building redemptive ventures.' },
                  { title: 'Fractional Operators', text: 'Applying their God-given gifts to serve and strengthen the ventures they believe in.' },
                  { title: 'Strategic Partners', text: 'Ensuring the roots are healthy so the fruit is sweet. True partnership, not just capital.' },
                ]).map((card, i) => {
                  const icons = [<IconMedia key={0} size={28} />, <IconLeaf key={1} size={28} />, <IconDollar key={2} size={28} />]
                  return (
                    <div key={i} className={`${styles.stepCard} ${styles.fadeUp}`}>
                      <span className={styles.stepIco}>{icons[i]}</span>
                      <h3 className={styles.stepCardH3}>{card.title}</h3>
                      <p className={styles.stepCardP}>{card.text}</p>
                    </div>
                  )
                })}
              </div>
            </div>
            </React.Fragment>
          )

          if (key === 'how_it_works') return !vis('how_it_works') ? null : (
            <React.Fragment key="how_it_works">
            <div className={styles.hdiv} />
            <div className={styles.section} id="how">
              <div className={styles.secLabel}>{sec('how_it_works')?.label || 'How It Works'}</div>
              <h2 className={styles.sectionH2}>From <em>{(sec('how_it_works')?.title || 'From Seed to Harvest').replace('From ', '').split(' to ')[0] || 'Seed'}</em> to Harvest</h2>
              <div className={styles.stepsGrid}>
                {cmsSteps.map(s => (
                  <div className={`${styles.stepCard} ${styles.fadeUp}`} key={s.n || s.number}>
                    <div className={styles.stepNum}>{s.n || s.number}</div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <span className={styles.stepIco}>{s.ico}</span>
                      <h3 className={styles.stepCardH3}>{s.title}</h3>
                    </div>
                    <p className={styles.stepCardP}>{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
            </React.Fragment>
          )

          if (key === 'manifesto') return !vis('manifesto') ? null : (
            <React.Fragment key="manifesto">
            <div className={styles.hdiv} />
            <div id="manifesto">
              <div className={styles.manifestoBlock}>
                <div>
                  <div className={styles.secLabel}>{sec('manifesto')?.label || 'The Redemptive Tech Manifesto'}</div>
                  <h2 className={styles.manifestoH2}>
                    {sec('manifesto')?.title ? sec('manifesto').title : <>A table set for <em>everyone</em></>}
                  </h2>
                  <blockquote className={styles.manifestoQuote}>
                    {sec('manifesto')?.body?.split('\n')[0] || '\u201cSomething amazing happens when we operate in our God-given gifts as a collective whole.\u201d'}
                  </blockquote>
                  <p style={{ marginTop: '1.25rem', lineHeight: 1.75, color: 'var(--text-mid, #5C637E)', maxWidth: 600, textAlign: 'left' }}>
                    {sec('manifesto')?.body?.split('\n').slice(2).join(' ') || 'We are decentralizing the power of who and what gets funded\u2014and why. By aligning capital with calling, we\u2019re building an ecosystem where every venture is strengthened not just by funding, but by the collective gifts of those who believe in it.'}
                  </p>
                </div>
                <div className={styles.manifestoPillars}>
                  {cmsPillars.map(p => (
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
            </React.Fragment>
          )

          if (key === 'newsletter') return !vis('newsletter') ? null : (
            <div key="newsletter" className={styles.newsletterSection}>
              <div className={styles.newsletterInner}>
                <div className={styles.newsletterGrid}>
                  <div>
                    <h2 className={styles.newsletterLeftH2}>
                      {sec('newsletter')?.title || 'Stay Updated on the Harvest'}
                    </h2>
                    <p className={styles.newsletterLeftP}>
                      {sec('newsletter')?.body || 'Join our newsletter for curated insights, founder stories, and investment opportunities.'}
                    </p>
                  </div>
                  <form className={styles.formStack} onSubmit={handleNewsletterSubmit}>
                    {newsletterStatus === 'sent' ? (
                      <div className={styles.formSuccess}>You&apos;re in. Welcome to the orchard.</div>
                    ) : (
                      <>
                        <div className={styles.formGroup}>
                          <input
                            id="nl-email" type="email" className={styles.formInput}
                            placeholder="Enter your email" value={newsletterEmail}
                            onChange={e => setNewsletterEmail(e.target.value)} required
                          />
                        </div>
                        {newsletterStatus === 'error' && (
                          <div className={styles.formError}>Something went wrong. Please try again.</div>
                        )}
                        <FluffyButton
                          type="submit"
                          label={newsletterStatus === 'sending' ? 'Subscribing\u2026' : 'Subscribe'}
                          disabled={newsletterStatus === 'sending' || !newsletterEmail}
                          fullWidth height={48} strands={1200} strandLen={8} fontSize={15} color="#F5A623"
                        />
                      </>
                    )}
                  </form>
                </div>
              </div>
            </div>
          )

          if (key === 'cta') return !vis('cta') ? null : (
            <div key="cta" className={styles.ctaWrap}>
              <div className={`${styles.ctaBlock} ${styles.fadeUp}`}>
                <div className={styles.ctaSecLabel}>{sec('cta')?.label || 'A Table Set For Everyone'}</div>
                <h2 className={styles.ctaH2}>
                  {sec('cta')?.title || <>Known by its <em>Fruit.</em></>}
                </h2>
                <p className={styles.ctaP}>
                  {sec('cta')?.body || 'The Venture Capital system is broken. We\u2019re fixing it through radical hospitality, decentralized power, and capital that acts as an advocate\u2014not just a check.'}
                </p>
                <div className={styles.ctaButtons}>
                  <FluffyButton
                    href={sec('cta')?.cta_primary_link || '/signup?role=founder'}
                    label={sec('cta')?.cta_primary_text || 'Submit a Company'}
                    width={220} height={52} strands={1000} strandLen={8} fontSize={16} color="#F5A623"
                  />
                  <FluffyButton
                    href={token && approved ? '/deals' : (sec('cta')?.cta_secondary_link || '/signup?role=investor')}
                    label={sec('cta')?.cta_secondary_text || 'Join the Investor Collective \u2192'}
                    width={240} height={52} strands={950} strandLen={8} fontSize={16} color="#4F6BD9"
                  />
                </div>
              </div>
            </div>
          )

          return null
        })}

        {/* ── TESTIMONIALS (always after ordered sections) ─────────── */}
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
              <FluffyButton
                href="/community"
                label="Dashboard"
                width={100}
                height={34}
                strands={650}
                strandLen={6}
                fontSize={11}
                color="#F5A623"
              />
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
