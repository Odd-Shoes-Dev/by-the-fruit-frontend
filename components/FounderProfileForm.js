import { useState } from 'react'
import FamilyMemberEditor from './FamilyMemberEditor'
import FluffyButton from './FluffyButton'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export default function FounderProfileForm({ initial = {}, onSave }) {
  const [name, setName] = useState(initial.name || '')
  const [company, setCompany] = useState(initial.company || '')
  const [role, setRole] = useState(initial.role || '')
  const [bio, setBio] = useState(initial.bio || '')
  const [family, setFamily] = useState(initial.family || [])
  const [website, setWebsite] = useState(initial.website || '')
  const [location, setLocation] = useState(initial.location || '')
  const [address, setAddress] = useState(initial.address || '')
  const [phone, setPhone] = useState(initial.phone || '')
  const [postalCode, setPostalCode] = useState(initial.postal_code || '')
  const [status, setStatus] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('saving')
    const payload = { name, company, role, bio, family, website, location, address, phone, postal_code: postalCode }

    try {
      const res = await fetch(`${API_BASE}/profiles/founders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        const data = await res.json()
        setStatus('saved')
        onSave && onSave(data)
        return
      }
    } catch (err) {
      // fallback
    }

    // localStorage fallback
    const key = 'btf_founders'
    const items = JSON.parse(localStorage.getItem(key) || '[]')
    const newItem = { id: Date.now(), ...payload }
    items.unshift(newItem)
    localStorage.setItem(key, JSON.stringify(items))
    setStatus('saved-local')
    onSave && onSave(newItem)
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <label>Full name
        <input value={name} onChange={e => setName(e.target.value)} required />
      </label>

      <label>Company
        <input value={company} onChange={e => setCompany(e.target.value)} />
      </label>

      <label>Role
        <input value={role} onChange={e => setRole(e.target.value)} />
      </label>

      <label>Short bio
        <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} />
      </label>

      <div>
        <label style={{ display: 'block', marginBottom: 6 }}>Family members</label>
        <FamilyMemberEditor members={family} onChange={setFamily} />
      </div>

      <label>Website
        <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" />
      </label>

      <h4 style={{ marginTop: 16, marginBottom: 8 }}>Contact &amp; Location</h4>
      <label>Location (City / Region)
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g., San Francisco, CA" />
      </label>
      <label>Address
        <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} placeholder="Street address" />
      </label>
      <label>Phone
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 234 567 8900" />
      </label>
      <label>Postal / ZIP Code
        <input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="e.g., 94102" />
      </label>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <FluffyButton type="submit" disabled={status === 'saving'} label={status === 'saving' ? 'Saving…' : 'Save Profile'} width={140} height={42} strands={900} strandLen={7} fontSize={14} />
      </div>
    </form>
  )
}
