import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiFetch } from '../lib/api'
import FluffyButton from '../components/FluffyButton'
import styles from '../styles/Auth.module.css'

export default function ResetPassword() {
  const router = useRouter()
  const { uidb64, token } = router.query
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!uidb64 || !token) return
    setStatus('checking')
    apiFetch(`/user/password-reset/${uidb64}/${token}`)
      .then(res => setStatus(res.ok ? 'valid' : 'invalid'))
      .catch(() => setStatus('invalid'))
  }, [uidb64, token])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm || password.length < 8) return
    setStatus('saving')
    try {
      const res = await apiFetch('/user/password-reset-complete', {
        method: 'PATCH',
        body: JSON.stringify({ password, token, uidb64 })
      })
      if (res.ok) { setStatus('saved'); setTimeout(() => router.push('/login'), 2000); return }
      setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  function renderBody() {
    if (!uidb64 || !token) return (
      <>
        <p className={styles.authSub}>Use the link from your password reset email.</p>
        <div className={styles.authFooter}>
          <Link href="/forgot-password" className={styles.authLink}>Request a new link</Link>
        </div>
      </>
    )
    if (status === 'checking') return <p className={styles.authSub}>Checking link...</p>
    if (status === 'invalid') return (
      <>
        <div className={styles.errorBox}>This link is invalid or has expired.</div>
        <div className={styles.authFooter}>
          <Link href="/forgot-password" className={styles.authLink}>Request a new link</Link>
        </div>
      </>
    )
    if (status === 'saved') return (
      <div className={styles.successBox}>
        <p style={{ margin: 0 }}>Password updated. Redirecting to login...</p>
      </div>
    )
    return (
      <form onSubmit={handleSubmit} className={styles.authForm}>
        <label className={styles.fieldLabel}>
          New password <span className={styles.optional}>(min 8 characters)</span>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required placeholder="New password" className={styles.fieldInput} />
        </label>
        <label className={styles.fieldLabel}>
          Confirm password
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} minLength={8} required placeholder="Confirm password" className={styles.fieldInput} />
        </label>
        {password && confirm && password !== confirm && (
          <div className={styles.errorBox}>Passwords do not match.</div>
        )}
        {status === 'error' && <div className={styles.errorBox}>Something went wrong. Please try again.</div>}
        <FluffyButton
          type="submit"
          disabled={status === 'saving' || password !== confirm || password.length < 8}
          label={status === 'saving' ? 'Saving…' : 'Save password'}
          fullWidth
          height={48}
          strands={1500}
          strandLen={8}
          fontSize={15}
        />
        <div className={styles.authFooter}>
          <Link href="/login" className={styles.authLink}>Back to login</Link>
        </div>
      </form>
    )
  }

  return (
    <>
      <Head><title>Set new password - By The Fruit</title></Head>
      <div className={styles.authPage}>
        <motion.div
          className={styles.authCard}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Link href="/" className={styles.authLogo}>
            <Image src="/images/logo.png" alt="By The Fruit" width={44} height={44} />
            <span style={{ fontStyle: 'italic' }}><span style={{ fontSize: '1.2em' }}>B</span>y <span style={{ fontSize: '1.2em' }}>T</span>he <span style={{ fontSize: '1.2em' }}>F</span>ruit</span>
          </Link>
          <h1 className={styles.authTitle}>Set new password</h1>
          {renderBody()}
        </motion.div>
      </div>
      <div className={styles.authPageBar}>
        <span>© {new Date().getFullYear()} By The Fruit</span>
        <Link href="/">Home</Link>
      </div>
    </>
  )
}
