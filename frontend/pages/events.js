import Head from 'next/head'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiFetch, getToken } from '../lib/api'

export default function EventsPage() {
  const [upcoming, setUpcoming] = useState([])
  const [live, setLive] = useState([])
  const [loading, setLoading] = useState(true)
  const token = getToken()

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [upRes, liveRes] = await Promise.all([
          apiFetch('/profiles/events/upcoming/'),
          apiFetch('/profiles/events/live/')
        ])
        if (upRes.ok && mounted) setUpcoming(await upRes.json())
        if (liveRes.ok && mounted) setLive(await liveRes.json())
      } catch (e) {}
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  async function register(eventId) {
    if (!token) return
    try {
      const res = await apiFetch(`/profiles/events/${eventId}/register/`, { method: 'POST' })
      if (res.ok) {
        setUpcoming(prev => prev.map(e => e.id === eventId ? { ...e, registered: true } : e))
      }
    } catch (e) {}
  }

  async function remindMe(eventId) {
    if (!token) return
    try {
      const res = await apiFetch(`/profiles/events/${eventId}/remind-me/`, { method: 'POST' })
      if (res.ok) {
        setUpcoming(prev => prev.map(e => e.id === eventId ? { ...e, reminded: true } : e))
      }
    } catch (e) {}
  }

  return (
    <>
      <Head>
        <title>Events — By the Fruit</title>
      </Head>
      <main className="container">
        <header>
          <h1>Events</h1>
          <p className="tagline">Upcoming and live events. Register as a founder or set a reminder as an investor.</p>
        </header>

        {loading ? <p>Loading…</p> : (
          <>
            {live.length > 0 && (
              <section style={{ marginBottom: 24 }}>
                <h2>Live now</h2>
                <div style={{ display: 'grid', gap: 12 }}>
                  {live.map(e => (
                    <article key={e.id} className="card" style={{ borderLeft: '4px solid var(--orange)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <strong>{e.title}</strong>
                        <span style={{ color: 'var(--orange)', fontWeight: 600 }}>● Live</span>
                      </div>
                      {e.theme && <p className="meta">{e.theme}</p>}
                      <p style={{ marginTop: 8 }}>{e.description}</p>
                      <small style={{ color: 'var(--muted)' }}>{new Date(e.starts_at).toLocaleString()}</small>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2>Upcoming events</h2>
              {upcoming.length === 0 ? (
                <p className="meta">No upcoming events. Check back later or create one from the admin.</p>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {upcoming.map(e => (
                    <article key={e.id} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <strong>{e.title}</strong>
                        <small style={{ color: 'var(--muted)' }}>{new Date(e.starts_at).toLocaleString()}</small>
                      </div>
                      {e.theme && <p className="meta">Theme: {e.theme}</p>}
                      <p style={{ marginTop: 8 }}>{e.description}</p>
                      {e.slots_available !== null && <p className="meta">Slots: {e.slots_available} left</p>}
                      {e.recording_url && <a href={e.recording_url} target="_blank" rel="noreferrer">Watch recording</a>}
                      {token && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                          <button type="button" className="btn" onClick={() => register(e.id)}>Register</button>
                          <button type="button" className="btn" style={{ background: '#fff', color: 'var(--orange)', border: '1px solid var(--orange)' }} onClick={() => remindMe(e.id)}>Remind me</button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <aside className="card" style={{ marginTop: 24, maxWidth: 420 }}>
          <h3>Opportunities</h3>
          <p>Expiring opportunities will surface here for quick action.</p>
        </aside>

        <p style={{ marginTop: 24 }}><Link href="/">Back</Link></p>
      </main>
    </>
  )
}
