import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { useEffect, useState } from 'react'
import { getToken } from '../lib/api'

export default function Home() {
  const [token, setToken] = useState(false)
  useEffect(() => {
    setToken(!!getToken())
  }, [])

  useEffect(() => {
    const cards = document.querySelectorAll('.btn, .' + styles.card, '.' + styles.testimonialCard)
    cards.forEach(card => {
      card.style.transition = 'transform 0.3s, box-shadow 0.3s'
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'scale(1.03)'
        card.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'
      })
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'scale(1)'
        card.style.boxShadow = ''
      })
    })
  }, [])

  return (
    <>
      <Head>
        <title>By The Fruit — Investing in Innovation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className={styles.main}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h1 className={styles.title}>By The Fruit</h1>
            <p className={styles.lead}>Investing in innovation with clarity, care, and covenant.</p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {token && (
              <>
                <Link href="/community">Feed</Link>
                <Link href="/events">Events</Link>
                <Link href="/deals">Deals</Link>
                <Link href="/profile/settings">Profile</Link>
                <Link href="/connections">Connections</Link>
                <Link href="/channels">Channels</Link>
              </>
            )}
            <Link href="/signup"><button className="btn" style={{ marginRight: 8 }}>Sign up</button></Link>
            <Link href="/login"><button className="btn" style={{ background: token ? 'var(--orange)' : '#fff', color: token ? '#fff' : 'var(--orange)', border: '1px solid var(--orange)' }}>Log in</button></Link>
          </div>
        </header>

        <section style={{ marginTop: 36 }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ marginTop: 0 }}>A marketplace for Redemptive founders & investors</h2>
              <p style={{ color: 'var(--muted)' }}>Connect with founders building faith-aligned products and investors seeking kingdom-shaped impact. Share a short pitch, discover profiles, or join the community.</p>

              <div style={{ marginTop: 18, display: 'flex', gap: 12 }}>
                <Link href="/founders"><button className="btn">Browse Founders</button></Link>
                <Link href="/investors"><button className="btn" style={{ background: '#fff', color: 'var(--orange)', border: '1px solid var(--orange)' }}>Browse Investors</button></Link>
              </div>
            </div>

            <div style={{ width: 320 }}>
              <div className={styles.card}>
                <h3>How it works</h3>
                <ul style={{ paddingLeft: 16 }}>
                  <li>Founders submit a short pitch and impact statement.</li>
                  <li>Investors share gifts, interests, and family connections.</li>
                  <li>Community & events surface opportunities and wisdom.</li>
                </ul>
              </div>
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Image src="/assets/svg/Mango tree-pana.svg" alt="Mango Tree" width={220} height={220} priority />
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section style={{ marginTop: 48 }}>
          <div className={styles.testimonials}>
            <h2>What our users say</h2>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div className={styles.testimonialCard}>
                <p>“By The Fruit helped me connect with investors who share my values.”</p>
                <span>- Sarah, Founder</span>
              </div>
              <div className={styles.testimonialCard}>
                <p>“A unique platform for faith-driven innovation.”</p>
                <span>- John, Investor</span>
              </div>
              <div className={styles.testimonialCard}>
                <p>“The community and events are inspiring!”</p>
                <span>- Grace, Community Member</span>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter/Community CTA */}
        <section style={{ marginTop: 48, textAlign: 'center' }}>
          <div className={styles.card} style={{ maxWidth: 420, margin: '0 auto' }}>
            <h2>Join Our Community</h2>
            <p>Get updates, event invites, and connect with like-minded founders and investors.</p>
            <form style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
              <input type="email" placeholder="Your email" style={{ padding: '8px', borderRadius: 6, border: '1px solid #ddd', flex: 1 }} required />
              <button className="btn" type="submit">Subscribe</button>
            </form>
          </div>
        </section>

        <footer className="small" style={{ marginTop: 40, textAlign: 'center', padding: '16px 0', background: '#f9f9f9' }}>
          Short. Clean. Actionable. — By The Fruit
          <div style={{ marginTop: 8 }}>
            <a href="https://twitter.com/yourprofile" target="_blank" rel="noopener" style={{ margin: '0 8px' }}>Twitter</a>
            <a href="https://facebook.com/yourprofile" target="_blank" rel="noopener" style={{ margin: '0 8px' }}>Facebook</a>
            <a href="https://linkedin.com/company/yourprofile" target="_blank" rel="noopener" style={{ margin: '0 8px' }}>LinkedIn</a>
          </div>
        </footer>
      </main>
    </>
  )
}
