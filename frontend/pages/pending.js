import Head from 'next/head'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { getToken, getStoredUser, clearAuth, isApproved } from '../lib/api'

export default function Pending() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!getToken()) {
      router.replace('/login')
      return
    }
    if (isApproved()) {
      router.replace('/')
      return
    }
  }, [router])

  const user = typeof window !== 'undefined' ? getStoredUser() : null
  const status = user?.approval_status ?? user?.user_data?.approval_status

  return (
    <>
      <Head>
        <title>Request pending — By The Fruit</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="container" style={{ maxWidth: 520, marginTop: 48, textAlign: 'center' }}>
        <div style={{ background: '#f9fafb', border: '1px solid #eee', borderRadius: 12, padding: 32, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h1 style={{ marginTop: 0, color: 'var(--dark)' }}>Request pending</h1>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
            Thanks for joining the waitlist. Your request to join the By the Fruit community is under review.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
            We may reach out by email before approving. Once approved, you&apos;ll be able to access the full app—feed, connections, channels, and events.
          </p>
          <p style={{ marginTop: 24, fontWeight: 600, color: 'var(--teal, #2a9d8f)' }}>
            You&apos;re on the list. We&apos;ll be in touch.
          </p>
          <div style={{ marginTop: 28, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/"><button className="btn">Back to home</button></Link>
            <button
              type="button"
              className="btn"
              style={{ background: '#fff', color: 'var(--orange)', border: '1px solid var(--orange)' }}
              onClick={() => { clearAuth(); router.push('/login') }}
            >
              Log out
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
