import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiFetch, getToken, getStoredUser } from '../lib/api'
import ConnectionButtons from '../components/ConnectionButtons'
import FluffyButton from '../components/FluffyButton'

const STAGE_LABELS = {
  pre_seed: 'Pre-seed', seed: 'Seed',
  series_a: 'Series A', series_b: 'Series B', series_c: 'Series C',
  series_d_plus: 'Series D+', growth: 'Growth',
}

function Avatar({ photo, name, size = 52 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (photo) return <img src={photo} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(245,166,35,0.3)' }} />
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#F5A623 0%,#4F6BD9 100%)', color: '#fff', fontWeight: 700, fontSize: size * 0.33, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function InvestorCard({ inv, idx }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <Avatar photo={inv.photo} name={inv.full_name} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <Link href={`/profile/${inv.id}`} style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1208', textDecoration: 'none' }}>
            {inv.full_name || 'Investor'}
          </Link>
          {inv.location && <div style={{ fontSize: '0.8rem', color: 'rgba(26,18,8,0.5)', marginTop: 2 }}>{inv.location}</div>}
          {inv.investment_type && (
            <div style={{ marginTop: 6, fontSize: '0.78rem' }}>
              <span style={{ background: 'rgba(79,107,217,0.08)', color: '#4F6BD9', borderRadius: 6, padding: '2px 9px', fontWeight: 600 }}>
                {inv.investment_type}
              </span>
              {inv.check_size_range && (
                <span style={{ marginLeft: 6, color: 'rgba(26,18,8,0.45)', fontSize: '0.78rem' }}>${inv.check_size_range}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {inv.bio && (
        <p style={{ fontSize: '0.87rem', color: 'rgba(26,18,8,0.65)', lineHeight: 1.55, margin: 0 }}>
          {inv.bio.length > 180 ? inv.bio.slice(0, 180) + '…' : inv.bio}
        </p>
      )}

      {(inv.focuses_on || []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(inv.focuses_on || []).map(s => (
            <span key={s} style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: 12, border: '1.5px solid rgba(245,166,35,0.4)', color: '#c97d0a', fontWeight: 600, background: 'rgba(245,166,35,0.06)' }}>
              {STAGE_LABELS[s] || s}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 2 }}>
        <ConnectionButtons targetUserId={inv.id} viewerRole="founder" />
        <FluffyButton href={`/profile/${inv.id}`} label="View profile" width={120} height={36} strands={900} strandLen={6} fontSize={13} color="#F5A623" />
      </div>
    </motion.div>
  )
}

function FounderCard({ founder, idx }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <Avatar photo={founder.photo} name={founder.full_name} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <Link href={`/profile/${founder.id}`} style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1208', textDecoration: 'none' }}>
            {founder.full_name || 'Founder'}
          </Link>
          {founder.company && <div style={{ fontSize: '0.85rem', color: 'rgba(26,18,8,0.55)', marginTop: 2, fontWeight: 500 }}>{founder.company}</div>}
          <div style={{ marginTop: 6, fontSize: '0.78rem' }}>
            {founder.category && (
              <span style={{ background: 'rgba(79,107,217,0.08)', color: '#4F6BD9', borderRadius: 6, padding: '2px 9px', fontWeight: 600, marginRight: 6 }}>
                {founder.category}
              </span>
            )}
            {founder.funding_stage && (
              <span style={{ background: 'rgba(245,166,35,0.1)', color: '#c97d0a', borderRadius: 6, padding: '2px 9px', fontWeight: 700 }}>
                {STAGE_LABELS[founder.funding_stage] || founder.funding_stage}
              </span>
            )}
          </div>
        </div>
      </div>

      {founder.description && (
        <p style={{ fontSize: '0.87rem', color: 'rgba(26,18,8,0.65)', lineHeight: 1.55, margin: 0 }}>
          {founder.description.length > 180 ? founder.description.slice(0, 180) + '…' : founder.description}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 2 }}>
        <ConnectionButtons targetUserId={founder.id} viewerRole="investor" />
        {founder.website && (
          <a href={founder.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.82rem', color: '#4F6BD9', fontWeight: 500 }}>
            🌐 Website
          </a>
        )}
        <FluffyButton href={`/profile/${founder.id}`} label="View profile" width={120} height={36} strands={900} strandLen={6} fontSize={13} color="#F5A623" />
      </div>
    </motion.div>
  )
}

export default function MatcherPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [role, setRole] = useState(null)
  const [results, setResults] = useState([])
  const [myStage, setMyStage] = useState(null)
  const [myFocuses, setMyFocuses] = useState([])
  const [needsSetup, setNeedsSetup] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return }
    const u = getStoredUser()
    const r = u?.intended_role
    setRole(r)
    setMounted(true)

    if (r === 'founder') {
      apiFetch('/profiles/investments/matches/')
        .then(res => res.ok ? res.json() : null)
        .then(json => {
          const d = json?.data ?? json
          const list = d?.results || []
          const stage = d?.my_stage || null
          setResults(list)
          setMyStage(stage)
          if (!stage) setNeedsSetup(true)
          setLoading(false)
        })
        .catch(e => { setError('Could not load matches.'); setLoading(false) })
    } else if (r === 'investor') {
      apiFetch('/profiles/businesses/matches/')
        .then(res => res.ok ? res.json() : null)
        .then(json => {
          const d = json?.data ?? json
          const list = d?.results || []
          const focuses = d?.my_focuses || []
          setResults(list)
          setMyFocuses(focuses)
          if (!focuses.length) setNeedsSetup(true)
          setLoading(false)
        })
        .catch(e => { setError('Could not load matches.'); setLoading(false) })
    } else {
      setLoading(false)
    }
  }, [router])

  if (!mounted || loading) {
    return (
      <div className="container">
        <div className="spinner">Loading matches…</div>
      </div>
    )
  }

  const isFounder = role === 'founder'
  const isInvestor = role === 'investor'

  return (
    <>
      <Head>
        <title>{isFounder ? 'Investor Matcher' : isInvestor ? 'Founder Matcher' : 'Stage Matcher'} — By The Fruit</title>
      </Head>
      <div className="container">
        {/* Header */}
        <header className="page-header">
          <h1>{isFounder ? '🤝 Investor Matches' : isInvestor ? '🚀 Founder Matches' : 'Stage Matcher'}</h1>
          <p className="tagline" style={{ maxWidth: 560 }}>
            {isFounder && myStage && <>Investors who fund <strong>{STAGE_LABELS[myStage] || myStage}</strong>-stage companies — aligned with your current stage.</>}
            {isFounder && !myStage && 'Investors aligned with your funding stage.'}
            {isInvestor && myFocuses.length > 0 && <>Founders seeking funding at the stages you invest in: {myFocuses.map(s => STAGE_LABELS[s] || s).join(', ')}.</>}
            {isInvestor && !myFocuses.length && 'Founders at the stages you invest in.'}
            {!isFounder && !isInvestor && 'Match founders and investors by funding stage.'}
          </p>
        </header>

        {/* Needs-setup banner */}
        {needsSetup && (
          <div style={{ background: 'rgba(245,166,35,0.08)', border: '1.5px solid rgba(245,166,35,0.3)', borderRadius: 14, padding: '18px 22px', marginBottom: 28, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 700, color: '#c97d0a', marginBottom: 4 }}>
                {isFounder ? 'Set your funding stage to find investors' : 'Choose your focus stages to find founders'}
              </div>
              <div style={{ fontSize: '0.88rem', color: 'rgba(26,18,8,0.6)' }}>
                {isFounder
                  ? 'Tell investors what stage your business is at so they can find you — and you can find them.'
                  : 'Select the funding stages you invest in. We\'ll surface founders actively raising at those stages.'}
              </div>
            </div>
            <FluffyButton href="/settings#funding" label="Set up now →" width={130} height={38} strands={900} strandLen={6} fontSize={13} color="#F5A623" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', padding: '12px 18px', borderRadius: 10, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {/* Not a matching role */}
        {!isFounder && !isInvestor && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(26,18,8,0.45)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🌱</div>
            <p>The matcher is for founders and investors.</p>
            <p style={{ marginTop: 8 }}>
              <Link href="/settings#profile" style={{ color: '#F5A623', fontWeight: 600 }}>Update your profile role</Link>
            </p>
          </div>
        )}

        {/* Results grid */}
        {(isFounder || isInvestor) && (
          <>
            {results.length === 0 && !needsSetup && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(26,18,8,0.45)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
                <p style={{ fontWeight: 600 }}>No matches yet</p>
                <p style={{ marginTop: 6, fontSize: '0.92rem' }}>
                  {isFounder
                    ? 'No investors have set your stage as a focus yet. Check back as the community grows.'
                    : 'No founders have set a matching funding stage yet. Check back soon.'}
                </p>
              </div>
            )}

            {results.length > 0 && (
              <>
                <p style={{ fontSize: '0.88rem', color: 'rgba(26,18,8,0.45)', marginBottom: 20 }}>
                  {results.length} {results.length === 1 ? 'match' : 'matches'} found
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))', gap: 18 }}>
                  {isFounder && results.map((inv, i) => <InvestorCard key={inv.id} inv={inv} idx={i} />)}
                  {isInvestor && results.map((f, i) => <FounderCard key={f.id} founder={f} idx={i} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}
