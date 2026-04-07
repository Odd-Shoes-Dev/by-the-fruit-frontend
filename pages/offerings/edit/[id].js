import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { apiFetch, getToken } from '../../../lib/api'
import styles from '../../../styles/OfferingForm.module.css'

const unwrap = json => json?.data ?? json

function FieldGroup({ label, error, children }) {
  return (
    <div className={styles.fieldGroup}>
      <label className={styles.label}>{label}</label>
      {children}
      {error && <p className={styles.fieldError}>{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  )
}

export default function EditOfferingPage() {
  const router = useRouter()
  const { id } = router.query
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return }
    if (!id) return
    async function load() {
      try {
        const res = await apiFetch(`/profiles/offerings/${id}/`)
        if (res.ok) {
          const data = unwrap(await res.json())
          setForm({
            title: data.title || '',
            tagline: data.tagline || '',
            round_type: data.round_type || 'seed',
            video_url: data.video_url || '',
            target_raise: data.target_raise || '',
            min_investment: data.min_investment || '1000',
            closing_date: data.closing_date || '',
            terms_text: data.terms_text || '',
            status: data.status || 'draft',
            is_public: !!data.is_public,
          })
        } else {
          router.replace('/my-offerings')
        }
      } catch (e) {}
      setLoading(false)
    }
    load()
  }, [id, router])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setFieldErrors(e => { const n = { ...e }; delete n[field]; return n })
    setSaved(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setFieldErrors({ title: 'Title is required.' }); return }
    if (!form.target_raise || isNaN(Number(form.target_raise))) { setFieldErrors({ target_raise: 'Enter a valid target amount.' }); return }

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
      const res = await apiFetch(`/profiles/offerings/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      const data = unwrap(await res.json())
      if (res.ok) {
        setSaved(true)
      } else {
        if (typeof data === 'object' && !data.detail && !data.error) setFieldErrors(data)
        setError(data?.detail || data?.error || 'Could not save offering.')
      }
    } catch (e) {
      setError('Network error. Please try again.')
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this offering? This cannot be undone.')) return
    try {
      const res = await apiFetch(`/profiles/offerings/${id}/`, { method: 'DELETE' })
      if (res.ok || res.status === 204) {
        router.replace('/my-offerings')
      } else {
        const data = unwrap(await res.json())
        setError(data?.detail || data?.error || 'Could not delete offering.')
      }
    } catch (e) {
      setError('Network error.')
    }
  }

  if (loading) return <div className="container"><div className="spinner">Loading…</div></div>
  if (!form) return null

  return (
    <>
      <Head><title>Edit Offering — By The Fruit</title></Head>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className={styles.wrap}>
            <div className={styles.topBar}>
              <Link href="/my-offerings" className={styles.backLink}>← My Offerings</Link>
              <div className={styles.topActions}>
                <Link href={`/offerings/dashboard/${id}`} className={styles.dashLink}>Pipeline Dashboard →</Link>
                <button className={styles.deleteBtn} onClick={handleDelete}>Delete</button>
              </div>
            </div>

            <div className={styles.formCard}>
              <p className={styles.eyebrow}>Edit Offering</p>
              <h1 className={styles.title}>{form.title || 'Untitled Offering'}</h1>

              <form onSubmit={handleSubmit} className={styles.form}>
                <FieldGroup label="Offering Title *" error={fieldErrors.title}>
                  <input className={styles.input} type="text" placeholder="e.g. Seed Round — Bridge to Series A" value={form.title} onChange={e => set('title', e.target.value)} />
                </FieldGroup>

                <FieldGroup label="Tagline" error={fieldErrors.tagline}>
                  <input className={styles.input} type="text" placeholder="One-line pitch to investors" value={form.tagline} onChange={e => set('tagline', e.target.value)} maxLength={500} />
                </FieldGroup>

                <div className={styles.row2}>
                  <FieldGroup label="Round Type" error={fieldErrors.round_type}>
                    <select className={styles.select} value={form.round_type} onChange={e => set('round_type', e.target.value)}>
                      {[{v:'pre_seed',l:'Pre-Seed'},{v:'seed',l:'Seed Round'},{v:'series_a',l:'Series A'},{v:'series_b',l:'Series B'},{v:'series_c',l:'Series C'},{v:'series_d',l:'Series D+'},{v:'growth',l:'Growth Round'},{v:'bridge',l:'Bridge Round'}]
                        .map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
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
                  <input className={styles.input} type="url" placeholder="https://youtube.com/watch?v=..." value={form.video_url} onChange={e => set('video_url', e.target.value)} />
                </FieldGroup>

                <FieldGroup label="Deal Terms" error={fieldErrors.terms_text}>
                  <textarea className={styles.textarea} rows={6} placeholder="Instrument type, valuation, key terms…" value={form.terms_text} onChange={e => set('terms_text', e.target.value)} />
                </FieldGroup>

                <label className={styles.checkRow}>
                  <input type="checkbox" className={styles.checkbox} checked={form.is_public} onChange={e => set('is_public', e.target.checked)} />
                  <span>Publicly visible (discoverable by all approved investors)</span>
                </label>

                {error && <p className={styles.errorMsg}>{error}</p>}
                {saved && <p className={styles.successMsg}>✓ Changes saved.</p>}

                <div className={styles.actions}>
                  <button type="submit" className={styles.submitBtn} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <Link href={`/offerings/${id}`} className={styles.cancelLink}>View Public Page →</Link>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}
