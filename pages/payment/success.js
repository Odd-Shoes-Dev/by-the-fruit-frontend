import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { apiFetch } from '../../lib/api'
import styles from '../../styles/Payment.module.css'

const unwrap = json => json?.data ?? json

export default function PaymentSuccessPage() {
  const router = useRouter()
  const { commitment_id } = router.query
  const [commitment, setCommitment] = useState(null)

  useEffect(() => {
    if (!commitment_id) return
    async function load() {
      try {
        const res = await apiFetch(`/profiles/spv-commitments/${commitment_id}/`)
        if (res.ok) setCommitment(unwrap(await res.json()))
      } catch (e) {}
    }
    load()
  }, [commitment_id])

  return (
    <>
      <Head><title>Payment Confirmed — By The Fruit</title></Head>
      <div className="container">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
          <div className={styles.wrap}>
            <div className={styles.successCard}>
              <div className={styles.checkIcon}>✓</div>
              <h1 className={styles.successTitle}>Payment Confirmed</h1>
              <p className={styles.successDesc}>
                Your investment has been funded successfully. Welcome to the deal.
              </p>
              {commitment && (
                <div className={styles.summaryRow} style={{ marginBottom: '1.5rem' }}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Offering</span>
                    <span className={styles.summaryVal}>{commitment.offering_title || '—'}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Amount Funded</span>
                    <span className={styles.summaryVal} style={{ fontWeight: 700, color: '#b9f5bb' }}>
                      ${Number(commitment.amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              <p className={styles.info} style={{ marginBottom: '1.5rem' }}>
                A confirmation email has been sent to your inbox. The next step is to sign your subscription agreement.
              </p>
              {commitment_id && (
                <Link href={`/sign/${commitment_id}`} className={styles.primaryLink} style={{ marginBottom: '0.75rem' }}>
                  Sign Agreement Now →
                </Link>
              )}
              <Link href="/portfolio" className={styles.secondaryLink}>
                Do this later — go to Portfolio
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}
