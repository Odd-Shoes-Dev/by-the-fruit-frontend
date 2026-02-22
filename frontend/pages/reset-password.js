import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiFetch } from '../lib/api'

export default function ResetPassword() {
  const router = useRouter()
  const { uidb64, token } = router.query
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!uidb64 || !token) return
    setStatus('checking')
    apiFetch(`/user/password-reset/${uidb64}/${token}`).then(res => setStatus(res.ok ? 'valid' : 'invalid')).catch(() => setStatus('invalid'))
  }, [uidb64, token])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm || password.length < 8) return
    setStatus('saving')
    try {
      const res = await apiFetch('/user/password-reset-complete', { method: 'PATCH', body: JSON.stringify({ password, token, uidb64 }) })
      if (res.ok) { setStatus('saved'); setTimeout(() => router.push('/login'), 2000); return }
      setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  if (!uidb64 || !token) return <div className="container"><h2>Reset password</h2><p>Use the link from your email.</p><Link href="/forgot-password">Request a new link</Link></div>
  if (status === 'checking') return <div className="container"><p>Checking link…</p></div>
  if (status === 'invalid') return <div className="container"><h2>Invalid or expired link</h2><Link href="/forgot-password">Request a new one</Link></div>

  return (
    <>
      <Head><title>Set new password — By The Fruit</title></Head>
      <motion.div className="container" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 420 }}>
        <h2>Set new password</h2>
        {status === 'saved' ? <p className="success">Password updated. Redirecting to login…</p> : (
          <form onSubmit={handleSubmit} className="form" style={{ marginTop: 16 }}>
            <label>New password (min 8)<input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required /></label>
            <label>Confirm<input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} minLength={8} required /></label>
            {password && confirm && password !== confirm && <p className="error">Passwords don’t match.</p>}
            {status === 'error' && <p className="error">Something went wrong.</p>}
            <button className="btn" type="submit" disabled={status === 'saving' || password !== confirm || password.length < 8}>{status === 'saving' ? 'Saving…' : 'Save password'}</button>
          </form>
        )}
        <p style={{ marginTop: 24 }}><Link href="/login">Back to login</Link></p>
      </motion.div>
    </>
  )
}
