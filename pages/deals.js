import Head from 'next/head'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiFetch, getToken } from '../lib/api'

const unwrap = json => { const r = json?.data ?? json; return Array.isArray(r) ? r : Array.isArray(r?.results) ? r.results : [] }

export default function DealsPage() {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const t = getToken()
    setToken(t)
    setMounted(true)
    if (!t) { setLoading(false); return }

    let active = true
    async function load() {
      try {
        const res = await apiFetch('/profiles/investment-requests/deals-for-creators/')
        if (res.status === 403) {
          if (active) setForbidden(true)
        } else if (res.ok && active) {
          setDeals(unwrap(await res.json()))
        }
      } catch (e) {}
      if (active) setLoading(false)
    }
    load()
    return () => { active = false }
  }, [])

  if (!mounted || loading) return <div className="container"><div className="spinner">Loading…</div></div>

  if (!token) {
    return (
      <>
        <Head><title>Deals for creators — By The Fruit</title></Head>
        <main className="container">
          <h1>Deals for creators</h1>
          <p><Link href="/login">Log in</Link> to see deals tailored for creator/influencer investors.</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Head><title>Deals for creators — By The Fruit</title></Head>
      <main className="container">
        <header className="page-header">
          <h1>Deals for creators</h1>
          <p className="tagline">Investment opportunities surfaced for creator/influencer investors by relevance.</p>
        </header>

        {forbidden ? (
          <div className="card" style={{ maxWidth: 560 }}>
            <p>Only creator/influencer investors can access this feed.</p>
            <p className="meta">In your investor profile, enable &quot;I&apos;m a creator / influencer&quot; and save.</p>
            <Link href="/profile/settings">Go to profile settings</Link>
          </div>
        ) : deals.length === 0 ? (
          <p className="empty-text">No open deals right now. Check back later.</p>
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
