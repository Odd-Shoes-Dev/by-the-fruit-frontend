import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch, getToken } from '../../lib/api'
import FamilyMemberEditor from '../../components/FamilyMemberEditor'

export default function ProfileSettingsPage() {
  const [user, setUser] = useState(null)
  const [bio, setBio] = useState('')
  const [familyVisibility, setFamilyVisibility] = useState('everyone')
  const [bioVisibility, setBioVisibility] = useState('everyone')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const token = getToken()

  useEffect(() => {
    if (!token) return
    apiFetch('/user/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setUser(data)
          setBio(data.bio || '')
          setFamilyVisibility(data.family_visibility || 'everyone')
          setBioVisibility(data.bio_visibility || 'everyone')
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token])

  async function handleSave(e) {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    try {
      const res = await apiFetch('/user/me', {
        method: 'PATCH',
        body: JSON.stringify({
          bio,
          family_visibility: familyVisibility,
          bio_visibility: bioVisibility
        })
      })
      if (res.ok) setUser(await res.json())
    } finally {
      setSaving(false)
    }
  }

  if (!token) {
    return (
      <div className="container">
        <p><Link href="/login">Log in</Link> to edit your profile.</p>
      </div>
    )
  }

  if (loading) return <div className="container"><p>Loading…</p></div>

  return (
    <div className="container">
      <h2>Profile settings</h2>
      <p className="meta">Edit your bio, family members, and who can see each section.</p>

      <form onSubmit={handleSave} className="form" style={{ maxWidth: 560 }}>
        <label>Bio
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="About you" />
        </label>

        <label>Who can see your bio?
          <select value={bioVisibility} onChange={e => setBioVisibility(e.target.value)}>
            <option value="everyone">Everyone</option>
            <option value="connections">Connections only</option>
            <option value="only_me">Only me</option>
          </select>
        </label>

        <div style={{ marginTop: 24 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>Family members</label>
          <FamilyMemberEditor
            members={user?.family_members || []}
            onChange={(members) => setUser(prev => prev ? { ...prev, family_members: members } : prev)}
          />
        </div>

        <label style={{ marginTop: 16 }}>Who can see your family?
          <select value={familyVisibility} onChange={e => setFamilyVisibility(e.target.value)}>
            <option value="everyone">Everyone</option>
            <option value="connections">Connections only</option>
            <option value="only_me">Only me</option>
          </select>
        </label>

        <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
          <button type="submit" className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          <Link href="/"><button type="button">Cancel</button></Link>
        </div>
      </form>

      <p style={{ marginTop: 24 }}><Link href="/">Back</Link></p>
    </div>
  )
}
