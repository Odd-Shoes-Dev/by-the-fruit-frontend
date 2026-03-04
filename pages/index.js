import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/Home.module.css'
import { useEffect, useRef, useState } from 'react'
import { getToken, isApproved, apiFetch } from '../lib/api'
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
    text: "Founders share their mission and empty chairs. Investors share their gifts and expertise. Relationship before transaction.",
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
    text: "Curated introductions lead to genuine conversation. Every connection is intentional. The founder's mission is the north star.",
  },
]

const PILLARS = [
  {
    dot: <IconDollar size={16} />,
    title: 'Redemptive Capital',
    text: 'Investments measured not just by ROI, but by their capacity to restore, renew, and rebuild.',
  },
  {
    dot: <IconInfinity size={16} />,
    title: 'Radical Hospitality',
    text: 'Every founder has an empty chair. We help fill it with wisdom, networks, and genuine support.',
  },
  {
    dot: <IconLeaf size={16} />,
    title: 'Ecosystem Growth',
    text: 'Ventures cross-pollinate, share roots, and bear fruit together in our orchard.',
  },
  {
    dot: <IconStar size={16} />,
    title: 'Founder-First',
    text: "Transparent terms, no dark patterns. The founder's mission is always the north star.",
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

  useEffect(() => {
    setToken(!!getToken())
    setApproved(isApproved())
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
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
        <nav className={`${styles.nav}${scrolled ? ' ' + styles.navScrolled : ''}`}>
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
              <Link href="/community" className={styles.navGhostBtn}>Dashboard</Link>
            ) : token ? (
              <Link href="/pending" className={styles.navGhostBtn}>Pending Approval</Link>
            ) : (
              <>
                <Link href="/login" className={styles.navGhostBtn}>Log in</Link>
                <Link href="/signup" className={styles.navPrimaryBtn}>Get Started</Link>
              </>
            )}
          </div>
        </nav>

        {/* ── HERO ────────────────────────────────────────────────── */}
        <section className={styles.hero} id="vision">
          <div className={styles.heroEyebrow}>· Media · Tech · Entertainment</div>

          <h1 className={styles.heroH1}>
            The VC System Is<br />
            <em>Broken.</em>{' '}
            <span style={{ color: 'var(--text-dark)' }}>We&apos;re</span>{' '}
            <span style={{ color: 'var(--orange)' }}>Fixing</span>{' '}
            <span style={{ color: 'var(--text-dark)' }}>It.</span>
          </h1>

          <p className={styles.heroSub}>
            <strong>By The Fruit</strong> — a faith-rooted investment marketplace built for
            Christian investors and purpose-driven founders. Capital meets calling across
            Media, Tech, and Entertainment, built on{' '}
            <strong>trust, transparency, and Kingdom values</strong>.
          </p>

          <div className={styles.heroCtas}>
            <Link
              href={token && approved ? '/deals' : '/signup?role=investor'}
              className={styles.btnPrimary}
            >
              Join as an Investor
            </Link>
            <Link href="/signup?role=founder" className={styles.btnOutline}>
              Join as a Founder
            </Link>
          </div>
        </section>

        {/* ── STATS ───────────────────────────────────────────────── */}
        <div className={styles.statsStrip}>
          <div className={styles.statCell}>
            <div className={styles.statNum}>3</div>
            <p className={styles.statLbl}>Interconnected sectors shaping culture, connection &amp; creativity</p>
          </div>
          <div className={styles.statCell}>
            <div className={styles.statNum}>$0</div>
            <p className={styles.statLbl}>Dark patterns. Transparent terms. Founder-first always.</p>
          </div>
          <div className={styles.statCell}>
            <div className={styles.statNum}>∞</div>
            <p className={styles.statLbl}>Empty chairs filled with wisdom, networks &amp; genuine support</p>
          </div>
          <div className={styles.statCell}>
            <div className={styles.statNum}>1</div>
            <p className={styles.statLbl}>Table. Set for everyone. Radical hospitality in every deal.</p>
          </div>
        </div>

        <div className={styles.hdiv} />

        {/* ── HOW IT WORKS ────────────────────────────────────────── */}
        <div className={styles.section} id="how">
          <div className={styles.secLabel}>How It Works</div>
          <h2 className={styles.sectionH2}>From <em>Seed</em> to Harvest.</h2>
          <p className={styles.secDesc}>
            No pitch decks required upfront. No cold outreach. Every connection is intentional —
            mapped by gifts, not just capital.
          </p>

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

        {/* ── SECTORS ─────────────────────────────────────────────── */}
        <div id="sectors">
          <div className={styles.featuresHeaderWrap}>
            <div className={styles.secLabel}>Our Sectors</div>
            <h2 className={styles.sectionH2}>Media · Tech · <em>Entertainment.</em></h2>
          </div>

          {/* Sector 1: Media */}
          <div className={`${styles.featureRow} ${styles.fadeUp}`}>
            <div className={styles.featureText}>
              <span className={styles.featureLabel}>Media</span>
              <h3 className={styles.featureH3}>Stories that<br /><em>shape culture.</em></h3>
              <p className={styles.featureP}>
                Platforms and content that amplify truth, beauty, and redemptive narratives for the world.
                We back founders building the next generation of media that matters.
              </p>
            </div>
            {/* Mock: Founder discovery */}
            <div className={styles.uiCard}>
              <div className={styles.mockSearch}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{color:'var(--text-light)',flexShrink:0}}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <span>Media founders · Faith-aligned · Seed–Series A</span>
              </div>
              {[
                { init: 'SC', name: 'Sarah Chen', sub: 'Documentary Filmmaker', badge: 'badgeMedia', bl: 'Media' },
                { init: 'JW', name: 'James Wright', sub: 'Podcast Network CEO', badge: 'badgeMedia', bl: 'Media' },
                { init: 'MO', name: 'Maria Okonkwo', sub: 'Christian Streaming Co-founder', badge: 'badgeMedia', bl: 'Media' },
              ].map((f, i) => (
                <div className={styles.founderRow} key={i}>
                  <div className={styles.founderAvatar}>{f.init}</div>
                  <div className={styles.founderInfo}>
                    <div className={styles.founderName}>
                      {f.name}
                      <span className={`${styles.founderBadge} ${styles[f.badge]}`}>{f.bl}</span>
                    </div>
                    <div className={styles.founderSub}>{f.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.hdiv} />

          {/* Sector 2: Tech */}
          <div className={`${styles.featureRow} ${styles.featureRowReverse} ${styles.fadeUp}`} style={{paddingTop:80}}>
            <div className={styles.featureText}>
              <span className={styles.featureLabel}>Tech</span>
              <h3 className={styles.featureH3}>Tools that <em>empower.</em></h3>
              <p className={styles.featureP}>
                Software, AI, and infrastructure built to serve communities and solve real problems
                with Kingdom purpose. We connect capital to founders building what matters.
              </p>
            </div>
            {/* Mock: Channel message */}
            <div className={styles.channelCard}>
              <div className={styles.channelHeader}>
                <span className={styles.channelTitle}>Channel · TechVenture × Investor</span>
                <span className={styles.channelStatus}>
                  <span style={{width:6,height:6,borderRadius:'50%',background:'#2e7d32',display:'inline-block'}} />
                  Connected
                </span>
              </div>
              <div className={styles.msgRow}>
                <div className={styles.msgAvatar}>TV</div>
                <div className={styles.msgBubble}>We just hit 10k MAU and are raising our seed round. Would love your perspective on go-to-market.</div>
              </div>
              <div className={`${styles.msgRow} ${styles.msgRowReverse}`}>
                <div className={styles.msgAvatar}>IN</div>
                <div className={`${styles.msgBubble} ${styles.msgBubbleOwn}`}>Congratulations! Let&apos;s set up a call this week. I have experience scaling B2B SaaS in this space.</div>
              </div>
              <div className={styles.msgRow}>
                <div className={styles.msgAvatar}>TV</div>
                <div className={styles.msgBubble}>That would be amazing. Thursday at 2pm EST?</div>
              </div>
            </div>
          </div>

          <div className={styles.hdiv} />

          {/* Sector 3: Entertainment */}
          <div className={`${styles.featureRow} ${styles.fadeUp}`} style={{paddingTop:80}}>
            <div className={styles.featureText}>
              <span className={styles.featureLabel}>Entertainment</span>
              <h3 className={styles.featureH3}>Experiences that <em>connect.</em></h3>
              <p className={styles.featureP}>
                Film, music, gaming, and live events that bring people together around shared values.
                We fund the experiences that define a generation.
              </p>
            </div>
            {/* Mock: Offering card */}
            <div className={styles.offeringCard}>
              <div className={styles.offeringName}>Redemption Pictures — Seed Round</div>
              <div className={styles.offeringTagline}>Faith-forward film studio · Series of 4 feature films</div>
              <div className={styles.offeringMeta}>
                <span className={styles.offeringMetaLabel}>Target Raise</span>
                <span className={styles.offeringMetaVal}>$2,500,000</span>
              </div>
              <div className={styles.offeringMeta}>
                <span className={styles.offeringMetaLabel}>Min. Investment</span>
                <span className={styles.offeringMetaVal}>$5,000</span>
              </div>
              <div style={{marginBottom:6,fontSize:'.78rem',color:'var(--text-light)'}}>62% funded</div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} />
              </div>
              <div className={styles.offeringCommit}>Commit Capital →</div>
            </div>
          </div>
        </div>

        <div className={styles.hdiv} />

        {/* ── MANIFESTO ───────────────────────────────────────────── */}
        <div id="manifesto">
          <div className={styles.manifestoBlock}>
            <div>
              <div className={styles.secLabel}>The Manifesto</div>
              <h2 className={styles.manifestoH2}>
                The Redemptive<br />Tech <em>Manifesto.</em>
              </h2>
              <blockquote className={styles.manifestoQuote}>
                Something amazing happens when we operate in our God-given gifts as a collective whole.
              </blockquote>
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
                <div className={styles.secLabel}>Stay Connected</div>
                <h2 className={styles.newsletterLeftH2}>
                  Join the <em>Conversation.</em>
                </h2>
                <p className={styles.newsletterLeftP}>
                  Get updates on new founders, investor spotlights, upcoming events, and the latest
                  from the By the Fruit community.
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
                      <label className={styles.formLabel} htmlFor="nl-email">Email</label>
                      <input
                        id="nl-email"
                        type="email"
                        className={styles.formInput}
                        placeholder="you@example.com"
                        value={newsletterEmail}
                        onChange={e => setNewsletterEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="nl-msg">Message (optional)</label>
                      <input
                        id="nl-msg"
                        type="text"
                        className={styles.formInput}
                        placeholder="Anything you'd like to share..."
                        value={newsletterMessage}
                        onChange={e => setNewsletterMessage(e.target.value)}
                      />
                    </div>
                    <label className={styles.formCheckLabel}>
                      <input
                        type="checkbox"
                        checked={newsletterAgree}
                        onChange={e => setNewsletterAgree(e.target.checked)}
                        required
                      />
                      I agree to receive updates from By the Fruit. No spam, ever.
                    </label>
                    {newsletterStatus === 'error' && (
                      <div className={styles.formError}>Something went wrong. Please try again.</div>
                    )}
                    <button
                      type="submit"
                      className={styles.formSubmitBtn}
                      disabled={newsletterStatus === 'sending' || !newsletterEmail || !newsletterAgree}
                    >
                      {newsletterStatus === 'sending' ? 'Subscribing…' : 'Stay Connected →'}
                    </button>
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
              Know Us By<br />Our <em>Fruit.</em>
            </h2>
            <p className={styles.ctaP}>
              It&apos;s time for a shift. Join a collective where capital acts as an advocate — not just
              a check — and every founder&apos;s mission finds its match.
            </p>
            <div className={styles.ctaButtons}>
              <Link
                href={token && approved ? '/deals' : '/signup?role=investor'}
                className={styles.btnPrimary}
              >
                Join as an Investor
              </Link>
              <Link
                href={token ? (approved ? '/community' : '/pending') : '/signup'}
                className={styles.btnOutline}
              >
                Join the Collective →
              </Link>
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
