import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getToken } from '../lib/api'
import styles from '../styles/Offerings.module.css'

const SALLY_PORTAL_URL = process.env.NEXT_PUBLIC_SALLY_PORTAL_URL || 'https://auth.sally.co/'

export default function PortfolioPage() {
  const [token, setToken] = useState(null)

  useEffect(() => {
    setToken(getToken())
  }, [])

  return (
    <>
      <Head><title>My Portfolio — By The Fruit</title></Head>
      <div className="container">
        <div className={styles.header}>
          <p className={styles.eyebrow}>Investor Dashboard</p>
          <h1 className={styles.title}>My Portfolio</h1>
          <p className={styles.sub}>Investment lifecycle is now managed directly in Sally.</p>
        </div>

        {!token && (
          <div className={styles.loginPrompt}>
            <p><Link href="/login">Log in</Link> to access your account and continue on Sally.</p>
          </div>
        )}

        <div className={styles.empty}>
          <p>Commitments, KYC status, funding, and signed agreements are tracked in Sally.</p>
          <a href={SALLY_PORTAL_URL} target="_blank" rel="noreferrer" className={styles.viewBtn} style={{ display: 'inline-block', marginTop: 12 }}>
            Open Sally Portfolio →
          </a>
        </div>
      </div>
    </>
  )
}
