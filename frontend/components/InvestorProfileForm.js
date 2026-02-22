import { useState } from 'react'
import FamilyMemberEditor from './FamilyMemberEditor'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export default function InvestorProfileForm({ initial = {}, onSave }) {
  const [name, setName] = useState(initial.name || initial.full_name || '')
  const [bio, setBio] = useState(initial.bio || '')
  const [gifts, setGifts] = useState(initial.gifts || '')
  const [family, setFamily] = useState(initial.family || [])
  const [linkedin, setLinkedin] = useState(initial.linkedin || '')
  const [location, setLocation] = useState(initial.location || '')
  const [address, setAddress] = useState(initial.address || '')
  const [phone, setPhone] = useState(initial.phone || '')
  const [postalCode, setPostalCode] = useState(initial.postal_code || '')
  const [isMicroInvestor, setIsMicroInvestor] = useState(!!initial.is_micro_investor)
  const [isCreatorInfluencer, setIsCreatorInfluencer] = useState(!!initial.is_creator_influencer)
  const [audienceReach, setAudienceReach] = useState(initial.audience_reach || '')
  const [status, setStatus] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('saving')
    const payload = {
      name, bio, gifts, family, linkedin, location, address, phone, postal_code: postalCode,
      is_micro_investor: isMicroInvestor,
      is_creator_influencer: isCreatorInfluencer,
      audience_reach: audienceReach || null
    }

    try {
      const res = await fetch(`${API_BASE}/profiles/investment-profiles/`, {
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
    const key = 'btf_investors'
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

      <label>Short bio / why Redemptive Tech?
        <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} />
      </label>

      <label>Gifts / Expertise (comma separated)
        <input value={gifts} onChange={e => setGifts(e.target.value)} placeholder="e.g., Strategic advisory, Evangelism" />
      </label>

      <div>
        <label style={{ display: 'block', marginBottom: 6 }}>Family members</label>
        <FamilyMemberEditor members={family} onChange={setFamily} />
      </div>

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

      <label>LinkedIn
        <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://" />
      </label>

      <h4 style={{ marginTop: 16, marginBottom: 8 }}>Investor type (Phase 7)</h4>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={isMicroInvestor} onChange={e => setIsMicroInvestor(e.target.checked)} />
        I'm a micro-investor (smaller check sizes; Reg CF limits may apply later)
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={isCreatorInfluencer} onChange={e => setIsCreatorInfluencer(e.target.checked)} />
        I'm a creator / influencer (show me deals for my audience)
      </label>
      {isCreatorInfluencer && (
        <label>Audience reach (e.g. &quot;10K LinkedIn&quot;, &quot;50K YouTube&quot;)
          <input value={audienceReach} onChange={e => setAudienceReach(e.target.value)} placeholder="10K LinkedIn" />
        </label>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="btn">Save Profile</button>
        <div style={{ alignSelf: 'center' }}>{status === 'saving' ? 'Saving...' : ''}</div>
      </div>
    </form>
  )
}
