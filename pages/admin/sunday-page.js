import Head from 'next/head'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { apiFetch, getToken, isAdmin } from '../../lib/api'
import AdminLayout from '../../components/AdminLayout'
import styles from '../../styles/Admin.module.css'
import cms from '../../styles/LandingCMS.module.css'

// ── Hardcoded defaults (mirrors _app.js) ─────────────────────────────────────
const DEFAULTS = {
  headline:       "We're Closed Today —",
  headline_accent:"On Purpose.",
  intro:          "At By the Fruit, we believe capital should serve life — not consume it.",
  notice_main:    "So every Sunday (12:00am–11:59pm ET), we pause.",
  notice_sub:     "No deals. No dashboards. No urgency.",
  notice_rest:    "Just rest.",
  body:           "We honor the Sabbath as a reminder that our worth isn't measured in productivity — and that the world keeps turning without our striving.\n\nWhat an honor it is to rest in Him — as the first investment community to pause weekly to reflect, listen, and honor the One who gives to us so freely.\n\nWhether today looks like church, family dinner, a long walk, or quiet reflection — we hope you take this space to reset and recharge.",
  signoff:        "We'll see you tomorrow",
  default_verse:  '"Be still, and know that I am God." — Psalm 46:10',
}

const EMPTY_FORM = {
  headline: '', headline_accent: '', intro: '',
  notice_main: '', notice_sub: '', notice_rest: '',
  body: '', signoff: '', default_verse: '',
}

// ── helper: convert API row to form state ─────────────────────────────────────
function rowToForm(row) {
  return {
    headline:        row.headline        || '',
    headline_accent: row.headline_accent || '',
    intro:           row.intro           || '',
    notice_main:     row.notice_main     || '',
    notice_sub:      row.notice_sub      || '',
    notice_rest:     row.notice_rest     || '',
    body:            row.body            || '',
    signoff:         row.signoff         || '',
    default_verse:   (row.verses && row.verses.default) ? row.verses.default : '',
  }
}

// ── helper: extract date-specific verses from API row ────────────────────────
function rowToDateVerses(row) {
  if (!row.verses) return []
  return Object.entries(row.verses)
    .filter(([k]) => k !== 'default')
    .map(([date, text]) => ({ date, text }))
}

export default function AdminSundayPage() {
  const router = useRouter()
  const [loading, setLoading]         = useState(true)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [dateVerses, setDateVerses]   = useState([])   // [{date, text}]
  const [newVerse, setNewVerse]       = useState({ date: '', text: '' })
  const [saving, setSaving]           = useState(false)
  const [saveError, setSaveError]     = useState('')
  const [saveOk, setSaveOk]           = useState(false)

  // ── auth guard ──
  useEffect(() => {
    if (!getToken() || !isAdmin()) router.replace('/login')
  }, [router])

  // ── load current settings ──
  const loadSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/sunday-page/')
      if (res.ok) {
        const row = await res.json()
        setForm(rowToForm(row))
        setDateVerses(rowToDateVerses(row))
      }
    } catch (e) {}
    setLoading(false)
  }, [])

  useEffect(() => { loadSettings() }, [loadSettings])

  // ── form helpers ──
  function field(key) {
    return {
      value: form[key],
      onChange: e => setForm(f => ({ ...f, [key]: e.target.value })),
    }
  }

  // ── verse list management ──
  function removeVerse(index) {
    setDateVerses(v => v.filter((_, i) => i !== index))
  }
  function updateVerse(index, field, value) {
    setDateVerses(v => v.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }
  function addVerse() {
    if (!newVerse.date || !newVerse.text) return
    // Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newVerse.date)) {
      setSaveError('Date must be in YYYY-MM-DD format.')
      return
    }
    setDateVerses(v => [...v, { ...newVerse }])
    setNewVerse({ date: '', text: '' })
    setSaveError('')
  }

  // ── save ──
  async function handleSave(e) {
    e.preventDefault()
    setSaveError('')
    setSaveOk(false)

    // Build verses object
    const versesMap = {}
    if (form.default_verse.trim()) {
      versesMap['default'] = form.default_verse.trim()
    }
    for (const { date, text } of dateVerses) {
      if (date && text) versesMap[date] = text
    }

    const payload = {
      headline:        form.headline,
      headline_accent: form.headline_accent,
      intro:           form.intro,
      notice_main:     form.notice_main,
      notice_sub:      form.notice_sub,
      notice_rest:     form.notice_rest,
      body:            form.body,
      signoff:         form.signoff,
      verses:          versesMap,
    }

    setSaving(true)
    try {
      const res = await apiFetch('/api/sunday-page/', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setSaveOk(true)
        setTimeout(() => setSaveOk(false), 3000)
      } else {
        const err = await res.json().catch(() => ({}))
        setSaveError(err.detail || JSON.stringify(err) || 'Failed to save.')
      }
    } catch {
      setSaveError('Network error. Please try again.')
    }
    setSaving(false)
  }

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <Head><title>Sunday Page — Admin — By The Fruit</title></Head>
      <AdminLayout active="sunday-page">

        <div className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Admin</p>
            <h1 className={styles.pageTitle}>Sunday Page</h1>
            <p className={styles.pageSub}>
              Customise the message shown when the site is closed on Sundays.
              Leave any field blank to keep the default text.
            </p>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading settings…</div>
        ) : (
          <form onSubmit={handleSave} style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* ── HEADING ─── */}
            <section className={cms.formSection}>
              <h2 className={cms.sectionHeading}>Page Heading</h2>

              <div className={cms.fieldGroup}>
                <label className={cms.label}>
                  Headline
                  <span className={cms.hint}> — default: "{DEFAULTS.headline}"</span>
                </label>
                <input
                  className={cms.input}
                  placeholder={DEFAULTS.headline}
                  {...field('headline')}
                />
              </div>

              <div className={cms.fieldGroup}>
                <label className={cms.label}>
                  Headline Accent <span className={cms.hint}>(italic orange)</span>
                  <span className={cms.hint}> — default: "{DEFAULTS.headline_accent}"</span>
                </label>
                <input
                  className={cms.input}
                  placeholder={DEFAULTS.headline_accent}
                  {...field('headline_accent')}
                />
              </div>
            </section>

            {/* ── BODY TEXT ─── */}
            <section className={cms.formSection}>
              <h2 className={cms.sectionHeading}>Body Text</h2>

              <div className={cms.fieldGroup}>
                <label className={cms.label}>
                  Intro paragraph
                  <span className={cms.hint}> — appears before the blue notice box</span>
                </label>
                <textarea
                  className={cms.textarea}
                  rows={2}
                  placeholder={DEFAULTS.intro}
                  {...field('intro')}
                />
              </div>

              <div className={cms.fieldGroup}>
                <label className={cms.label}>
                  Main body paragraph
                  <span className={cms.hint}> — longer text after the box</span>
                </label>
                <textarea
                  className={cms.textarea}
                  rows={5}
                  placeholder={DEFAULTS.body}
                  {...field('body')}
                />
              </div>

              <div className={cms.fieldGroup}>
                <label className={cms.label}>
                  Sign-off line
                  <span className={cms.hint}> — default: "{DEFAULTS.signoff}"</span>
                </label>
                <input
                  className={cms.input}
                  placeholder={DEFAULTS.signoff}
                  {...field('signoff')}
                />
              </div>
            </section>

            {/* ── NOTICE BOX ─── */}
            <section className={cms.formSection}>
              <h2 className={cms.sectionHeading}>Highlighted Notice Box</h2>
              <p className={cms.sectionDesc}>The blue box in the middle of the page with an orange accent bar.</p>

              <div className={cms.fieldGroup}>
                <label className={cms.label}>
                  Main line
                  <span className={cms.hint}> — default: "{DEFAULTS.notice_main}"</span>
                </label>
                <input
                  className={cms.input}
                  placeholder={DEFAULTS.notice_main}
                  {...field('notice_main')}
                />
              </div>

              <div className={cms.fieldGroup}>
                <label className={cms.label}>
                  Sub line <span className={cms.hint}>(all caps)</span>
                  <span className={cms.hint}> — default: "{DEFAULTS.notice_sub}"</span>
                </label>
                <input
                  className={cms.input}
                  placeholder={DEFAULTS.notice_sub}
                  {...field('notice_sub')}
                />
              </div>

              <div className={cms.fieldGroup}>
                <label className={cms.label}>
                  Large italic word at the bottom
                  <span className={cms.hint}> — default: "{DEFAULTS.notice_rest}"</span>
                </label>
                <input
                  className={cms.input}
                  placeholder={DEFAULTS.notice_rest}
                  {...field('notice_rest')}
                />
              </div>
            </section>

            {/* ── WEEKLY VERSES ─── */}
            <section className={cms.formSection}>
              <h2 className={cms.sectionHeading}>Weekly Encouragement Verses</h2>
              <p className={cms.sectionDesc}>
                The verse shown at the bottom of the page each Sunday.
                Add a date-specific verse for a Sunday, or update the default fallback.
              </p>

              {/* Default verse */}
              <div className={cms.fieldGroup}>
                <label className={cms.label}>
                  Default verse <span className={cms.hint}>(used when no date-specific verse is set)</span>
                </label>
                <textarea
                  className={cms.textarea}
                  rows={2}
                  placeholder={DEFAULTS.default_verse}
                  {...field('default_verse')}
                />
              </div>

              {/* Existing date verses */}
              {dateVerses.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                  <p className={cms.label} style={{ marginBottom: 4 }}>Date-specific verses</p>
                  {dateVerses.map((v, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <input
                        className={cms.input}
                        style={{ width: 140, flexShrink: 0 }}
                        value={v.date}
                        onChange={e => updateVerse(i, 'date', e.target.value)}
                        placeholder="YYYY-MM-DD"
                      />
                      <textarea
                        className={cms.textarea}
                        rows={2}
                        style={{ flex: 1, minWidth: 0 }}
                        value={v.text}
                        onChange={e => updateVerse(i, 'text', e.target.value)}
                        placeholder="Verse text…"
                      />
                      <button
                        type="button"
                        className={cms.cancelBtn}
                        style={{ flexShrink: 0 }}
                        onClick={() => removeVerse(i)}
                        title="Remove this verse"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new date verse */}
              <div style={{ border: '1px dashed var(--border)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p className={cms.hint} style={{ margin: 0, fontWeight: 600 }}>+ Add a date-specific verse</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <input
                    className={cms.input}
                    style={{ width: 150, flexShrink: 0 }}
                    value={newVerse.date}
                    onChange={e => setNewVerse(v => ({ ...v, date: e.target.value }))}
                    placeholder="YYYY-MM-DD (e.g. 2026-03-15)"
                  />
                  <textarea
                    className={cms.textarea}
                    rows={2}
                    style={{ flex: 1, minWidth: 0 }}
                    value={newVerse.text}
                    onChange={e => setNewVerse(v => ({ ...v, text: e.target.value }))}
                    placeholder={'"Come to me, all you who are weary…" — Matthew 11:28'}
                  />
                  <button
                    type="button"
                    className={cms.saveBtn}
                    style={{ flexShrink: 0 }}
                    onClick={addVerse}
                    disabled={!newVerse.date || !newVerse.text}
                  >
                    Add
                  </button>
                </div>
              </div>
            </section>

            {/* ── SAVE ─── */}
            {saveError && <p className={cms.formError}>{saveError}</p>}
            {saveOk && (
              <p style={{ color: 'var(--green, #2d6a4f)', fontWeight: 600, margin: 0 }}>
                ✓ Changes saved successfully.
              </p>
            )}

            <div className={cms.modalFooter} style={{ paddingTop: 0 }}>
              <button type="submit" className={cms.saveBtn} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>

          </form>
        )}
      </AdminLayout>
    </>
  )
}
