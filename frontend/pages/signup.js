import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'

export default function Signup() {
  const router = useRouter()
  const role = router.query.role || ''
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [location, setLocation] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [newsletterOptIn, setNewsletterOptIn] = useState(false)
  const [saved, setSaved] = useState(false)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const res = await fetch(`${API_BASE}/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, full_name: name, password,
          newsletter_opt_in: newsletterOptIn,
          ...(location && { location }),
          ...(address && { address }),
          ...(phone && { phone }),
          ...(postalCode && { postal_code: postalCode })
        })
      })
      if (res.ok) {
        if (role === 'founder' || role === 'investor') {
          if (typeof window !== 'undefined') localStorage.setItem('btf_pending_role', role)
        }
        setSaved(true)
        return
      }
    } catch (err) {}
    // Fallback: localStorage
    const users = JSON.parse(localStorage.getItem('btf_users') || '[]')
    users.unshift({ id: Date.now(), email, name, location, address, phone, postal_code: postalCode })
    localStorage.setItem('btf_users', JSON.stringify(users))
    setSaved(true)
  }

  return (
    <motion.div className="container" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <h2>Join the waitlist{role === 'founder' ? ' as Founder' : role === 'investor' ? ' as Investor' : ''}</h2>
      {saved ? (
        <div>
          <p><strong>You&apos;re on the waitlist.</strong></p>
          <p>We review each request to keep the community trusted. We may contact you by email before approving. Once approved, you can log in and access the full app.</p>
          <p><Link href="/login">Log in</Link> to check your status, or <Link href="/">Back to home</Link>.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="form">
          <label>Full name
            <input value={name} onChange={e => setName(e.target.value)} required />
          </label>
          <label>Email
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label>Password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
          </label>
          <h4 style={{ marginTop: 12, marginBottom: 6 }}>Contact &amp; Location (optional)</h4>
          <label>Location
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City / Region" />
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
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={newsletterOptIn} onChange={e => setNewsletterOptIn(e.target.checked)} />
            <span>The latest news about By the Fruit in your inbox? Sign me up!</span>
          </label>
          <p className="small" style={{ marginTop: 8, marginBottom: 12 }}>
            Community access is by approval only. Joining the waitlist does not guarantee access. We protect our members by reviewing each request.
          </p>
          <div>
            <button className="btn" type="submit">Submit</button>
            <Link href="/login"><button type="button" style={{ marginLeft: 8 }}>Log in</button></Link>
          </div>
        </form>
      )}
    </motion.div>
  )
}
