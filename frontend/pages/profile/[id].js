import { useEffect, useState } from 'react'
import InvestorProfileForm from '../../components/InvestorProfileForm'
import FounderProfileForm from '../../components/FounderProfileForm'

export default function ProfilePage({ query }) {
  const [profile, setProfile] = useState(null)
  const [type, setType] = useState('founder')

  useEffect(() => {
    // Try load from localStorage by id
    const id = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : null
    if (!id) return
    const founders = JSON.parse(localStorage.getItem('btf_founders') || '[]')
    const investors = JSON.parse(localStorage.getItem('btf_investors') || '[]')
    const f = founders.find(x => String(x.id) === id)
    if (f) { setProfile(f); setType('founder'); return }
    const i = investors.find(x => String(x.id) === id)
    if (i) { setProfile(i); setType('investor'); return }
  }, [])

  function handleSave(data) {
    setProfile(data)
  }

  if (!profile) return <div style={{ padding: 20 }}>Profile not found locally — use the form to create one.</div>

  return (
    <div style={{ padding: 20 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <img src="/images/Daniel.jpg" alt="Profile Placeholder" width={160} height={160} style={{ borderRadius: '50%', objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
      </div>
      <h2>{profile.name}</h2>
      <p>{profile.bio}</p>
      <h3>Family</h3>
      <ul>
        {(profile.family || []).map((f, idx) => <li key={idx}>{f}</li>)}
      </ul>

      <h3>Edit</h3>
      {type === 'founder' ? (
        <FounderProfileForm initial={profile} onSave={handleSave} />
      ) : (
        <InvestorProfileForm initial={profile} onSave={handleSave} />
      )}
    </div>
  )
}
