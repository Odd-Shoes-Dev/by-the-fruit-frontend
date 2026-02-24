import Head from 'next/head'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { apiFetch, getToken } from '../lib/api'

const unwrap = json => { const r = json?.data ?? json; return Array.isArray(r) ? r : Array.isArray(r?.results) ? r.results : [] }

export default function EventsPage() {
  const [upcoming, setUpcoming] = useState([])
  const [live, setLive] = useState([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  useEffect(() => {
    setToken(getToken())
    let mounted = true
    async function load() {
      try {
        const [upRes, liveRes] = await Promise.all([
          apiFetch('/profiles/events/upcoming/'),
          apiFetch('/profiles/events/live/')
        ])
        if (upRes.ok && mounted) setUpcoming(unwrap(await upRes.json()))
        if (liveRes.ok && mounted) setLive(unwrap(await liveRes.json()))
      } catch (e) {}
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  async function register(eventId) {
    if (!getToken()) return
    try {
      const res = await apiFetch(`/profiles/events/${eventId}/register/`, { method: 'POST' })
      if (res.ok) setUpcoming(prev => prev.map(e => e.id === eventId ? { ...e, registered: true } : e))
    } catch (e) {}
  }

  async function remindMe(eventId) {
    if (!getToken()) return
    try {
      const res = await apiFetch(`/profiles/events/${eventId}/remind-me/`, { method: 'POST' })
      if (res.ok) setUpcoming(prev => prev.map(e => e.id === eventId ? { ...e, reminded: true } : e))
    } catch (e) {}
  }

  return (
    <>
      <Head><title>Events — By The Fruit</title></Head>
      <motion.main className="container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <header className="page-header">
          <h1>Events</h1>
          <p className="tagline">Upcoming and live events. Register as a founder or set a reminder as an investor.</p>
        </header>

        {loading ? <div className="spinner">Loading…</div> : (
          <>
            {live.length > 0 && (
              <section style={{ marginBottom: 24 }}>
                <h2>Live now</h2>
                <div style={{ display: 'grid', gap: 12 }}>
                  {live.map(e => (
                    <article key={e.id} className="card card--accent-orange">
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <strong>{e.title}</strong>
                        <span className="badge badge--orange">● Live</span>
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
                <div className="empty-state">
                  <p className="empty-text">No upcoming events. Check back later.</p>
                </div>
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
                      {e.recording_url && (
                        <a href={e.recording_url} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ marginTop: 8, display: 'inline-flex' }}>Watch recording</a>
                      )}
                      {token && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                          <button type="button" className="btn btn-sm" onClick={() => register(e.id)}>
                            {e.registered ? '✓ Registered' : 'Register'}
                          </button>
                          <button type="button" className="btn-outline btn-sm" onClick={() => remindMe(e.id)}>
                            {e.reminded ? '✓ Reminder set' : 'Remind me'}
                          </button>
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
      </motion.main>
    </>
  )
}
