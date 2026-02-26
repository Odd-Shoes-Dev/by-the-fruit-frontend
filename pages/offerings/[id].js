import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { apiFetch, getToken, getUserId, isAdmin } from '../../lib/api'
import FluffyButton from '../../components/FluffyButton'
import styles from '../../styles/Offerings.module.css'
import kycStyles from '../../styles/KYC.module.css'

const unwrap = json => { const r = json?.data ?? json; return r }

function ProgressBar({ percent }) {
  return (
    <div className={styles.progressTrack}>
      <div className={styles.progressFill} style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  )
}

export default function OfferingDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const [offering, setOffering] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)
  const [admin, setAdmin] = useState(false)
  const [amount, setAmount] = useState('')
  const [committing, setCommitting] = useState(false)
  const [commitStatus, setCommitStatus] = useState(null) // null | 'success' | 'error'
  const [commitMsg, setCommitMsg] = useState('')
  const [myCommitment, setMyCommitment] = useState(null)
  const [kycStatus, setKycStatus] = useState(null) // null | 'none' | 'pending' | 'approved' | 'rejected'

  useEffect(() => {
    const t = getToken()
    setToken(t)
    setAdmin(isAdmin())
  }, [])

  useEffect(() => {
    if (!id) return
    let mounted = true
    async function load() {
      try {
        const res = await apiFetch(`/profiles/offerings/${id}/`)
        if (res.ok && mounted) {
          const data = unwrap(await res.json())
          setOffering(data)
          if (data.min_investment) setAmount(String(Math.ceil(data.min_investment)))
        } else if (res.status === 404) {
          router.replace('/offerings')
        }
      } catch (e) {}
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [id, router])

  useEffect(() => {
    if (!token || !id) return
    async function checkCommitment() {
      try {
        const [commRes, kycRes] = await Promise.all([
          apiFetch('/profiles/spv-commitments/'),
          apiFetch('/profiles/kyc-documents/'),
        ])
        if (commRes.ok) {
          const data = unwrap(await commRes.json())
          const list = Array.isArray(data) ? data : data?.results || []
          const mine = list.find(c => String(c.spv_offering_id) === String(id) || (c.spv && String(c.spv) === String(id)))
          if (mine) setMyCommitment(mine)
        }
        if (kycRes.ok) {
          const kycData = unwrap(await kycRes.json())
          const kycList = Array.isArray(kycData) ? kycData : (kycData?.results || [])
          setKycStatus(kycList.length > 0 ? kycList[0].status : 'none')
        }
      } catch (e) {}
    }
    checkCommitment()
  }, [token, id])

  async function handleCommit() {
    if (!amount || isNaN(Number(amount))) {
      setCommitMsg('Please enter a valid amount.')
      setCommitStatus('error')
      return
    }
    setCommitting(true)
    setCommitStatus(null)
    setCommitMsg('')
    try {
      const res = await apiFetch(`/profiles/offerings/${id}/commit/`, {
        method: 'POST',
        body: JSON.stringify({ amount: Number(amount) }),
      })
      const json = await res.json()
      if (res.ok) {
        setCommitStatus('success')
        setCommitMsg(`Your commitment of $${Number(amount).toLocaleString()} has been received. We will be in touch regarding next steps.`)
        setMyCommitment(unwrap(json))
        // Refresh offering to update totals
        const res2 = await apiFetch(`/profiles/offerings/${id}/`)
        if (res2.ok) setOffering(unwrap(await res2.json()))
      } else {
        setCommitStatus('error')
        setCommitMsg((unwrap(json))?.error || 'Something went wrong. Please try again.')
      }
    } catch (e) {
      setCommitStatus('error')
      setCommitMsg('Network error. Please try again.')
    }
    setCommitting(false)
  }

  if (loading) return <div className="container"><div className="spinner">Loading…</div></div>
  if (!offering) return null

  const isClosed = offering.status === 'closed' || offering.status === 'cancelled'

  return (
    <>
      <Head><title>{offering.title} — By The Fruit</title></Head>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <Link href="/offerings" className={styles.backLink}>← All Offerings</Link>
            {admin && (
              <Link href={`/offerings/dashboard/${id}`} className={styles.dashboardLink}>
                Pipeline Dashboard →
              </Link>
            )}
          </div>

          <div className={styles.detailGrid}>
            {/* Left — main content */}
            <div>
              <div className={styles.detailHeader}>
                {offering.business_logo && (
                  <img src={offering.business_logo} alt={offering.business_name} className={styles.logoLg} />
                )}
                <div>
                  <span className={styles.category}>{offering.business_category || 'Other'}</span>
                  <h1 className={styles.detailTitle}>{offering.title}</h1>
                  <p className={styles.cardSub}>{offering.business_name}</p>
                </div>
              </div>

              {offering.tagline && (
                <p className={styles.tagline} style={{ fontSize: '1.1rem', margin: '1.25rem 0' }}>&quot;{offering.tagline}&quot;</p>
              )}

              {offering.video_url && (
                <div className={styles.videoWrap}>
                  <iframe
                    src={offering.video_url.replace('watch?v=', 'embed/')}
                    title="Pitch video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className={styles.videoEmbed}
                  />
                </div>
              )}

              {offering.terms_text && (
                <div className={styles.termsBox}>
                  <h3 className={styles.sectionLabel}>Deal Terms</h3>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'rgba(244,239,230,0.75)', fontSize: '0.95rem' }}>
                    {offering.terms_text}
                  </p>
                </div>
              )}

              {offering.pitch_deck && (
                <div style={{ marginTop: '1.5rem' }}>
                  <a href={offering.pitch_deck} target="_blank" rel="noreferrer" className={styles.deckLink}>
                    📎 Download Pitch Deck
                  </a>
                </div>
              )}
            </div>

            {/* Right — invest panel */}
            <div>
              <div className={styles.investPanel}>
                <div className={styles.stats} style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '1rem' }}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Target Raise</span>
                    <span className={styles.statVal}>${Number(offering.target_raise).toLocaleString()}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Committed</span>
                    <span className={styles.statVal}>${Number(offering.total_committed || 0).toLocaleString()}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Min. Investment</span>
                    <span className={styles.statVal}>${Number(offering.min_investment).toLocaleString()}</span>
                  </div>
                  {offering.closing_date && (
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Closes</span>
                      <span className={styles.statVal}>{new Date(offering.closing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>

                <ProgressBar percent={offering.progress_percent || 0} />
                <p className={styles.progressLabel}>{offering.progress_percent || 0}% of target raised</p>

                {isClosed && (
                  <div className={styles.closedBadge}>This offering is {offering.status}.</div>
                )}

                {!isClosed && myCommitment && (
                  <div className={styles.successBox} style={{ marginTop: '1rem' }}>
                    <strong>You&apos;re committed!</strong><br />
                    Amount: <strong>${Number(myCommitment.amount).toLocaleString()}</strong><br />
                    Status: <span className={styles.statusBadge}>{myCommitment.status}</span>
                  </div>
                )}

                {!isClosed && !myCommitment && (
                  <>
                    {!token ? (
                      <div className={styles.loginPrompt}>
                        <p><Link href="/login">Log in</Link> to commit to this offering.</p>
                      </div>
                    ) : (
                      <>
                        {kycStatus === 'none' && (
                          <div className={`${kycStyles.kycBanner} ${kycStyles.kycBannerWarning}`} style={{ marginTop: '1rem', marginBottom: 0 }}>
                            <span>Verify your identity before committing.</span>
                            <Link href="/kyc" className={kycStyles.kycBannerLink}>Start KYC →</Link>
                          </div>
                        )}
                        {kycStatus === 'pending' && (
                          <div className={`${kycStyles.kycBanner} ${kycStyles.kycBannerPending}`} style={{ marginTop: '1rem', marginBottom: 0 }}>
                            <span>🕐 KYC under review — you may still express interest below.</span>
                          </div>
                        )}
                        {kycStatus === 'rejected' && (
                          <div className={`${kycStyles.kycBanner} ${kycStyles.kycBannerWarning}`} style={{ marginTop: '1rem', marginBottom: 0 }}>
                            <span>KYC rejected. <Link href="/kyc" className={kycStyles.kycBannerLink}>Re-submit →</Link></span>
                          </div>
                        )}
                        <div className={styles.commitForm}>
                        <label className={styles.inputLabel}>
                          Investment Amount (USD)
                          <input
                            type="number"
                            value={amount}
                            min={offering.min_investment}
                            onChange={e => setAmount(e.target.value)}
                            className={styles.amountInput}
                            placeholder={`Min $${Number(offering.min_investment).toLocaleString()}`}
                          />
                        </label>
                        <p className={styles.commitNote}>
                          By committing, you&apos;re expressing intent to invest. No funds will be collected until KYC and e-signature steps are completed.
                        </p>
                        {commitStatus === 'error' && (
                          <div className="error" style={{ marginBottom: 8 }}>{commitMsg}</div>
                        )}
                        {commitStatus === 'success' && (
                          <div className={styles.successBox}>{commitMsg}</div>
                        )}
                        <FluffyButton
                          onClick={handleCommit}
                          disabled={committing}
                          label={committing ? 'Submitting…' : `Commit $${Number(amount || 0).toLocaleString()}`}
                          fullWidth
                          height={50}
                          strands={1600}
                          strandLen={8}
                          fontSize={15}
                        />
                      </div>
                      </>
                    )}
                  </>
                )}

                <p className={styles.disclaimer}>
                  This is not a solicitation for investment. Commitments are non-binding until KYC verification and legally binding documents are completed.
                </p>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </>
  )
}
