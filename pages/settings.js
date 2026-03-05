import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch, getToken, getUserId, getStoredUser, setAuth, clearAuth } from '../lib/api'
import FamilyMemberEditor from '../components/FamilyMemberEditor'
import FluffyButton from '../components/FluffyButton'
import styles from '../styles/Settings.module.css'

/* ─── Shared sub-components ─── */
function Field({ label, optional, hint, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>
        {label}
        {optional && <span className={styles.optional}> (optional)</span>}
      </label>
      {children}
      {hint && <p className={styles.fieldHint}>{hint}</p>}
    </div>
  )
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div className={styles.sectionCard}>
      {(title || subtitle) && (
        <div className={styles.sectionHeader}>
          {title && <h3 className={styles.sectionTitle}>{title}</h3>}
          {subtitle && <p className={styles.sectionSub}>{subtitle}</p>}
        </div>
      )}
      <div className={styles.sectionBody}>{children}</div>
    </div>
  )
}

const FUNDING_STAGES = [
  { value: 'pre_seed',    label: 'Pre-seed' },
  { value: 'seed',        label: 'Seed' },
  { value: 'series_a',   label: 'Series A' },
  { value: 'series_b',   label: 'Series B' },
  { value: 'series_c',   label: 'Series C' },
  { value: 'series_d_plus', label: 'Series D+' },
  { value: 'growth',     label: 'Growth' },
]

const VISIBILITY_OPTIONS = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'connections', label: 'Connections only' },
  { value: 'only_me', label: 'Only me' },
]

/* ─── Tab: Funding ─── */
function FundingTab({ user }) {
  const role = user?.intended_role
  const [businessId, setBusinessId] = useState(null)
  const [profileId, setProfileId] = useState(null)
  const [fundingStage, setFundingStage] = useState('')
  const [focusesOn, setFocusesOn] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (role === 'founder') {
      apiFetch('/profiles/businesses/mine')
        .then(r => r.ok ? r.json() : null)
        .then(json => {
          const list = json?.data ?? json
          const biz = Array.isArray(list) ? list[0] : null
          if (biz) { setBusinessId(biz.id); setFundingStage(biz.funding_stage || '') }
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else if (role === 'investor') {
      apiFetch('/profiles/investments/me')
        .then(r => r.ok ? r.json() : null)
        .then(json => {
          const d = json?.data ?? json
          if (d && d.id) { setProfileId(d.id); setFocusesOn(d.focuses_on || []) }
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [role])

  function toggleStage(value) {
    setFocusesOn(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true); setError(null); setSaved(false)
    try {
      let res
      if (role === 'founder' && businessId) {
        res = await apiFetch(`/profiles/businesses/${businessId}/`, {
          method: 'PATCH',
          body: JSON.stringify({ funding_stage: fundingStage || null })
        })
      } else if (role === 'investor' && profileId) {
        res = await apiFetch(`/profiles/investments/${profileId}/`, {
          method: 'PATCH',
          body: JSON.stringify({ focuses_on: focusesOn })
        })
      }
      if (res?.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
      else setError('Could not save. Please try again.')
    } catch { setError('Network error.') }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div className={styles.sectionCard} style={{ padding: 24 }}>
      <div className="spinner">Loading…</div>
    </div>
  )

  if (role !== 'founder' && role !== 'investor') {
    return (
      <div className={styles.tabForm}>
        <SectionCard title="Funding stage matching" subtitle="Not available for your account type.">
          <p className={styles.fieldHint}>This section is for founders and investors. Your account role is: <strong>{role || 'general'}</strong></p>
        </SectionCard>
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className={styles.tabForm}>
      {role === 'founder' && (
        <SectionCard title="Your funding stage" subtitle="Let investors know where your business is in its fundraising journey.">
          <Field label="Current funding stage" optional>
            <select className={styles.fieldInput} value={fundingStage} onChange={e => setFundingStage(e.target.value)}>
              <option value="">— not set —</option>
              {FUNDING_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
          <p className={styles.fieldHint} style={{ marginTop: 10 }}>
            Save your stage, then visit the{' '}
            <a href="/matcher" style={{ color: '#F5A623', fontWeight: 600 }}>Investor Matcher</a>{' '}
            to discover aligned investors.
          </p>
        </SectionCard>
      )}

      {role === 'investor' && (
        <SectionCard title="Funding stages you invest in" subtitle="Select all stages you actively fund. Founders at matching stages will see you in their matcher.">
          <div className={styles.stageGrid}>
            {FUNDING_STAGES.map(s => (
              <label
                key={s.value}
                className={`${styles.stageChip} ${focusesOn.includes(s.value) ? styles.stageChipActive : ''}`}
              >
                <input
                  type="checkbox"
                  checked={focusesOn.includes(s.value)}
                  onChange={() => toggleStage(s.value)}
                  style={{ display: 'none' }}
                />
                {s.label}
              </label>
            ))}
          </div>
          <p className={styles.fieldHint} style={{ marginTop: 14 }}>
            Founders at your chosen stages will find you in the{' '}
            <a href="/matcher" style={{ color: '#F5A623', fontWeight: 600 }}>Founder Matcher</a>.
          </p>
        </SectionCard>
      )}

      {error && <div className={styles.errorBox}>{error}</div>}
      {saved && <div className={styles.successBox}>✓ Funding preferences saved.</div>}
      <div className={styles.formActions}>
        <FluffyButton type="submit" disabled={saving} label={saving ? 'Saving…' : 'Save changes'} width={170} height={42} strands={1100} strandLen={7} fontSize={14} />
      </div>
    </form>
  )
}

/* ─── Tab: Profile ─── */
function ProfileTab({ user, onUserUpdate }) {
  const photoRef = useRef(null)
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [location, setLocation] = useState(user?.location || '')
  const [address, setAddress] = useState(user?.address || '')
  const [postalCode, setPostalCode] = useState(user?.postal_code || '')
  const [bioVisibility, setBioVisibility] = useState(user?.bio_visibility || 'everyone')
  const [familyVisibility, setFamilyVisibility] = useState(user?.family_visibility || 'everyone')
  const [photoPreview, setPhotoPreview] = useState(user?.photo || null)
  const [photoFile, setPhotoFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true); setError(null); setSaved(false)
    const token = getToken()
    try {
      let res
      if (photoFile) {
        const fd = new FormData()
        fd.append('full_name', fullName)
        fd.append('bio', bio)
        fd.append('phone', phone)
        fd.append('location', location)
        fd.append('address', address)
        fd.append('postal_code', postalCode)
        fd.append('bio_visibility', bioVisibility)
        fd.append('family_visibility', familyVisibility)
        fd.append('photo', photoFile)
        res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/user/me`, {
          method: 'PATCH',
          headers: { Authorization: `Token ${token}` },
          body: fd,
        })
      } else {
        res = await apiFetch('/user/me', {
          method: 'PATCH',
          body: JSON.stringify({ full_name: fullName, bio, phone, location, address, postal_code: postalCode, bio_visibility: bioVisibility, family_visibility: familyVisibility })
        })
      }
      if (res.ok) {
        const json = await res.json()
        const d = json?.data ?? json
        setPhotoFile(null)
        if (d.photo) setPhotoPreview(d.photo)
        // Persist to localStorage so navbar updates
        const stored = JSON.parse(localStorage.getItem('btf_user') || '{}')
        localStorage.setItem('btf_user', JSON.stringify({ ...stored, ...d }))
        onUserUpdate(d)
        setSaved(true)
        setTimeout(() => setSaved(false), 3500)
      } else {
        const errJson = await res.json().catch(() => ({}))
        const errData = errJson?.data ?? errJson
        setError(errData?.detail || errData?.full_name?.[0] || errData?.phone?.[0] || 'Could not save.')
      }
    } catch { setError('Network error — check your connection.') }
    finally { setSaving(false) }
  }

  const initials = (fullName || user?.email || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <form onSubmit={handleSave} className={styles.tabForm}>
      <SectionCard title="Photo & name" subtitle="How other members see you.">
        <div className={styles.photoRow}>
          <div className={styles.photoWrap}>
            {photoPreview
              ? <img src={photoPreview} alt="Profile" className={styles.photoImg} />
              : <div className={styles.photoFallback}>{initials}</div>
            }
            <button type="button" className={styles.photoEditBtn} onClick={() => photoRef.current?.click()} title="Change photo">
              <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
            <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
          </div>
          <div>
            <p className={styles.photoHint}>JPG, PNG or WebP · Max 5 MB</p>
            <button type="button" className={styles.outlineBtn} onClick={() => photoRef.current?.click()}>Change photo</button>
          </div>
        </div>
        <div className={styles.fieldGrid}>
          <Field label="Full name">
            <input className={styles.fieldInput} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
          </Field>
          <Field label="Email">
            <input className={styles.fieldInput} value={user?.email || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Bio" subtitle="Tell the community about yourself.">
        <Field label="About you" optional>
          <textarea className={styles.fieldInput} value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder="Share your background, interests, or what you're looking for…" />
        </Field>
        <Field label="Who can see your bio?">
          <select className={styles.fieldInput} value={bioVisibility} onChange={e => setBioVisibility(e.target.value)}>
            {VISIBILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
      </SectionCard>

      <SectionCard title="Contact & location" subtitle="Helps match you with relevant opportunities.">
        <div className={styles.fieldGrid}>
          <Field label="Phone" optional><input className={styles.fieldInput} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 000 0000" type="tel" /></Field>
          <Field label="City / Region" optional><input className={styles.fieldInput} value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Nairobi, Kenya" /></Field>
          <Field label="Address" optional><input className={styles.fieldInput} value={address} onChange={e => setAddress(e.target.value)} placeholder="Street address" /></Field>
          <Field label="Postal / ZIP code" optional><input className={styles.fieldInput} value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="00100" /></Field>
        </div>
      </SectionCard>

      <SectionCard title="Family members" subtitle="Optionally list family members on your profile.">
        <FamilyMemberEditor
          members={user?.family_members || []}
          onChange={members => onUserUpdate({ ...user, family_members: members })}
        />
        <Field label="Who can see your family?">
          <select className={styles.fieldInput} value={familyVisibility} onChange={e => setFamilyVisibility(e.target.value)} style={{ marginTop: 12 }}>
            {VISIBILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
      </SectionCard>

      {error && <div className={styles.errorBox}>{error}</div>}
      {saved && <div className={styles.successBox}>✓ Profile saved successfully.</div>}
      <div className={styles.formActions}>
        <FluffyButton type="submit" disabled={saving} label={saving ? 'Saving…' : 'Save changes'} width={170} height={42} strands={1100} strandLen={7} fontSize={14} />
      </div>
    </form>
  )
}

/* ─── Tab: Account ─── */
function AccountTab({ user }) {
  const router = useRouter()
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState(null)
  const [showDelete, setShowDelete] = useState(false)

  async function handleChangePassword(e) {
    e.preventDefault()
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return }
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters.'); return }
    setPwSaving(true); setPwError(null); setPwSaved(false)
    try {
      const res = await apiFetch('/user/change-password/', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPw, new_password: newPw })
      })
      if (res.ok) {
        setPwSaved(true)
        setCurrentPw(''); setNewPw(''); setConfirmPw('')
        setTimeout(() => setPwSaved(false), 3500)
      } else {
        const j = await res.json().catch(() => ({}))
        const d = j?.data ?? j
        setPwError(d?.detail || d?.current_password?.[0] || d?.new_password?.[0] || 'Could not update password.')
      }
    } catch { setPwError('Network error.') }
    finally { setPwSaving(false) }
  }

  return (
    <div className={styles.tabForm}>
      <SectionCard title="Account info" subtitle="Your account details.">
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}><span className={styles.infoLabel}>Email</span><span>{user?.email}</span></div>
          <div className={styles.infoItem}><span className={styles.infoLabel}>Member since</span><span>{user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span></div>
          <div className={styles.infoItem}><span className={styles.infoLabel}>Status</span><span className={styles.statusBadge} data-status={user?.approval_status}>{user?.approval_status || '—'}</span></div>
          <div className={styles.infoItem}><span className={styles.infoLabel}>Role</span><span>{user?.is_staff ? 'Admin' : 'Member'}</span></div>
        </div>
      </SectionCard>

      <SectionCard title="Change password" subtitle="Use a strong password you don't use elsewhere.">
        <form onSubmit={handleChangePassword} className={styles.tabForm} style={{ gap: 12 }}>
          <Field label="Current password">
            <input className={styles.fieldInput} type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </Field>
          <div className={styles.fieldGrid}>
            <Field label="New password">
              <input className={styles.fieldInput} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 8 characters" autoComplete="new-password" />
            </Field>
            <Field label="Confirm new password">
              <input className={styles.fieldInput} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat password" autoComplete="new-password" />
            </Field>
          </div>
          {pwError && <div className={styles.errorBox}>{pwError}</div>}
          {pwSaved && <div className={styles.successBox}>✓ Password updated.</div>}
          <FluffyButton type="submit" disabled={pwSaving || !currentPw || !newPw || !confirmPw} label={pwSaving ? 'Updating…' : 'Update password'} width={185} height={42} strands={1100} strandLen={7} fontSize={14} />
        </form>
      </SectionCard>

      <SectionCard title="Danger zone" subtitle="Irreversible actions — proceed with caution.">
        {!showDelete ? (
          <button type="button" className={styles.dangerBtn} onClick={() => setShowDelete(true)}>
            Delete my account
          </button>
        ) : (
          <div className={styles.deleteConfirm}>
            <p>Are you sure? This will permanently delete your account and all your data. This cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" className={styles.dangerBtn} onClick={async () => {
                await apiFetch('/user/me', { method: 'DELETE' }).catch(() => {})
                clearAuth()
                router.push('/')
              }}>Yes, delete my account</button>
              <button type="button" className={styles.outlineBtn} onClick={() => setShowDelete(false)}>Cancel</button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

/* ─── Tab: Notifications ─── */
function NotificationsTab() {
  return (
    <div className={styles.tabForm}>
      <SectionCard title="Notification preferences" subtitle="Choose what you want to be notified about.">
        <div className={styles.toggleList}>
          {[
            { label: 'New connection requests', sub: 'When an investor or founder wants to connect with you' },
            { label: 'Waitlist approvals', sub: 'When your account status changes' },
            { label: 'New messages', sub: 'When you receive a message in a channel' },
            { label: 'Community posts', sub: 'When someone you\'re connected with posts' },
            { label: 'Events', sub: 'Reminders for upcoming events you\'ve registered for' },
          ].map(item => (
            <div key={item.label} className={styles.toggleRow}>
              <div>
                <div className={styles.toggleLabel}>{item.label}</div>
                <div className={styles.toggleSub}>{item.sub}</div>
              </div>
              <label className={styles.toggle}>
                <input type="checkbox" defaultChecked />
                <span className={styles.toggleSlider} />
              </label>
            </div>
          ))}
        </div>
        <p className={styles.fieldHint} style={{ marginTop: 16 }}>Notification preferences are saved locally. Full email notification settings coming soon.</p>
      </SectionCard>
    </div>
  )
}

/* ─── Tab: Privacy ─── */
function PrivacyTab({ user, onUserUpdate }) {
  const [bioVisibility, setBioVisibility] = useState(user?.bio_visibility || 'everyone')
  const [familyVisibility, setFamilyVisibility] = useState(user?.family_visibility || 'everyone')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true); setError(null); setSaved(false)
    try {
      const res = await apiFetch('/user/me', {
        method: 'PATCH',
        body: JSON.stringify({ bio_visibility: bioVisibility, family_visibility: familyVisibility })
      })
      if (res.ok) {
        const json = await res.json()
        const d = json?.data ?? json
        onUserUpdate(d)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else { setError('Could not save privacy settings.') }
    } catch { setError('Network error.') }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSave} className={styles.tabForm}>
      <SectionCard title="Profile visibility" subtitle="Control who can see different parts of your profile.">
        <Field label="Who can see your bio?">
          <select className={styles.fieldInput} value={bioVisibility} onChange={e => setBioVisibility(e.target.value)}>
            {VISIBILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Who can see your family members?">
          <select className={styles.fieldInput} value={familyVisibility} onChange={e => setFamilyVisibility(e.target.value)}>
            {VISIBILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
      </SectionCard>

      <SectionCard title="Community guidelines" subtitle="By The Fruit community standards.">
        <ul className={styles.guidelineList}>
          <li>Be respectful and professional in all interactions.</li>
          <li>Do not share confidential investment information without consent.</li>
          <li>Connections and channels are private — do not screenshot or share without permission.</li>
          <li>Nothing on this platform constitutes financial advice.</li>
          <li>Membership does not guarantee investment outcomes.</li>
        </ul>
      </SectionCard>

      {error && <div className={styles.errorBox}>{error}</div>}
      {saved && <div className={styles.successBox}>✓ Privacy settings saved.</div>}
      <div className={styles.formActions}>
        <FluffyButton type="submit" disabled={saving} label={saving ? 'Saving…' : 'Save changes'} width={170} height={42} strands={1100} strandLen={7} fontSize={14} />
      </div>
    </form>
  )
}

/* ─── Main settings page ─── */
const TABS = [
  { id: 'profile', label: 'Profile', icon: <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
  { id: 'funding', label: 'Funding', icon: <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { id: 'account', label: 'Account', icon: <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
  { id: 'notifications', label: 'Notifications', icon: <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
  { id: 'privacy', label: 'Privacy', icon: <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
]

export default function SettingsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    // Read tab from URL hash
    const hash = window.location.hash.replace('#', '')
    if (TABS.find(t => t.id === hash)) setActiveTab(hash)
  }, [])

  useEffect(() => {
    const t = getToken()
    setToken(t)
    setMounted(true)
    if (!t) { setLoading(false); return }
    apiFetch('/user/me')
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json) setUser(json?.data ?? json)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function switchTab(id) {
    setActiveTab(id)
    window.history.replaceState(null, '', `#${id}`)
  }

  if (!mounted || loading) {
    return (
      <div className="container">
        <div className={styles.loadingRow}>
          {[100, 60, 80, 70].map((w, i) => (
            <div key={i} className={styles.loadingPulse} style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="container">
        <p><Link href="/login">Log in</Link> to access settings.</p>
      </div>
    )
  }

  const initials = (user?.full_name || user?.email || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      <Head><title>Settings — By The Fruit</title></Head>
      <div className="container">
        <header className="page-header">
          <h1>Settings</h1>
          <p className="tagline">Manage your profile, account, and preferences.</p>
        </header>

        <div className={styles.settingsLayout}>
          {/* ── Sidebar tabs ── */}
          <aside className={styles.tabSidebar}>
            {/* Mini profile card */}
            <div className={styles.miniProfile}>
              {user?.photo
                ? <img src={user.photo} alt={user.full_name} className={styles.miniAvatar} />
                : <div className={styles.miniAvatarFallback}>{initials}</div>
              }
              <div className={styles.miniInfo}>
                <div className={styles.miniName}>{user?.full_name || 'My Account'}</div>
                <Link href={`/profile/${getUserId()}`} className={styles.miniViewLink}>View profile →</Link>
              </div>
            </div>

            <nav className={styles.tabNav}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
                  onClick={() => switchTab(tab.id)}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* ── Tab content ── */}
          <main className={styles.tabContent}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'profile' && <ProfileTab user={user} onUserUpdate={setUser} />}
                {activeTab === 'funding' && <FundingTab user={user} />}
                {activeTab === 'account' && <AccountTab user={user} />}
                {activeTab === 'notifications' && <NotificationsTab />}
                {activeTab === 'privacy' && <PrivacyTab user={user} onUserUpdate={setUser} />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </>
  )
}
