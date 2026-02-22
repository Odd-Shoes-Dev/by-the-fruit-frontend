import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { setAuth, getToken } from '../lib/api'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [ok, setOk] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`${API_BASE}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (res.ok) {
        const result = await res.json()
        const raw = result?.user
        const token = raw?.token
        if (raw && token) {
          const user = raw.user_data ? { ...raw.user_data, token } : { ...raw }
          setAuth(user, token)
          setOk(true)
          if (typeof window !== 'undefined') {
            const approved = user.approval_status === 'approved' || user.is_staff
            if (!approved) {
              window.location.href = '/pending'
              return
            }
            const pending = localStorage.getItem('btf_pending_role')
            if (pending === 'founder' || pending === 'investor') {
              localStorage.removeItem('btf_pending_role')
              window.location.href = `/onboarding/${pending}`
              return
            }
            window.location.href = '/'
            return
          }
          return
        }
      }
      const errData = await res.json().catch(() => ({}))
      setError(errData?.error || 'Login failed')
    } catch (e) {
      setError('Network error — try again')
    }

    // Fallback: localStorage mock when API not available
    const users = JSON.parse(localStorage.getItem('btf_users') || '[]')
    const found = users.find(u => u.email === email)
    if (found) {
      localStorage.setItem('btf_session', JSON.stringify({ userId: found.id }))
      setOk(true)
    } else {
      setError('No account found')
    }
  }

  return (
    <motion.div className="container" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <h2>Log in</h2>
      {ok ? (
        <div>
          <p>Logged in successfully.</p>
          <p><Link href="/">Go to home</Link></p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="form">
          <label>Email
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label>Password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </label>
          {error && <div className="error">{error}</div>}
          <div>
            <button className="btn" type="submit">Log in</button>
            <Link href="/signup"><button style={{ marginLeft: 8 }}>Sign up</button></Link>
          </div>
          <p style={{ marginTop: 12 }}><Link href="/forgot-password">Forgot password?</Link></p>
        </form>
      )}
    </motion.div>
  )
}
