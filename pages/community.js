import Head from 'next/head'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMessageSquare, FiMic, FiPlay, FiXCircle } from 'react-icons/fi'
import PostForm from '../components/PostForm'
import PostList from '../components/PostList'
import { apiFetch, getToken } from '../lib/api'

// ─── Pitch Competition Card ────────────────────────────────────────────────────

function PitchCard({ event, token }) {
  const isLive = event.status === 'live'
  const isRecording = event.status === 'ended' && event.recording_url
  const isUpcoming = event.status === 'scheduled'
  const dateStr = new Date(event.starts_at).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return (
    <motion.article
      className="card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      style={{
        borderLeft: isLive ? '4px solid var(--orange)' : isRecording ? '4px solid #6c47ff' : '4px solid #ccc',
        padding: '18px 20px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          {isLive && (
            <span className="badge badge--orange">
              <span className="badge-dot" style={{ animation: 'pulse 1.2s infinite' }} />
              Live Now
            </span>
          )}
          {isRecording && (
            <span className="badge badge--purple">Recording</span>
          )}
          {isUpcoming && (
            <span className="badge badge--green">Upcoming</span>
          )}
          <h3 style={{ margin: '4px 0 6px', fontSize: '1.05rem' }}>{event.title}</h3>
        </div>
        <small style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>{dateStr}</small>
      </div>

      {event.theme && <p className="meta" style={{ marginBottom: 6 }}>Theme: {event.theme}</p>}
      {event.description && <p style={{ marginBottom: 10, lineHeight: 1.55 }}>{event.description}</p>}

      {event.slots_available !== null && isUpcoming && (
        <p className="meta" style={{ marginBottom: 8 }}>
          {event.slots_available === 0
            ? <><FiXCircle size={13} style={{ marginRight: 4, verticalAlign: 'middle', color: '#e53e3e' }} />Slots full</>
            : `${event.slots_available} participant slot${event.slots_available !== 1 ? 's' : ''} left`}
        </p>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
        {isLive && event.stream_url && (
          <a href={event.stream_url} target="_blank" rel="noreferrer" className="btn btn-sm">
            <FiPlay size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />Watch Live
          </a>
        )}
        {isRecording && event.recording_url && (
          <a href={event.recording_url} target="_blank" rel="noreferrer"
            className="btn btn-sm"
            style={{ background: '#6c47ff' }}>
            <FiPlay size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />Watch Recording
          </a>
        )}
      </div>
    </motion.article>
  )
}

// ─── Pitch Competitions Tab ────────────────────────────────────────────────────

function PitchCompetitions() {
  const [data, setData] = useState({ live: [], upcoming: [], recordings: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const token = getToken()

  useEffect(() => {
    let mounted = true
    apiFetch('/profiles/events/pitches/')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(json => { if (mounted) setData({ live: json.live || [], upcoming: json.upcoming || [], recordings: json.recordings || [] }) })
      .catch(() => { if (mounted) setError(true) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  if (loading) return <div className="spinner">Loading competitions…</div>
  if (error) return <div className="spinner">Could not load pitch competitions.</div>

  const total = data.live.length + data.upcoming.length + data.recordings.length

  if (total === 0) return (
    <div className="empty-state">
      <div className="empty-icon"><FiMic size={32} /></div>
      <p className="empty-title">No pitch competitions yet</p>
      <p className="empty-text">Competitions organised by the admin will appear here — live, upcoming, and past recordings.</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40, marginTop: 8 }}>
      {data.live.length > 0 && (
        <section>
          <div className="section-header">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="badge-dot" style={{ background: 'var(--orange)', animation: 'pulse 1.2s infinite' }} />
              Happening Now
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.live.map(e => <PitchCard key={e.id} event={e} token={token} />)}
          </div>
        </section>
      )}

      {data.upcoming.length > 0 && (
        <section>
          <div className="section-header">
            <h2 className="section-title">Upcoming Competitions</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.upcoming.map(e => <PitchCard key={e.id} event={e} token={token} />)}
          </div>
        </section>
      )}

      {data.recordings.length > 0 && (
        <section>
          <div className="section-header">
            <h2 className="section-title">Past Competitions</h2>
            <p className="section-sub">Full recordings of previous pitch competitions.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.recordings.map(e => <PitchCard key={e.id} event={e} token={token} />)}
          </div>
        </section>
      )}
    </div>
  )
}

// ─── Community Page ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'feed', icon: FiMessageSquare, label: 'Feed' },
  { id: 'pitches', icon: FiMic, label: 'Pitch Competitions' },
]

export default function Community() {
  const [refresh, setRefresh] = useState(0)
  const [tab, setTab] = useState('feed')

  return (
    <>
      <Head><title>Community — By The Fruit</title></Head>
      <motion.main className="container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <header className="page-header">
          <h1>Community</h1>
          <p className="tagline">Connect with founders and investors. Pitch, discover deals, and watch live competitions.</p>
        </header>

        {/* Tab bar */}
        <div className="tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`tab-btn${tab === t.id ? ' active' : ''}`}
            >
              <t.icon size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'feed' && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
            >
              <div className="community-layout">
                <div>
                  <PostForm onCreate={() => setRefresh(r => r + 1)} />
                  <div style={{ marginTop: 18 }}>
                    <PostList refreshTrigger={refresh} />
                  </div>
                </div>
                <aside className="card community-aside">
                  <h3>Upcoming</h3>
                  <p>Events, opportunities, and announcements will appear here.</p>
                </aside>
              </div>
            </motion.div>
          )}

          {tab === 'pitches' && (
            <motion.div
              key="pitches"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
            >
              <PitchCompetitions />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>

      <style>{``}</style>
    </>
  )
}
