import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { apiFetch, getToken, isAdmin } from '../../lib/api'
import styles from '../../styles/OfferingForm.module.css'

const unwrap = json => json?.data ?? json

const ROUND_TYPES = [
  { value: 'pre_seed', label: 'Pre-Seed' },
  { value: 'seed',     label: 'Seed Round' },
  { value: 'series_a', label: 'Series A' },
  { value: 'series_b', label: 'Series B' },
  { value: 'series_c', label: 'Series C' },
  { value: 'series_d', label: 'Series D+' },
  { value: 'growth',   label: 'Growth Round' },
  { value: 'bridge',   label: 'Bridge Round' },
]

const INITIAL = {
  title: '',
  tagline: '',
  round_type: 'seed',
  video_url: '',
  target_raise: '',
  min_investment: '1000',
  closing_date: '',
  terms_text: '',
  status: 'draft',
  is_public: false,
  business: '',
}

export default function NewOfferingPage() {
  const router = useRouter()
  const [form, setForm] = useState(INITIAL)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [adminMode, setAdminMode] = useState(false)
  const [businesses, setBusinesses] = useState([])
  const [bizLoading, setBizLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return }
    const admin = isAdmin()
    setAdminMode(admin)
    // Admins load all businesses; founders load only their own
    const endpoint = admin ? '/profiles/businesses/' : '/profiles/businesses/mine/'
    apiFetch(endpoint)
      .then(r => r.json())
      .then(d => {
        const list = unwrap(d)
        const arr = Array.isArray(list) ? list : list?.results ?? []
        setBusinesses(arr)
        // Auto-select if founder has exactly one business
        if (!admin && arr.length === 1) {
          setForm(f => ({ ...f, business: String(arr[0].id) }))
        }
      })
      .catch(() => {})
      .finally(() => setBizLoading(false))
  }, [router])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setFieldErrors(e => { const n = { ...e }; delete n[field]; return n })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setFieldErrors({ title: 'Title is required.' }); return }
    if (!form.target_raise || isNaN(Number(form.target_raise))) { setFieldErrors({ target_raise: 'Enter a valid target amount.' }); return }
    if (businesses.length > 1 && !form.business) { setFieldErrors({ business: 'Select which business this offering is for.' }); return }

    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        target_raise: Number(form.target_raise),
        min_investment: Number(form.min_investment) || 1000,
        closing_date: form.closing_date || null,
        video_url: form.video_url || null,
      }
      // Only include business when explicitly selected (admin); for founders backend auto-assigns
      if (!form.business) delete payload.business

      const res = await apiFetch('/profiles/offerings/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const data = unwrap(await res.json())
      if (res.ok) {
        router.push(`/my-offerings`)
      } else {
        if (typeof data === 'object' && !data.detail && !data.error) {
          setFieldErrors(data)
        }
        setError(data?.detail || data?.error || data?.business?.[0] || 'Could not create offering.')
      }
    } catch (e) {
      setError('Network error. Please try again.')
    }
    setSaving(false)
  }

  return (
    <>
      <Head><title>New Offering — By The Fruit</title></Head>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className={styles.wrap}>
            <Link href="/my-offerings" className={styles.backLink}>← My Offerings</Link>
            <div className={styles.formCard}>
              <p className={styles.eyebrow}>Create Offering</p>
              <h1 className={styles.title}>New Fundraising Offering</h1>
              <p className={styles.sub}>Fill in the details below. You can save as a draft and publish later.</p>

              <form onSubmit={handleSubmit} className={styles.form}>
                {/* Show business selector to admins always, and to founders who have 2+ businesses */}
                {(adminMode || businesses.length > 1) && (
                  <FieldGroup label="Business *" error={fieldErrors.business}>
                    {bizLoading ? (
                      <p className={styles.fieldHint}>Loading your businesses…</p>
                    ) : businesses.length === 0 ? (
                      <p className={styles.errorMsg}>
                        No businesses found. <Link href="/onboarding/founder">Set up a founder profile first →</Link>
                      </p>
                    ) : (
                      <select
                        className={styles.select}
                        value={form.business}
                        onChange={e => set('business', e.target.value)}
                      >
                        <option value="">— Select a business —</option>
                        {businesses.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    )}
                  </FieldGroup>
                )}
                {/* Show which business is auto-selected when founder has exactly one */}
                {!adminMode && businesses.length === 1 && (
                  <div className={styles.bizBanner}>
                    <span className={styles.bizBannerLabel}>Offering for:</span>
                    <strong>{businesses[0].name}</strong>
                  </div>
                )}

                <FieldGroup label="Offering Title *" error={fieldErrors.title}>
                  <input className={styles.input} type="text" placeholder="e.g. Seed Round — Bridge to Series A" value={form.title} onChange={e => set('title', e.target.value)} />
                </FieldGroup>

                <FieldGroup label="Tagline" error={fieldErrors.tagline}>
                  <input className={styles.input} type="text" placeholder="One-line pitch to investors" value={form.tagline} onChange={e => set('tagline', e.target.value)} maxLength={500} />
                </FieldGroup>

                <div className={styles.row2}>
                  <FieldGroup label="Round Type" error={fieldErrors.round_type}>
                    <select className={styles.select} value={form.round_type} onChange={e => set('round_type', e.target.value)}>
                      {ROUND_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </FieldGroup>
                  <FieldGroup label="Status" error={fieldErrors.status}>
                    <select className={styles.select} value={form.status} onChange={e => set('status', e.target.value)}>
                      <option value="draft">Draft</option>
                      <option value="live">Live</option>
                      <option value="closed">Closed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </FieldGroup>
                </div>

                <div className={styles.row2}>
                  <FieldGroup label="Target Raise (USD) *" error={fieldErrors.target_raise}>
                    <input className={styles.input} type="number" min="1000" step="1000" placeholder="e.g. 500000" value={form.target_raise} onChange={e => set('target_raise', e.target.value)} />
                  </FieldGroup>
                  <FieldGroup label="Minimum Investment (USD)" error={fieldErrors.min_investment}>
                    <input className={styles.input} type="number" min="100" step="100" placeholder="1000" value={form.min_investment} onChange={e => set('min_investment', e.target.value)} />
                  </FieldGroup>
                </div>

                <FieldGroup label="Closing Date" error={fieldErrors.closing_date}>
                  <input className={styles.input} type="date" value={form.closing_date} onChange={e => set('closing_date', e.target.value)} />
                </FieldGroup>

                <FieldGroup label="Pitch Video URL" error={fieldErrors.video_url}>
                  <input className={styles.input} type="url" placeholder="YouTube link (watch, shorts, or youtu.be)" value={form.video_url} onChange={e => set('video_url', e.target.value)} />
                </FieldGroup>

                <FieldGroup label="Deal Terms" error={fieldErrors.terms_text}>
                  <textarea className={styles.textarea} rows={6} placeholder="Instrument type, valuation, key terms…" value={form.terms_text} onChange={e => set('terms_text', e.target.value)} />
                </FieldGroup>

                <label className={styles.checkRow}>
                  <input type="checkbox" className={styles.checkbox} checked={form.is_public} onChange={e => set('is_public', e.target.checked)} />
                  <span>Publicly visible (discoverable by all approved investors)</span>
                </label>

                {error && <p className={styles.errorMsg}>{error}</p>}

                <div className={styles.actions}>
                  <button type="submit" className={styles.submitBtn} disabled={saving}>
                    {saving ? 'Saving…' : form.status === 'live' ? 'Publish Offering' : 'Save Draft'}
                  </button>
                  <Link href="/my-offerings" className={styles.cancelLink}>Cancel</Link>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}

function FieldGroup({ label, error, children }) {
  return (
    <div className={styles.fieldGroup}>
      <label className={styles.label}>{label}</label>
      {children}
      {error && <p className={styles.fieldError}>{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  )
}
