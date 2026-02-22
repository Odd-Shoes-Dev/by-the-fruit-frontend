import Head from 'next/head'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiFetch, getToken } from '../lib/api'

export default function DealsPage() {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const token = getToken()

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!token) {
        if (mounted) setLoading(false)
        return
      }
      try {
        const res = await apiFetch('/profiles/investment-requests/deals-for-creators/')
        if (res.status === 403) {
          if (mounted) setForbidden(true)
        } else if (res.ok && mounted) {
          const data = await res.json()
          setDeals(Array.isArray(data) ? data : [])
        }
      } catch (e) {}
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [token])

  if (!token) {
    return (
      <>
        <Head><title>Deals for creators — By the Fruit</title></Head>
        <main className="container">
          <h1>Deals for creators</h1>
          <p><Link href="/login">Log in</Link> to see deals tailored for creator/influencer investors.</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Deals for creators — By the Fruit</title>
      </Head>
      <main className="container">
        <header>
          <h1>Deals for creators</h1>
          <p className="tagline">Investment opportunities surfaced for creator/influencer investors by relevance.</p>
        </header>

        {loading ? (
          <p>Loading…</p>
        ) : forbidden ? (
          <div className="card" style={{ maxWidth: 560 }}>
            <p>Only creator/influencer investors can access this feed.</p>
            <p className="meta">In your investor profile, enable &quot;I&apos;m a creator / influencer&quot; and save. Then return here to see deals matched to your interests.</p>
            <Link href="/profile/settings">Go to profile settings</Link>
          </div>
        ) : deals.length === 0 ? (
          <p className="meta">No open deals right now. Check back later.</p>
        ) : (
          <section style={{ display: 'grid', gap: 12 }}>
            {deals.map(d => (
              <article key={d.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div>
                    {d.business?.name && <strong>{d.business.name}</strong>}
                    {d.business?.category && <span className="meta" style={{ marginLeft: 8 }}>{d.business.category}</span>}
                  </div>
                  <span style={{ fontWeight: 600 }}>${d.amount}</span>
                </div>
                {d.founder?.full_name && <p className="meta">Founder: {d.founder.full_name}</p>}
                <p style={{ marginTop: 8 }}>{d.description}</p>
                {d.business?.description && <p className="meta" style={{ marginTop: 4 }}>{d.business.description}</p>}
                {d.relevance_score > 0 && <small style={{ color: 'var(--orange)' }}>Matches your interests</small>}
              </article>
            ))}
          </section>
        )}
      </main>
    </>
  )
}
