import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { apiFetch, getToken } from '../lib/api'
import styles from '../styles/Offerings.module.css'
import kycStyles from '../styles/KYC.module.css'

const unwrap = json => json?.data ?? json

const STATUS_COLORS = {
  pending: '#E8601A',
  signed: '#4CAF50',
  funded: '#2196F3',
  refunded: '#9E9E9E',
}

export default function PortfolioPage() {
  const [commitments, setCommitments] = useState([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)
  const [kycStatus, setKycStatus] = useState(null) // null | 'pending' | 'approved' | 'rejected' | 'none'

  useEffect(() => {
    const t = getToken()
    setToken(t)
    if (!t) { setLoading(false); return }
    async function load() {
      try {
        const [commRes, kycRes] = await Promise.all([
          apiFetch('/profiles/spv-commitments/'),
          apiFetch('/profiles/kyc-documents/'),
        ])
        if (commRes.ok) {
          const data = unwrap(await commRes.json())
          setCommitments(Array.isArray(data) ? data : (data?.results || []))
        }
        if (kycRes.ok) {
          const kycData = unwrap(await kycRes.json())
          const list = Array.isArray(kycData) ? kycData : (kycData?.results || [])
          setKycStatus(list.length > 0 ? list[0].status : 'none')
        }
      } catch (e) {}
      setLoading(false)
    }
    load()
  }, [])

  const totalCommitted = commitments.reduce((sum, c) => sum + Number(c.amount || 0), 0)
  const funded = commitments.filter(c => c.status === 'funded')
  const pending = commitments.filter(c => c.status === 'pending')

  return (
    <>
      <Head><title>My Portfolio — By The Fruit</title></Head>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

          <div className={styles.header}>
            <p className={styles.eyebrow}>Investor Dashboard</p>
            <h1 className={styles.title}>My Portfolio</h1>
            <p className={styles.sub}>Track your commitments and investment status across all offerings.</p>
          </div>

          {token && !loading && kycStatus === 'none' && (
            <div className={`${kycStyles.kycBanner} ${kycStyles.kycBannerWarning}`}>
              <span>⚠ Complete KYC verification to finalise your investments.</span>
              <Link href="/kyc" className={kycStyles.kycBannerLink}>Verify Identity →</Link>
            </div>
          )}
          {token && !loading && kycStatus === 'pending' && (
            <div className={`${kycStyles.kycBanner} ${kycStyles.kycBannerPending}`}>
              <span>🕐 Your KYC documents are under review (1–2 business days).</span>
              <Link href="/kyc" className={kycStyles.kycBannerLink}>View Status</Link>
            </div>
          )}
          {token && !loading && kycStatus === 'rejected' && (
            <div className={`${kycStyles.kycBanner} ${kycStyles.kycBannerWarning}`}>
              <span>✗ Your KYC was not approved. Please re-submit your documents.</span>
              <Link href="/kyc" className={kycStyles.kycBannerLink}>Re-submit →</Link>
            </div>
          )}
          {token && !loading && kycStatus === 'approved' && (
            <div className={`${kycStyles.kycBanner} ${kycStyles.kycBannerApproved}`}>
              <span>✓ Identity verified.</span>
            </div>
          )}

          {!token && (
            <div className={styles.loginPrompt}>
              <p><Link href="/login">Log in</Link> to view your portfolio.</p>
            </div>
          )}

          {token && loading && <div className="spinner">Loading…</div>}

          {token && !loading && commitments.length === 0 && (
            <div className={styles.empty}>
              <p>No commitments yet.</p>
              <Link href="/offerings" className={styles.viewBtn} style={{ display: 'inline-block', marginTop: 12 }}>Browse Offerings →</Link>
            </div>
          )}

          {token && !loading && commitments.length > 0 && (
            <>
              <div className={styles.portfolioStats}>
                <div className={styles.portfolioStat}>
                  <span className={styles.statLabel}>Total Committed</span>
                  <span className={styles.statVal} style={{ fontSize: '1.6rem' }}>${totalCommitted.toLocaleString()}</span>
                </div>
                <div className={styles.portfolioStat}>
                  <span className={styles.statLabel}>Funded Investments</span>
                  <span className={styles.statVal} style={{ fontSize: '1.6rem' }}>{funded.length}</span>
                </div>
                <div className={styles.portfolioStat}>
                  <span className={styles.statLabel}>Pending</span>
                  <span className={styles.statVal} style={{ fontSize: '1.6rem' }}>{pending.length}</span>
                </div>
              </div>

              <div className={styles.commitList}>
                {commitments.map(c => (
                  <div key={c.id} className={styles.commitRow}>
                    <div className={styles.commitLeft}>
                      <p className={styles.commitTitle}>{c.spv_name || `SPV #${c.spv}`}</p>
                      {c.offering_title && (
                        <p className={styles.commitSub}>{c.offering_title}</p>
                      )}
                      <p className={styles.commitDate}>
                        Committed: {c.committed_at ? new Date(c.committed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                    <div className={styles.commitRight}>
                      <span className={styles.commitAmount}>${Number(c.amount).toLocaleString()}</span>
                      <span
                        className={styles.statusBadge}
                        style={{ background: STATUS_COLORS[c.status] || '#555' }}
                      >
                        {c.status}
                      </span>
                      {c.status === 'pending' && c.kyc_verified && (
                        <Link href={`/payment/${c.id}`} className={styles.fundBtn}>
                          Fund →
                        </Link>
                      )}
                      {c.status === 'pending' && !c.kyc_verified && (
                        <Link href="/kyc" className={styles.kycRequiredBtn}>
                          KYC Required
                        </Link>
                      )}
                      {c.status === 'funded' && c.agreement_status === 'pending_signature' && (
                        <Link href={`/sign/${c.id}`} className={styles.signBtn}>
                          Sign Agreement →
                        </Link>
                      )}
                      {c.status === 'funded' && c.agreement_status === 'signed' && (
                        <span className={styles.signedBadge}>✓ Signed</span>
                      )}
                      {c.status === 'funded' && c.agreement_status === 'counter_signed' && (
                        <span className={styles.signedBadge} style={{ color: '#CE93D8' }}>✓ Counter-signed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </motion.div>
      </div>
    </>
  )
}
