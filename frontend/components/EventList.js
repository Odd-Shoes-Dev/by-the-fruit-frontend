import { useEffect, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export default function EventList() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/events/`)
        if (res.ok) {
          const data = await res.json()
          if (mounted) setEvents(data)
          return
        }
      } catch (err) {
        // ignore
      }

      const local = JSON.parse(localStorage.getItem('btf_events') || '[]')
      if (mounted) setEvents(local)
    }
    load()
    return () => { mounted = false }
  }, [])

  if (!events || events.length === 0) return <div>No upcoming events.</div>

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {events.map((e, i) => (
        <article key={i} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{e.title}</strong>
            <small style={{ color: '#666' }}>{e.date ? new Date(e.date).toLocaleString() : ''}</small>
          </div>
          <p style={{ marginTop: 8 }}>{e.description}</p>
          {e.recording ? <div style={{ marginTop: 8 }}><a href={e.recording} target="_blank" rel="noreferrer">Watch Recording</a></div> : null}
          {(e.location || e.address || e.phone || e.postal) && (
            <div style={{ marginTop: 8, fontSize: 0.95 }}>
              {e.location && <div><strong>Location:</strong> {e.location}</div>}
              {e.address && <div><strong>Address:</strong> {e.address}</div>}
              {e.phone && <div><strong>Phone:</strong> {e.phone}</div>}
              {e.postal && <div><strong>Postal:</strong> {e.postal}</div>}
            </div>
          )}
        </article>
      ))}
    </div>
  )
}
