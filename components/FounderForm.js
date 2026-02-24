import { useState } from 'react'
import FluffyButton from './FluffyButton'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export default function FounderForm() {
  const [form, setForm] = useState({
    business: { name: '', website: '', address: '', city: '', country: '', phone: '', postal_code: '' },
    investment_request: { amount: '', description: '' }
  })
  const [family, setFamily] = useState('')
  const [status, setStatus] = useState(null)

  function updateBusiness(key, value) {
    setForm(f => ({ ...f, business: { ...f.business, [key]: value } }))
  }

  function updateRequest(key, value) {
    setForm(f => ({ ...f, investment_request: { ...f.investment_request, [key]: value } }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    const payload = { ...form, family: family.split(',').map(s => s.trim()).filter(Boolean) }

    try {
      const res = await fetch(`${API_BASE}/api/submit/founder/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        let err = null
        try { err = await res.json() } catch (e) { err = { detail: 'server error' } }
        // fallback to localStorage when server rejects
        const key = 'btf_founders'
        const items = JSON.parse(localStorage.getItem(key) || '[]')
        const item = { id: Date.now(), ...payload }
        items.unshift(item)
        localStorage.setItem(key, JSON.stringify(items))
        setStatus({ error: true, detail: err, savedLocal: true, item })
        return
      }

      const data = await res.json()
      setStatus({ success: true, data })
      setForm({ business: { name: '', website: '' }, investment_request: { amount: '', description: '' } })
      setFamily('')
    } catch (err) {
      // fallback to localStorage
      const key = 'btf_founders'
      const items = JSON.parse(localStorage.getItem(key) || '[]')
      const item = { id: Date.now(), ...payload }
      items.unshift(item)
      localStorage.setItem(key, JSON.stringify(items))
      setStatus({ error: true, detail: err.message, savedLocal: true, item })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <label>Project Name
        <input value={form.business.name} onChange={e => updateBusiness('name', e.target.value)} required />
      </label>

      <label>Project Website
        <input value={form.business.website} onChange={e => updateBusiness('website', e.target.value)} />
      </label>

      <h4 style={{ marginTop: 12, marginBottom: 6 }}>Business Contact &amp; Location</h4>
      <label>Address
        <textarea value={form.business.address} onChange={e => updateBusiness('address', e.target.value)} rows={2} placeholder="Street address" />
      </label>
      <label>City
        <input value={form.business.city} onChange={e => updateBusiness('city', e.target.value)} placeholder="e.g., San Francisco" />
      </label>
      <label>Country
        <input value={form.business.country} onChange={e => updateBusiness('country', e.target.value)} placeholder="e.g., USA" />
      </label>
      <label>Postal / ZIP Code
        <input value={form.business.postal_code} onChange={e => updateBusiness('postal_code', e.target.value)} placeholder="e.g., 94102" />
      </label>
      <label>Phone
        <input type="tel" value={form.business.phone} onChange={e => updateBusiness('phone', e.target.value)} placeholder="+1 234 567 8900" />
      </label>

      <label>Capital Requested
        <input value={form.investment_request.amount} onChange={e => updateRequest('amount', e.target.value)} />
      </label>

      <label>Describe the "Fruit" / Impact
        <textarea value={form.investment_request.description} onChange={e => updateRequest('description', e.target.value)} rows={4} />
      </label>

      <label>Family members (comma separated)
        <input value={family} onChange={e => setFamily(e.target.value)} placeholder="e.g., Jane Doe, Bob Doe" />
      </label>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <FluffyButton type="submit" label="Submit Your Deal" width={175} height={42} strands={1000} strandLen={7} fontSize={14} />
      </div>

      {status && status.error && <pre className="error">{JSON.stringify(status.detail)}</pre>}
      {status && status.success && <div className="success">Submitted — check your email for next steps.</div>}
    </form>
  )
}
