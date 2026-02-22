import { useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export default function EventForm({ onCreate }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [postal, setPostal] = useState('')
  const [recording, setRecording] = useState('')
  const [desc, setDesc] = useState('')

  const [status, setStatus] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    const payload = { title, date, location, address, phone, postal, recording, description: desc }

    try {
      const res = await fetch(`${API_BASE}/api/events/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        const data = await res.json()
        setStatus('saved')
        onCreate && onCreate(data)
        clear()
        return
      }
    } catch (err) {
      // fallback
    }

    const events = JSON.parse(localStorage.getItem('btf_events') || '[]')
    events.unshift({ ...payload, created_at: new Date().toISOString() })
    localStorage.setItem('btf_events', JSON.stringify(events))
    setStatus('saved-local')
    onCreate && onCreate(payload)
    clear()
  }

  function clear() {
    setTitle('')
    setDate('')
    setLocation('')
    setAddress('')
    setPhone('')
    setPostal('')
    setRecording('')
    setDesc('')
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <label>Title
        <input value={title} onChange={e => setTitle(e.target.value)} required />
      </label>

      <label>Date
        <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />
      </label>

      <label>Location
        <input value={location} onChange={e => setLocation(e.target.value)} />
      </label>

      <label>Address
        <input value={address} onChange={e => setAddress(e.target.value)} />
      </label>

      <label>Phone
        <input value={phone} onChange={e => setPhone(e.target.value)} />
      </label>

      <label>Postal Code
        <input value={postal} onChange={e => setPostal(e.target.value)} />
      </label>

      <label>Recording Link (optional)
        <input value={recording} onChange={e => setRecording(e.target.value)} placeholder="https://" />
      </label>

      <label>Description
        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} />
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="btn">Create Event</button>
        <div style={{ alignSelf: 'center' }}>{status === 'sending' ? 'Sending...' : ''}</div>
      </div>
    </form>
  )
}
