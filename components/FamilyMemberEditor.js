import { useState, useEffect } from 'react'
import { apiFetch, getToken } from '../lib/api'
import FluffyButton from './FluffyButton'

const RELATIONSHIPS = ['spouse', 'child', 'parent', 'sibling', 'other']
const unwrap = json => { const r = json?.data ?? json; return r }

export default function FamilyMemberEditor({ members = [], onChange, readOnly }) {
  const [list, setList] = useState(members || [])
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('other')
  const [profileLinkId, setProfileLinkId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { setList(members || []) }, [members])

  async function addMember() {
    const v = name.trim()
    if (!v) return
    const payload = { name: v, relationship, profile_link: profileLinkId ? Number(profileLinkId) : null }
    const token = getToken()
    if (token) {
      setSaving(true)
      try {
        const res = await apiFetch('/profiles/family-members/', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          const created = unwrap(await res.json())
          const next = [...list, created]
          setList(next)
          setName('')
          setProfileLinkId('')
          onChange && onChange(next)
        }
      } finally {
        setSaving(false)
      }
    } else {
      const next = [...list, { ...payload, id: `local-${Date.now()}` }]
      setList(next)
      setName('')
      setProfileLinkId('')
      onChange && onChange(next)
    }
  }

  async function remove(idx) {
    const item = list[idx]
    const next = list.filter((_, i) => i !== idx)
    setList(next)
    onChange && onChange(next)
    const token = getToken()
    if (item?.id && !String(item.id).startsWith('local-') && token) {
      setSaving(true)
      try {
        await apiFetch(`/profiles/family-members/${item.id}/`, { method: 'DELETE' })
      } finally {
        setSaving(false)
      }
    }
  }

  return (
    <div className="family-editor">
      {!readOnly && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Family member name"
            style={{ minWidth: 140 }}
          />
          <select value={relationship} onChange={e => setRelationship(e.target.value)}>
            {RELATIONSHIPS.map(r => (
              <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
            ))}
          </select>
          <input
            value={profileLinkId}
            onChange={e => setProfileLinkId(e.target.value)}
            placeholder="Profile user ID (optional)"
            style={{ minWidth: 100 }}
            type="number"
          />
          <FluffyButton onClick={addMember} disabled={saving} label={saving ? '…' : 'Add'} width={72} height={38} strands={400} strandLen={5} fontSize={13} />
        </div>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {list.map((m, i) => (
          <li key={m.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <span>
              <strong>{m.name}</strong>
              <span style={{ color: 'var(--muted)', marginLeft: 8 }}>({m.relationship || 'other'})</span>
              {m.profile_link_detail && (
                <a href={`/profile/${m.profile_link}`} style={{ marginLeft: 8 }}>View profile</a>
              )}
            </span>
            {!readOnly && (
              <button type="button" onClick={() => remove(i)} disabled={saving}>Remove</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
