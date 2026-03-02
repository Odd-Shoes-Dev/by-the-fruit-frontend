import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { apiFetch } from '../../lib/api'
import FluffyButton from '../../components/FluffyButton'
import styles from '../../styles/Payment.module.css'

const unwrap = json => json?.data ?? json

export default function PaymentPage() {
  const router = useRouter()
  const { id } = router.query
  const [commitment, setCommitment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    async function load() {
      try {
        const res = await apiFetch(`/profiles/spv-commitments/${id}/`)
        if (res.ok) setCommitment(unwrap(await res.json()))
        else router.replace('/portfolio')
      } catch (e) {}
      setLoading(false)
    }
    load()
  }, [id, router])

  async function handlePay() {
    setPaying(true)
    setError('')
    try {
      const res = await apiFetch(`/profiles/spv-commitments/${id}/create-checkout-session/`, {
        method: 'POST',
      })
      const data = unwrap(await res.json())
      if (res.ok && data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        setError(data?.error || 'Could not start payment. Please try again.')
        setPaying(false)
      }
    } catch (e) {
      setError('Network error. Please try again.')
      setPaying(false)
    }
  }

  if (loading) return <div className="container"><div className="spinner">Loading…</div></div>
  if (!commitment) return null

  return (
    <>
      <Head><title>Fund Commitment — By The Fruit</title></Head>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

          <div className={styles.wrap}>
            <Link href="/portfolio" className={styles.backLink}>← Back to Portfolio</Link>

            <div className={styles.card}>
              <p className={styles.eyebrow}>Complete Investment</p>
              <h1 className={styles.title}>Fund Your Commitment</h1>

              <div className={styles.summaryRow}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Offering</span>
                  <span className={styles.summaryVal}>{commitment.offering_title || '—'}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>SPV</span>
                  <span className={styles.summaryVal}>{commitment.spv_name || '—'}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Amount</span>
                  <span className={styles.summaryVal} style={{ fontSize: '1.6rem', color: 'var(--cream)', fontWeight: 700 }}>
                    ${Number(commitment.amount).toLocaleString()}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Status</span>
                  <span className={styles.summaryVal}>{commitment.status}</span>
                </div>
              </div>

              {!commitment.kyc_verified && (
                <div className={styles.warningBox}>
                  ⚠ KYC verification required before payment.{' '}
                  <Link href="/kyc" style={{ color: 'var(--orange)' }}>Verify now →</Link>
                </div>
              )}

              {commitment.status === 'funded' && (
                <div className={styles.successBox}>
                  ✓ This commitment is already funded.
                </div>
              )}

              {commitment.kyc_verified && commitment.status !== 'funded' && (
                <>
                  <p className={styles.info}>
                    You will be redirected to Stripe&apos;s secure checkout to complete payment.
                    Your funds will be held until the offering is finalised.
                  </p>
                  {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}
                  <FluffyButton
                    onClick={handlePay}
                    disabled={paying}
                    label={paying ? 'Redirecting to Stripe…' : `Pay $${Number(commitment.amount).toLocaleString()}`}
                    width={280}
                    height={54}
                    strands={1600}
                    strandLen={8}
                    fontSize={16}
                  />
                  <p className={styles.secureNote}>
                    🔒 Payments are processed securely by Stripe. By The Fruit does not store your card details.
                  </p>
                </>
              )}
            </div>
          </div>

        </motion.div>
      </div>
    </>
  )
}
