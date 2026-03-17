import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { apiFetch } from '../../lib/api'
import styles from '../../styles/Sign.module.css'

const unwrap = json => json?.data ?? json

export default function SignAgreementPage() {
  const router = useRouter()
  const { id: commitmentId } = router.query

  const [commitment, setCommitment] = useState(null)
  const [agreement, setAgreement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [signerName, setSignerName] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!commitmentId) return
    async function load() {
      try {
        const [cRes, aRes] = await Promise.all([
          apiFetch(`/profiles/spv-commitments/${commitmentId}/`),
          apiFetch(`/profiles/subscription-agreements/?commitment_id=${commitmentId}`),
        ])
        if (cRes.ok) setCommitment(unwrap(await cRes.json()))
        if (aRes.ok) {
          const aData = unwrap(await aRes.json())
          const list = Array.isArray(aData) ? aData : (aData?.results || [])
          if (list.length > 0) setAgreement(list[0])
        }
      } catch (e) {}
      setLoading(false)
    }
    load()
  }, [commitmentId])

  async function handleSign(e) {
    e.preventDefault()
    if (!signerName.trim()) { setError('Please enter your full legal name.'); return }
    if (!confirmed) { setError('Please confirm you have read the agreement.'); return }
    if (!agreement) { setError('Agreement not found.'); return }

    setSigning(true)
    setError('')
    try {
      const res = await apiFetch(`/profiles/subscription-agreements/${agreement.id}/sign/`, {
        method: 'POST',
        body: JSON.stringify({ signer_name: signerName.trim() }),
      })
      const data = unwrap(await res.json())
      if (res.ok) {
        setAgreement(data)
        setDone(true)
      } else {
        setError(data?.error || data?.detail || 'Could not sign. Please try again.')
      }
    } catch (e) {
      setError('Network error. Please try again.')
    }
    setSigning(false)
  }

  if (loading) return <div className="container"><div className="spinner">Loading…</div></div>

  // Already signed
  if (agreement?.status === 'signed' || done) {
    return (
      <>
        <Head><title>Agreement Signed — By The Fruit</title></Head>
        <div className="container">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
            <div className={styles.wrap}>
              <div className={styles.doneCard}>
                <div className={styles.doneIcon}>✓</div>
                <h1 className={styles.doneTitle}>Agreement Signed</h1>
                <p className={styles.doneDesc}>
                  Your subscription agreement has been signed and recorded.
                  {agreement?.signed_at && (
                    <> Signed on {new Date(agreement.signed_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}.</>
                  )}
                </p>
                {agreement?.signer_name && (
                  <p className={styles.signedAs}>Signed as: <strong>{agreement.signer_name}</strong></p>
                )}
                <Link href="/portfolio" className={styles.primaryLink}>
                  Back to Portfolio →
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </>
    )
  }

  // No agreement found / not funded yet
  if (!agreement) {
    return (
      <>
        <Head><title>Sign Agreement — By The Fruit</title></Head>
        <div className="container">
          <div className={styles.wrap}>
            <div className={styles.errorCard}>
              <p>No signature agreement found for this commitment.</p>
              <p style={{ fontSize: '0.82rem', color: 'rgba(244,239,230,0.4)', marginTop: 8 }}>
                The agreement is created automatically once your payment is confirmed. If you have just paid, please wait a moment and refresh.
              </p>
              <Link href="/portfolio" className={styles.primaryLink} style={{ marginTop: '1.5rem', display: 'inline-block' }}>
                Back to Portfolio
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head><title>Sign Agreement — By The Fruit</title></Head>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className={styles.wrap}>
            <Link href="/portfolio" className={styles.backLink}>← Back to Portfolio</Link>

            <div className={styles.card}>
              <p className={styles.eyebrow}>E-Signature Required</p>
              <h1 className={styles.title}>Subscription Agreement</h1>

              {commitment && (
                <div className={styles.meta}>
                  <span>{agreement.offering_title || commitment.offering_title}</span>
                  <span className={styles.metaDot}>·</span>
                  <span>{agreement.spv_name || commitment.spv_name}</span>
                  <span className={styles.metaDot}>·</span>
                  <span style={{ color: 'var(--cream)', fontWeight: 600 }}>
                    ${Number(agreement.amount || commitment.amount).toLocaleString()}
                  </span>
                </div>
              )}

              <div className={styles.agreementBox}>
                <pre className={styles.agreementText}>
                  {agreement.agreement_text || 'Agreement text not available.'}
                </pre>
              </div>

              <form onSubmit={handleSign} className={styles.signForm}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="signer_name">
                    Type your full legal name to sign
                  </label>
                  <input
                    id="signer_name"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Jane Amara Osei"
                    value={signerName}
                    onChange={e => setSignerName(e.target.value)}
                    disabled={signing}
                    autoComplete="name"
                  />
                </div>

                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={e => setConfirmed(e.target.checked)}
                    disabled={signing}
                    className={styles.checkbox}
                  />
                  <span>
                    I have read and agree to the terms of this Subscription Agreement and confirm my committed investment.
                  </span>
                </label>

                {error && <p className={styles.errorMsg}>{error}</p>}

                <button
                  type="submit"
                  className={styles.signBtn}
                  disabled={signing || !signerName.trim() || !confirmed}
                >
                  {signing ? 'Signing…' : 'Sign Agreement'}
                </button>

                <p className={styles.legalNote}>
                  By clicking &quot;Sign Agreement&quot; you are providing your electronic signature, which is legally binding under applicable electronic signature laws.
                  Your IP address and timestamp will be recorded for audit purposes.
                </p>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}
