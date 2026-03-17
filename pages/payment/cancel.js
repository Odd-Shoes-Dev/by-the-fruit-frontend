import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import styles from '../../styles/Payment.module.css'

export default function PaymentCancelPage() {
  const router = useRouter()
  const { commitment_id } = router.query

  return (
    <>
      <Head><title>Payment Cancelled — By The Fruit</title></Head>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className={styles.wrap}>
            <div className={styles.cancelCard}>
              <div className={styles.cancelIcon}>✕</div>
              <h1 className={styles.cancelTitle}>Payment Cancelled</h1>
              <p className={styles.info}>
                Your payment was not completed. Your commitment is still saved — you can try again whenever you&apos;re ready.
              </p>
              <div className={styles.cancelActions}>
                {commitment_id && (
                  <Link href={`/payment/${commitment_id}`} className={styles.primaryLink}>
                    Try Again →
                  </Link>
                )}
                <Link href="/portfolio" className={styles.secondaryLink}>
                  Back to Portfolio
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}
