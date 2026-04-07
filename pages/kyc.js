import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { apiFetch, getToken } from '../lib/api'
import FluffyButton from '../components/FluffyButton'
import styles from '../styles/KYC.module.css'

const unwrap = json => json?.data ?? json

const DOC_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'national_id', label: 'National ID Card' },
  { value: 'drivers_license', label: "Driver's License" },
]

const STATUS_META = {
  pending:  { label: 'Under Review',   color: '#E8601A', desc: 'Your document has been submitted and is awaiting review by our team. This usually takes 1–2 business days.' },
  approved: { label: 'Verified',       color: '#4CAF50', desc: 'Your identity has been verified. You can now proceed with investment commitments.' },
  rejected: { label: 'Action Required', color: '#EF5350', desc: 'Your document could not be verified. Please re-submit with a clearer image.' },
}

export default function KYCPage() {
  const [token, setToken] = useState(null)
  const [existing, setExisting] = useState(null)   // latest KYC document
  const [loading, setLoading] = useState(true)
  const [docType, setDocType] = useState('passport')
  const [frontFile, setFrontFile] = useState(null)
  const [backFile, setBackFile] = useState(null)
  const [frontPreview, setFrontPreview] = useState(null)
  const [backPreview, setBackPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const frontRef = useRef()
  const backRef = useRef()

  useEffect(() => {
    const t = getToken()
    setToken(t)
    if (!t) { setLoading(false); return }
    async function load() {
      try {
        const res = await apiFetch('/profiles/kyc-documents/')
        if (res.ok) {
          const data = unwrap(await res.json())
          const list = Array.isArray(data) ? data : (data?.results || [])
          if (list.length > 0) setExisting(list[0])
        }
      } catch (e) {}
      setLoading(false)
    }
    load()
  }, [])

  function handleFile(file, side) {
    if (!file) return
    const url = URL.createObjectURL(file)
    if (side === 'front') { setFrontFile(file); setFrontPreview(url) }
    else { setBackFile(file); setBackPreview(url) }
  }

  async function handleSubmit() {
    setSubmitError('')
    if (!frontFile) { setSubmitError('Please upload the front of your document.'); return }
    setSubmitting(true)
    try {
      const form = new FormData()
      form.append('document_type', docType)
      form.append('front_image', frontFile)
      if (backFile) form.append('back_image', backFile)

      const t = getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profiles/kyc-documents/`, {
        method: 'POST',
        headers: { Authorization: `Token ${t}` },
        body: form,
      })
      const json = await res.json()
      if (res.ok) {
        setExisting(unwrap(json))
        setSubmitSuccess(true)
      } else {
        const err = unwrap(json)
        setSubmitError(
          typeof err === 'string' ? err :
          err?.front_image?.[0] || err?.document_type?.[0] || err?.detail ||
          err?.error || JSON.stringify(err)
        )
      }
    } catch (e) {
      setSubmitError('Network error. Please try again.')
    }
    setSubmitting(false)
  }

  const canResubmit = existing?.status === 'rejected'

  return (
    <>
      <Head><title>KYC Verification — By The Fruit</title></Head>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

          <div className={styles.header}>
            <p className={styles.eyebrow}>Identity Verification</p>
            <h1 className={styles.title}>KYC Verification</h1>
            <p className={styles.sub}>
              We&apos;re required to verify your identity before your investment commitment can be finalised.
              This is a one-time process.
            </p>
          </div>

          {!token && (
            <div className={styles.loginPrompt}>
              <p><Link href="/login">Log in</Link> to complete KYC verification.</p>
            </div>
          )}

          {token && loading && <div className="spinner">Loading…</div>}

          {token && !loading && existing && !canResubmit && (
            <div className={styles.statusCard}>
              <div className={styles.statusDot} style={{ background: STATUS_META[existing.status]?.color }} />
              <div>
                <p className={styles.statusLabel} style={{ color: STATUS_META[existing.status]?.color }}>
                  {STATUS_META[existing.status]?.label}
                </p>
                <p className={styles.statusDesc}>{STATUS_META[existing.status]?.desc}</p>
                {existing.status === 'rejected' && existing.rejection_reason && (
                  <p className={styles.rejectionReason}><strong>Reason:</strong> {existing.rejection_reason}</p>
                )}
                <p className={styles.submittedAt}>
                  Submitted: {existing.created_at ? new Date(existing.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                </p>
              </div>
            </div>
          )}

          {token && !loading && (!existing || canResubmit) && !submitSuccess && (
            <div className={styles.formCard}>
              {canResubmit && (
                <div className={styles.resubmitNotice}>
                  Your previous submission was rejected. Please upload a clearer image of your document.
                  {existing.rejection_reason && <> <strong>Reason:</strong> {existing.rejection_reason}</>}
                </div>
              )}

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Document Type</label>
                <div className={styles.docTypeRow}>
                  {DOC_TYPES.map(t => (
                    <button
                      key={t.value}
                      className={`${styles.docTypeBtn} ${docType === t.value ? styles.docTypeBtnActive : ''}`}
                      onClick={() => setDocType(t.value)}
                      type="button"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.uploadRow}>
                <div className={styles.uploadSlot} onClick={() => frontRef.current?.click()}>
                  {frontPreview
                    ? <img src={frontPreview} alt="Front" className={styles.preview} />
                    : <div className={styles.uploadPlaceholder}><span className={styles.uploadIcon}>+</span><span>Front of document</span></div>
                  }
                  <input
                    ref={frontRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => handleFile(e.target.files[0], 'front')}
                  />
                </div>

                {docType !== 'passport' && (
                  <div className={styles.uploadSlot} onClick={() => backRef.current?.click()}>
                    {backPreview
                      ? <img src={backPreview} alt="Back" className={styles.preview} />
                      : <div className={styles.uploadPlaceholder}><span className={styles.uploadIcon}>+</span><span>Back of document</span></div>
                    }
                    <input
                      ref={backRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => handleFile(e.target.files[0], 'back')}
                    />
                  </div>
                )}
              </div>

              <p className={styles.uploadHint}>
                Upload a clear, colour photo of your {docType === 'passport' ? 'photo page' : 'front and back'}. 
                Accepted: JPG, PNG. Max 10MB.
              </p>

              {submitError && <div className="error" style={{ marginBottom: 12 }}>{submitError}</div>}

              <FluffyButton
                onClick={handleSubmit}
                disabled={submitting}
                label={submitting ? 'Submitting…' : 'Submit for Verification'}
                width={280}
                height={52}
                strands={1400}
                strandLen={8}
                fontSize={15}
                color="#F5A623"
                color2="#F57C00"
              />
            </div>
          )}

          {submitSuccess && (
            <div className={styles.successCard}>
              <p className={styles.successTitle}>Submitted!</p>
              <p className={styles.successDesc}>
                Your documents have been received. Our team will review within 1–2 business days. 
                You&apos;ll receive an email once a decision has been made.
              </p>
              <Link href="/orchard" className={styles.backLink}>← Back to Orchard</Link>
            </div>
          )}

          <div className={styles.infoBox}>
            <h3 className={styles.infoTitle}>Why do we need this?</h3>
            <p>
              As a regulated investment platform, we are required to verify the identity of all investors
              before funds can be collected. Your documents are stored securely and never shared with third parties
              outside of our compliance process.
            </p>
          </div>

        </motion.div>
      </div>
    </>
  )
}
