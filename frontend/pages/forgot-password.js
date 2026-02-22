import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { apiFetch } from '../lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await apiFetch('/user/request-reset-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      <Head><title>Forgot password — By The Fruit</title></Head>
      <motion.div className="container" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 420 }}>
        <h2>Forgot password</h2>
        <p className="meta">Enter your email to receive a reset link.</p>
        {status === 'sent' ? (
          <div className="card" style={{ marginTop: 16 }}>
            <p>If an account exists for that email, we sent a reset link. Check your inbox and spam.</p>
            <Link href="/login">Back to login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form" style={{ marginTop: 16 }}>
            <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
            {status === 'error' && <p className="error">Something went wrong.</p>}
            <button className="btn" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send reset link'}</button>
          </form>
        )}
        <p style={{ marginTop: 24 }}><Link href="/login">Back to login</Link></p>
      </motion.div>
    </>
  )
}
