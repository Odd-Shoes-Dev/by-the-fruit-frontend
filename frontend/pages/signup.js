import { useState } from 'react'
import Link from 'next/link'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [location, setLocation] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [postalCode, setPostalCode] = useState('')
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
          ...(location && { location }),
          ...(address && { address }),
          ...(phone && { phone }),
          ...(postalCode && { postal_code: postalCode })
        })
      })
      if (res.ok) {
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
    <div className="container">
      <h2>Sign up</h2>
      {saved ? (
        <div>
          <p>Thanks — check your email for confirmation (simulated).</p>
          <p><Link href="/">Back to home</Link></p>
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
          <div>
            <button className="btn" type="submit">Create account</button>
            <Link href="/login"><button style={{ marginLeft: 8 }}>Log in</button></Link>
          </div>
        </form>
      )}
    </div>
  )
}
