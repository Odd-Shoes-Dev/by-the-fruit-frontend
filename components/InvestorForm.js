import { useState } from 'react'
import FluffyButton from './FluffyButton'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export default function InvestorForm() {
  const [form, setForm] = useState({
    bio: '',
    check_size_range: '$5k–$25k',
    philosophy: '',
    linkedin: '',
    location: '',
    address: '',
    phone: '',
    postal_code: ''
  })
  const [family, setFamily] = useState('')
  const [status, setStatus] = useState(null)

  function update(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')

    try {
      const res = await fetch(`${API_BASE}/api/submit/investor/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          family: family.split(',').map(s => s.trim()).filter(Boolean)
        })
      })

      if (!res.ok) {
        const err = await res.json()
        setStatus({ error: true, detail: err })
        return
      }

      const data = await res.json()
      setStatus({ success: true, data })
      setForm({ bio: '', check_size_range: '$5k–$25k', philosophy: '', linkedin: '', location: '', address: '', phone: '', postal_code: '' })
    } catch (err) {
      setStatus({ error: true, detail: err.message })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <label>Short Bio / What draws you to Redemptive Tech?
        <textarea value={form.bio} onChange={e => update('bio', e.target.value)} rows={3} required />
      </label>

      <label>Check Size Range
        <select value={form.check_size_range} onChange={e => update('check_size_range', e.target.value)}>
          <option>$5k–$25k</option>
          <option>$25k–$100k</option>
          <option>$100k+</option>
        </select>
      </label>

      <label>Gifts / Expertise (brief)
        <input value={form.philosophy} onChange={e => update('philosophy', e.target.value)} />
      </label>

      <label>Family members (comma separated)
        <input value={family} onChange={e => setFamily(e.target.value)} placeholder="e.g., Jane Doe, Bob Doe" />
      </label>

      <h4 style={{ marginTop: 12, marginBottom: 6 }}>Contact &amp; Location</h4>
      <label>Location (City / Region)
        <input value={form.location} onChange={e => update('location', e.target.value)} placeholder="e.g., San Francisco, CA" />
      </label>
      <label>Address
        <textarea value={form.address} onChange={e => update('address', e.target.value)} rows={2} placeholder="Street address" />
      </label>
      <label>Phone
        <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+1 234 567 8900" />
      </label>
      <label>Postal / ZIP Code
        <input value={form.postal_code} onChange={e => update('postal_code', e.target.value)} placeholder="e.g., 94102" />
      </label>

      <label>LinkedIn
        <input value={form.linkedin} onChange={e => update('linkedin', e.target.value)} placeholder="https://" />
      </label>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <FluffyButton type="submit" label="Join the Collective" width={185} height={42} strands={1000} strandLen={7} fontSize={14} />
      </div>

      {status && status.error && <pre className="error">{JSON.stringify(status.detail)}</pre>}
      {status && status.success && <div className="success">Thanks — we've received your interest.</div>}
    </form>
  )
}
