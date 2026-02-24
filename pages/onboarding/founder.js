import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { apiFetch, getToken } from '../../lib/api'

const CATEGORIES = ['technology', 'finance', 'retail', 'healthcare', 'education', 'manufacturing', 'agriculture', 'real_estate', 'hospitality', 'logistics', 'other']

export default function OnboardingFounder() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [token, setToken] = useState(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('other')
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const t = getToken()
    setToken(t)
    setMounted(true)
    if (!t) router.replace('/login')
  }, [router])

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('saving')
    try {
      const res = await apiFetch('/profiles/businesses/', {
        method: 'POST',
        body: JSON.stringify({ name: name || 'My Company', category, description: description || '', website: website || null })
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

  if (!mounted) return <div className="container"><div className="spinner">Loading…</div></div>
  if (!token) return <div className="container"><div className="spinner">Redirecting…</div></div>

  return (
    <>
      <Head><title>Complete your founder profile — By The Fruit</title></Head>
      <motion.div
        className="container"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ maxWidth: 560 }}
      >
        <h2>Complete your founder profile</h2>
        <p className="meta">Add your company so other members can discover you.</p>

        {status === 'saved' ? (
          <p className="success">Profile saved. Taking you to settings…</p>
        ) : (
          <form onSubmit={handleSubmit} className="form">
            <label>Company name
              <input value={name} onChange={e => setName(e.target.value)} placeholder="My Company" />
            </label>
            <label>Category
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </label>
            <label>Short description
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What does your company do?" />
            </label>
            <label>Website (optional)
              <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" />
            </label>
            {status === 'error' && <p className="error">Something went wrong. Try again.</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" type="submit" disabled={status === 'saving'}>{status === 'saving' ? 'Saving…' : 'Save'}</button>
              <Link href="/profile/settings" className="btn-ghost">Skip for now</Link>
            </div>
          </form>
        )}
      </motion.div>
    </>
  )
}
