import { useRouter } from 'next/router'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import InvestorProfileForm from '../../components/InvestorProfileForm'
import FounderProfileForm from '../../components/FounderProfileForm'
import { apiFetch, getToken, getUserId } from '../../lib/api'

export default function ProfilePage() {
  const router = useRouter()
  const { id } = router.query
  const [profile, setProfile] = useState(null)
  const [type, setType] = useState(null) // 'founder' | 'investor'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id || !getToken()) {
      if (!getToken()) setError('Log in to view profiles.')
      setLoading(false)
      return
    }
    let mounted = true
    apiFetch(`/user/${id}`)
      .then(res => {
        if (!mounted) return
        if (res.ok) return res.json()
        if (res.status === 403 || res.status === 404) setError('Profile not found or access denied.')
        return null
      })
      .then(data => {
        if (!mounted || !data) {
          setLoading(false)
          return
        }
        const hasBusiness = data.businesses && data.businesses.length > 0
        const hasInvestorProfile = data.investment_profiles && data.investment_profiles.length > 0
        setProfile({
          ...data,
          name: data.full_name,
          company: data.businesses?.[0]?.name,
          bio: data.bio || data.investment_profiles?.[0]?.bio,
          family: (data.family_members || []).map(f => f.name || f.relationship)
        })
        setType(hasBusiness ? 'founder' : hasInvestorProfile ? 'investor' : 'founder')
        setLoading(false)
      })
      .catch(() => {
        if (mounted) {
          setError('Failed to load profile.')
          setLoading(false)
        }
      })
    return () => { mounted = false }
  }, [id])

  function handleSave(data) {
    setProfile(prev => ({ ...prev, ...data }))
  }

  const isOwnProfile = String(getUserId()) === String(id)

  if (loading) return <div className="container"><p>Loading…</p></div>
  if (error || !profile) return <div className="container"><p>{error || 'Profile not found.'}</p><Link href="/">Back to home</Link></div>

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="container"
      style={{ padding: 20 }}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        {profile.photo ? (
          <img src={profile.photo} alt={profile.full_name} width={160} height={160} style={{ borderRadius: '50%', objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
        ) : (
          <div style={{ width: 160, height: 160, borderRadius: '50%', background: '#f0f0f0', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: 'var(--muted)' }}>{profile.full_name?.[0] || '?'}</div>
        )}
      </div>
      <h2>{profile.full_name || profile.name}</h2>
      {profile.bio && <p>{profile.bio}</p>}
      {profile.company && <p className="meta">{profile.company}</p>}
      {profile.family_members?.length > 0 && (
        <>
          <h3>Family</h3>
          <ul>
            {profile.family_members.map((f, idx) => <li key={idx}>{f.name} {f.relationship && `(${f.relationship})`}</li>)}
          </ul>
        </>
      )}

      {isOwnProfile && (
        <>
          <h3>Edit</h3>
          {type === 'founder' ? (
            <FounderProfileForm initial={profile} onSave={handleSave} />
          ) : (
            <InvestorProfileForm initial={profile} onSave={handleSave} />
          )}
        </>
      )}

      <p style={{ marginTop: 24 }}><Link href="/">Back to home</Link></p>
    </motion.div>
  )
}
