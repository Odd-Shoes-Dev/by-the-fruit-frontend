import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { apiFetch, getToken } from '../../lib/api'

const CHECK_RANGES = ['1000-5000', '5000-10000', '10000-20000', '20000-50000', '50000-100000', '100000+']
const CATEGORIES = ['technology', 'finance', 'retail', 'healthcare', 'education', 'manufacturing', 'agriculture', 'real_estate', 'hospitality', 'logistics', 'other']

export default function OnboardingInvestor() {
  const router = useRouter()
  const [bio, setBio] = useState('')
  const [checkSizeRange, setCheckSizeRange] = useState('1000-5000')
  const [investmentType, setInvestmentType] = useState('other')
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login')
      return
    }
  }, [router])

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('saving')
    try {
      const res = await apiFetch('/profiles/investment-profiles/', {
        method: 'POST',
        body: JSON.stringify({
          bio: bio || '',
          check_size_range: checkSizeRange,
          investment_type: investmentType
        })
      })
      if (res.ok) {
        setStatus('saved')
        setTimeout(() => router.push('/profile/settings'), 1500)
        return
      }
      setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  if (!getToken()) return <div className="container"><p>Redirecting to login…</p></div>

  return (
    <>
      <Head><title>Complete your investor profile — By The Fruit</title></Head>
      <motion.div className="container" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ maxWidth: 560 }}>
        <h2>Complete your investor profile</h2>
        <p className="meta">Share a bit about your interests so founders can connect.</p>

        {status === 'saved' ? (
          <p className="success">Profile saved. Taking you to settings…</p>
        ) : (
          <form onSubmit={handleSubmit} className="form">
            <label>Short bio
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="What draws you to faith-aligned investing?" />
            </label>
            <label>Check size range
              <select value={checkSizeRange} onChange={e => setCheckSizeRange(e.target.value)}>
                {CHECK_RANGES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>Investment focus
              <select value={investmentType} onChange={e => setInvestmentType(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </label>
            {status === 'error' && <p className="error">Something went wrong. Try again.</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" type="submit" disabled={status === 'saving'}>{status === 'saving' ? 'Saving…' : 'Save'}</button>
              <Link href="/profile/settings"><button type="button">Skip for now</button></Link>
            </div>
          </form>
        )}

        <p style={{ marginTop: 24 }}><Link href="/">Back to home</Link></p>
      </motion.div>
    </>
  )
}
