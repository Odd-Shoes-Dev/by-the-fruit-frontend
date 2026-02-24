import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/Home.module.css'
import FluffyButton from '../components/FluffyButton'
import { useEffect, useState } from 'react'
import { getToken, isApproved, apiFetch } from '../lib/api'
import {
  IconSprout, IconTree, IconApple,
  IconMedia, IconTech, IconEntertainment,
  IconDollar, IconInfinity, IconLeaf, IconStar,
} from '../components/BrandIcons'

const STEPS = [
  {
    n: '01',
    ico: <IconSprout size={44} />,
    title: 'Share Your Story',
    text: "Founders share their mission and empty chairs. Investors share their gifts and expertise. Relationship before transaction.",
  },
  {
    n: '02',
    ico: <IconTree size={44} />,
    title: 'The Orchard Matches',
    text: 'Our alignment engine maps founder needs to investor gifts — skills, domains, stage fit, and capital range.',
  },
  {
    n: '03',
    ico: <IconApple size={44} />,
    title: 'Come to the Table',
    text: "Curated introductions lead to genuine conversation. Every connection is intentional. The founder's mission is the north star.",
  },
]

const SECTORS = [
  {
    ico: <IconMedia size={42} />,
    title: 'Media',
    text: 'Stories that shape culture. Platforms and content that amplify truth, beauty, and redemptive narratives for the world.',
  },
  {
    ico: <IconTech size={42} />,
    title: 'Tech',
    text: 'Tools that empower. Software, AI, and infrastructure built to serve communities and solve real problems with Kingdom purpose.',
  },
  {
    ico: <IconEntertainment size={42} />,
    title: 'Entertainment',
    text: 'Experiences that connect. Film, music, gaming, and live events that bring people together around shared values.',
  },
]

const PILLARS = [
  {
    dot: <IconDollar size={18} />,
    title: 'Redemptive Capital',
    text: 'Investments measured not just by ROI, but by their capacity to restore, renew, and rebuild.',
  },
  {
    dot: <IconInfinity size={18} />,
    title: 'Radical Hospitality',
    text: 'Every founder has an empty chair. We help fill it with wisdom, networks, and genuine support.',
  },
  {
    dot: <IconLeaf size={18} />,
    title: 'Ecosystem Growth',
    text: 'Ventures cross-pollinate, share roots, and bear fruit together in our orchard.',
  },
  {
    dot: <IconStar size={18} />,
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
        <nav className={styles.nav}>
          <a href="#" className={styles.navLogo}>
            By the Fruit<span className={styles.dot}>.</span>
          </a>

          <ul className={styles.navLinks}>
            <li><a href="#vision">The Vision</a></li>
            <li><a href="#how">How It Works</a></li>
            <li><a href="#sectors">Sectors</a></li>
            <li><a href="#manifesto">Manifesto</a></li>
          </ul>

          <div className={styles.navCta}>
            {token && approved ? (
              <Link href="/community" className={styles.navGhostBtn}>Dashboard →</Link>
            ) : token ? (
              <Link href="/pending" className={styles.navGhostBtn}>Pending Approval</Link>
            ) : (
              <>
                <Link href="/login" className={styles.navGhostBtn}>Sign In</Link>
                <FluffyButton
                  label="Join the Collective →"
                  color="#E8601A"
                  strands={900}
                  strandLen={6}
                  width={160}
                  height={38}
                  fontSize={12}
                  href="/signup"
                />
              </>
            )}
          </div>
        </nav>

        {/* ── HERO ────────────────────────────────────────────────── */}
        <div className={styles.hero} id="vision">
          <div className={styles.heroBg} />
          <div className={styles.heroTexture} />

          {/* Left */}
          <div className={styles.heroLeft}>
            <div className={styles.heroEyebrow}>
              <FluffyButton
                label={<span style={{display:'flex',gap:6,alignItems:'center'}}><IconApple size={13}/> Redemptive Capital</span>}
                color="#E8601A"
                strands={1100}
                strandLen={7}
                width={190}
                height={36}
                fontSize={11}
                float
              />
              <span className={styles.eyebrowText}>· Media · Tech · Entertainment</span>
            </div>

            <h1 className={styles.heroH1}>
              Known<br />
              By Its<br />
              <em>Fruit.</em>
            </h1>

            <p className={styles.heroSub}>
              <strong>Investing in Innovation.</strong> We curate a space where investors bring more than
              capital — they bring their <strong>gifts, expertise, and commitment</strong> to the mission.
            </p>

            <div className={styles.heroCtas}>
              <FluffyButton
                label="Fund a Project →"
                color="#E8601A"
                strands={2200}
                strandLen={9}
                width={200}
                height={54}
                fontSize={15}
                href={token && approved ? '/deals' : '/signup?role=investor'}
              />
              <a href="/signup?role=founder" className={styles.ghostBtn}>
                Join as a Founder
              </a>
            </div>
          </div>

          {/* Right */}
          <div className={styles.heroRight}>
            <FluffyButton
              label={
                <span style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 20, alignItems: 'center' }}>
                  <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '0.12em', opacity: 0.8 }}>THE VC SYSTEM IS BROKEN</span>
                  <span style={{ fontFamily: "'Playfair Display'", fontSize: 28, fontWeight: 700, fontStyle: 'italic', lineHeight: 1.15 }}>We&apos;re fixing it.</span>
                </span>
              }
              color="#E8601A"
              strands={4000}
              strandLen={12}
              radius={22}
              width={300}
              height={150}
              float
              floatDelay="0s"
            />

            <div className={styles.heroTags}>
              <FluffyButton label={<span style={{display:'flex',gap:5,alignItems:'center'}}><IconMedia size={13}/> Media</span>}          color="#1E6B3A" strands={800} strandLen={6} width={140} height={36} fontSize={12} float floatDelay="0.5s" />
              <FluffyButton label={<span style={{display:'flex',gap:5,alignItems:'center'}}><IconTech size={13}/> Tech</span>}             color="#1E6B3A" strands={800} strandLen={6} width={110} height={36} fontSize={12} float floatDelay="1s"   />
              <FluffyButton label={<span style={{display:'flex',gap:5,alignItems:'center'}}><IconEntertainment size={13}/> Entertainment</span>} color="#1E6B3A" strands={900} strandLen={6} width={165} height={36} fontSize={12} float floatDelay="1.5s" />
            </div>
          </div>
        </div>

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
              <div className={styles.stepCard} key={s.n}>
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
        <div className={styles.section} id="sectors">
          <div className={styles.secLabel}>Our Sectors</div>
          <h2 className={styles.sectionH2}>Media · Tech · <em>Entertainment.</em></h2>
          <p className={styles.secDesc}>
            We invest exclusively in founders building Kingdom-aligned ventures across three
            interconnected sectors that shape culture, connection, and creativity.
          </p>

          <div className={styles.sectorsGrid}>
            {SECTORS.map(s => (
              <div className={styles.sectorCard} key={s.title}>
                <span className={styles.sectorIco}>{s.ico}</span>
                <h3 className={styles.sectorCardH3}>{s.title}</h3>
                <p className={styles.sectorCardP}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.hdiv} />

        {/* ── MANIFESTO ───────────────────────────────────────────── */}
        <div className={styles.section} id="manifesto" style={{ paddingBottom: 0 }}>
          <div className={styles.secLabel}>The Manifesto</div>
          <div className={styles.manifestoBlock}>
            <div>
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
            <div className={styles.hdiv} style={{ marginTop: 88 }} />
            <div className={styles.section}>
              <div className={styles.secLabel}>Community Voices</div>
              <h2 className={styles.sectionH2}>What Members <em>Say.</em></h2>
              <div className={styles.stepsGrid}>
                {testimonials.slice(0, 3).map((t, i) => (
                  <div className={styles.sectorCard} key={i}>
                    <p className={styles.sectorCardP} style={{ lineHeight: 1.75, fontStyle: 'italic', marginBottom: 16 }}>
                      &ldquo;{t.content || t.text || t.quote}&rdquo;
                    </p>
                    <span className={styles.pillarTxtStrong} style={{ fontSize: '0.82rem', opacity: 0.7 }}>
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
                    You&apos;re in. Welcome to the orchard. <IconApple size={16} />
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
                    <FluffyButton
                      type="submit"
                      disabled={newsletterStatus === 'sending' || !newsletterEmail || !newsletterAgree}
                      label={newsletterStatus === 'sending' ? 'Sending…' : 'Join the Collective →'}
                      fullWidth
                      height={48}
                      strands={1500}
                      strandLen={8}
                      fontSize={15}
                    />
                  </>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* ── CTA BLOCK ───────────────────────────────────────────── */}
        <div className={styles.ctaWrap}>
          <div className={styles.ctaBlock}>
            <div className={styles.ctaSecLabel}>A Table Set For Everyone</div>
            <h2 className={styles.ctaH2}>
              Know Us By<br />Our <em>Fruit.</em>
            </h2>
            <p className={styles.ctaP}>
              It&apos;s time for a shift. Join a collective where capital acts as an advocate — not just
              a check — and every founder&apos;s mission finds its match.
            </p>
            <div className={styles.ctaButtons}>
              <FluffyButton
                label={<span style={{display:'flex',gap:6,alignItems:'center'}}><IconApple size={16}/> Fund a Project</span>}
                color="#E8601A"
                strands={2800}
                strandLen={10}
                width={200}
                height={58}
                fontSize={16}
                href={token && approved ? '/deals' : '/signup?role=investor'}/>
              <FluffyButton
                label="Join the Collective →"
                color="#1E6B3A"
                strands={2800}
                strandLen={10}
                width={220}
                height={58}
                fontSize={16}
                href={token ? (approved ? '/community' : '/pending') : '/signup'}
              />
            </div>
          </div>
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────── */}
        <footer className={styles.footer}>
          <div className={styles.footBrandWrap}>
            <div className={styles.footBrand}>
              By the Fruit<span className={styles.dot}>.</span>
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
              <Link href="/login">Sign In</Link>
            )}
          </div>

          <div className={styles.footTagline}>Redemptive Tech Investing</div>
        </footer>

      </div>
    </>
  )
}
