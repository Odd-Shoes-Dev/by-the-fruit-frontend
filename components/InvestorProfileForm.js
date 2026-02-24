import { useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export default function InvestorProfileForm({ initial = {}, onSave }) {
  const [bio, setBio] = useState(initial.bio || '')
  const [philosophy, setPhilosophy] = useState(initial.philosophy || '')
  const [checkSizeRange, setCheckSizeRange] = useState(initial.check_size_range || '5000-10000')
  const [investmentType, setInvestmentType] = useState(initial.investment_type || '')
  const [linkedin, setLinkedin] = useState(initial.linkedin || '')
  const [twitter, setTwitter] = useState(initial.twitter || '')
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('saving')
    setError('')

    const payload = {
      user: initial.user,
      bio,
      philosophy,
      check_size_range: checkSizeRange,
      investment_type: investmentType,
      linkedin,
      twitter,
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('btf_pending_token') : null
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${API_BASE}/profiles/investments/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        const data = await res.json()
        console.log('Investor Profile creation response:', data)
        setStatus('saved')
        onSave && onSave(data)
        return
      }
      const errData = await res.json().catch(() => ({}))
      console.error('Investor Profile creation error:', errData)
      setError(errData?.error || 'Failed to save investor profile.')
      setStatus(null)
    } catch (err) {
      // fallback if development
      if (process.env.NODE_ENV !== 'production') {
        const key = 'btf_investments'
        const items = JSON.parse(localStorage.getItem(key) || '[]')
        const newItem = { id: Date.now(), ...payload }
        console.log('Investor Profile saved locally (fallback):', newItem)
        items.unshift(newItem)
        localStorage.setItem(key, JSON.stringify(items))
        setStatus('saved-local')
        onSave && onSave(newItem)
        return
      }
      console.error('Investor Profile network error:', err)
      setError('Network error — please try again.')
      setStatus(null)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <label>Bio / Background
        <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Experienced angel investor focused on agri-tech." required />
      </label>

      <label>Investment Philosophy
        <textarea value={philosophy} onChange={e => setPhilosophy(e.target.value)} rows={2} placeholder="Investing in sustainable future." required />
      </label>

      <label>Check Size Range
        <select value={checkSizeRange} onChange={e => setCheckSizeRange(e.target.value)}>
          <option value="1000-5000">1,000 - 5,000</option>
          <option value="5000-10000">5,000 - 10,000</option>
          <option value="10000-50000">10,000 - 50,000</option>
          <option value="50000-100000">50,000 - 100,000</option>
          <option value="100000+">100,000+</option>
        </select>
      </label>

      <label>Investment Type / Category
        <input value={investmentType} onChange={e => setInvestmentType(e.target.value)} placeholder="e.g., technology, agriculture" required />
      </label>

      <h4 style={{ marginTop: 16, marginBottom: 8 }}>Social Profiles</h4>
      <label>LinkedIn
        <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
      </label>

      <label>Twitter / X
        <input value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="https://twitter.com/..." />
      </label>

      {error && <div style={{ color: 'var(--danger, red)', marginTop: 8, fontSize: '0.9rem' }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button type="submit" className="btn" disabled={status === 'saving'}>Save Profile</button>
        <div style={{ alignSelf: 'center' }}>{status === 'saving' || status === 'saved-local' ? 'Saving...' : ''}</div>
      </div>
    </form>
  )
}

