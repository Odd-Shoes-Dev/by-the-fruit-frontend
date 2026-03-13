import Head from 'next/head'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { apiFetch, getToken, isAdmin } from '../../lib/api'
import AdminLayout from '../../components/AdminLayout'
import styles from '../../styles/Admin.module.css'
import cms from '../../styles/LandingCMS.module.css'

// ── helpers ──────────────────────────────────────────────────────────────────
const SECTION_TYPE_LABELS = {
  hero: 'Hero',
  problem: 'The Problem',
  vision: 'The Vision',
  how_it_works: 'How It Works',
  manifesto: 'Manifesto',
  cta: 'Call to Action',
  newsletter: 'Newsletter',
  custom: 'Custom',
}

const EMPTY_FORM = {
  label: '',
  title: '',
  subtitle: '',
  body: '',
  cta_primary_text: '',
  cta_primary_link: '',
  cta_secondary_text: '',
  cta_secondary_link: '',
  items: '',
}

function sectionToForm(sec) {
  return {
    label: sec.label || '',
    title: sec.title || '',
    subtitle: sec.subtitle || '',
    body: sec.body || '',
    cta_primary_text: sec.cta_primary_text || '',
    cta_primary_link: sec.cta_primary_link || '',
    cta_secondary_text: sec.cta_secondary_text || '',
    cta_secondary_link: sec.cta_secondary_link || '',
    items: sec.items ? JSON.stringify(sec.items, null, 2) : '[]',
  }
}

// ── main component ────────────────────────────────────────────────────────────
export default function AdminLandingPage() {
  const router = useRouter()
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [toggling, setToggling] = useState({})
  const [reordering, setReordering] = useState(false)
  const [jsonError, setJsonError] = useState('')

  // ── auth guard ──
  useEffect(() => {
    if (!getToken() || !isAdmin()) {
      router.replace('/login')
    }
  }, [router])

  // ── load sections ──
  const loadSections = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/landing-sections/')
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data.results || [])
        setSections(list.sort((a, b) => a.order - b.order))
      }
    } catch (e) {}
    setLoading(false)
  }, [])

  useEffect(() => {
    loadSections()
  }, [loadSections])

  // ── open edit modal ──
  function openEdit(sec) {
    setEditingId(sec.id)
    setForm(sectionToForm(sec))
    setSaveError('')
    setJsonError('')
  }

  function closeEdit() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setSaveError('')
    setJsonError('')
  }

  // ── save changes ──
  async function handleSave(e) {
    e.preventDefault()
    setSaveError('')
    setJsonError('')

    // Validate JSON
    let parsedItems
    try {
      parsedItems = JSON.parse(form.items || '[]')
    } catch {
      setJsonError('Items field contains invalid JSON.')
      return
    }

    setSaving(true)
    try {
      const res = await apiFetch(`/api/landing-sections/${editingId}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          label: form.label,
          title: form.title,
          subtitle: form.subtitle,
          body: form.body,
          cta_primary_text: form.cta_primary_text,
          cta_primary_link: form.cta_primary_link,
          cta_secondary_text: form.cta_secondary_text,
          cta_secondary_link: form.cta_secondary_link,
          items: parsedItems,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setSections(s => s.map(x => x.id === editingId ? updated : x))
        closeEdit()
      } else {
        const err = await res.json().catch(() => ({}))
        setSaveError(err.detail || 'Failed to save. Please try again.')
      }
    } catch {
      setSaveError('Network error. Please try again.')
    }
    setSaving(false)
  }

  // ── toggle visibility ──
  async function toggleVisibility(sec) {
    setToggling(t => ({ ...t, [sec.id]: true }))
    try {
      const res = await apiFetch(`/api/landing-sections/${sec.id}/toggle_visibility/`, {
        method: 'POST',
      })
      if (res.ok) {
        const updated = await res.json()
        setSections(s => s.map(x => x.id === sec.id ? updated : x))
      }
    } catch (e) {}
    setToggling(t => { const n = { ...t }; delete n[sec.id]; return n })
  }

  // ── reorder: move a section up or down ──
  async function moveSection(index, direction) {
    const newSections = [...sections]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newSections.length) return

    // Swap
    ;[newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]]

    // Assign new order values
    const reorderedWithOrder = newSections.map((s, i) => ({ ...s, order: i }))
    setSections(reorderedWithOrder)

    setReordering(true)
    try {
      await apiFetch('/api/landing-sections/reorder/', {
        method: 'POST',
        body: JSON.stringify(reorderedWithOrder.map(s => ({ id: s.id, order: s.order }))),
      })
    } catch (e) {}
    setReordering(false)
  }

  const editingSection = sections.find(s => s.id === editingId)

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <>
      <Head><title>Landing Page CMS — Admin — By The Fruit</title></Head>
      <AdminLayout active="landing-page">
        <div className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Admin</p>
            <h1 className={styles.pageTitle}>Landing Page</h1>
            <p className={styles.pageSub}>
              Edit section content, toggle visibility, and reorder sections.
            </p>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className={styles.btn}
            style={{ alignSelf: 'flex-start', textDecoration: 'none' }}
          >
            Preview Site ↗
          </a>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading sections…</div>
        ) : (
          <div className={cms.sectionList}>
            {sections.map((sec, i) => (
              <div
                key={sec.id}
                className={`${cms.sectionRow} ${sec.is_visible ? '' : cms.sectionHidden}`}
              >
                {/* Order controls */}
                <div className={cms.orderControls}>
                  <button
                    className={cms.orderBtn}
                    onClick={() => moveSection(i, 'up')}
                    disabled={i === 0 || reordering}
                    title="Move up"
                  >▲</button>
                  <span className={cms.orderNum}>{sec.order}</span>
                  <button
                    className={cms.orderBtn}
                    onClick={() => moveSection(i, 'down')}
                    disabled={i === sections.length - 1 || reordering}
                    title="Move down"
                  >▼</button>
                </div>

                {/* Section info */}
                <div className={cms.sectionInfo}>
                  <div className={cms.sectionMeta}>
                    <span className={cms.sectionKey}>{sec.key}</span>
                    <span className={cms.sectionType}>{SECTION_TYPE_LABELS[sec.section_type] || sec.section_type}</span>
                  </div>
                  <p className={cms.sectionLabel}>{sec.label || sec.title || '(no label)'}</p>
                  {sec.title && (
                    <p className={cms.sectionTitle} title={sec.title}>
                      {sec.title.length > 80 ? sec.title.slice(0, 80) + '…' : sec.title}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className={cms.sectionActions}>
                  {/* Visibility toggle */}
                  <button
                    className={`${cms.visBtn} ${sec.is_visible ? cms.visBtnOn : cms.visBtnOff}`}
                    onClick={() => toggleVisibility(sec)}
                    disabled={!!toggling[sec.id]}
                    title={sec.is_visible ? 'Click to hide section' : 'Click to show section'}
                  >
                    {toggling[sec.id] ? '…' : sec.is_visible ? '● Visible' : '○ Hidden'}
                  </button>

                  {/* Edit */}
                  <button
                    className={cms.editBtn}
                    onClick={() => openEdit(sec)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── EDIT MODAL ─────────────────────────────────────────── */}
        {editingId && editingSection && (
          <div className={cms.modalOverlay} onClick={e => { if (e.target === e.currentTarget) closeEdit() }}>
            <div className={cms.modal}>
              <div className={cms.modalHeader}>
                <div>
                  <h2 className={cms.modalTitle}>Edit Section</h2>
                  <p className={cms.modalSubtitle}>
                    <strong>{editingSection.key}</strong> · {SECTION_TYPE_LABELS[editingSection.section_type] || editingSection.section_type}
                  </p>
                </div>
                <button className={cms.modalClose} onClick={closeEdit}>✕</button>
              </div>

              <form onSubmit={handleSave} className={cms.modalForm}>
                {/* Label */}
                <div className={cms.fieldGroup}>
                  <label className={cms.label}>Label <span className={cms.hint}>(section tab/badge text)</span></label>
                  <input
                    className={cms.input}
                    value={form.label}
                    onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                    placeholder="e.g. The Problem"
                  />
                </div>

                {/* Title */}
                <div className={cms.fieldGroup}>
                  <label className={cms.label}>Title</label>
                  <textarea
                    className={cms.textarea}
                    rows={2}
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Main heading"
                  />
                </div>

                {/* Subtitle */}
                <div className={cms.fieldGroup}>
                  <label className={cms.label}>Subtitle / Eyebrow</label>
                  <input
                    className={cms.input}
                    value={form.subtitle}
                    onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                    placeholder="Eyebrow text or subtitle"
                  />
                </div>

                {/* Body */}
                <div className={cms.fieldGroup}>
                  <label className={cms.label}>Body / Description</label>
                  <textarea
                    className={cms.textarea}
                    rows={4}
                    value={form.body}
                    onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                    placeholder="Paragraph text"
                  />
                </div>

                {/* CTA row */}
                <div className={cms.fieldRow}>
                  <div className={cms.fieldGroup}>
                    <label className={cms.label}>Primary CTA Text</label>
                    <input
                      className={cms.input}
                      value={form.cta_primary_text}
                      onChange={e => setForm(f => ({ ...f, cta_primary_text: e.target.value }))}
                      placeholder="Button label"
                    />
                  </div>
                  <div className={cms.fieldGroup}>
                    <label className={cms.label}>Primary CTA Link</label>
                    <input
                      className={cms.input}
                      value={form.cta_primary_link}
                      onChange={e => setForm(f => ({ ...f, cta_primary_link: e.target.value }))}
                      placeholder="/path or https://…"
                    />
                  </div>
                </div>

                <div className={cms.fieldRow}>
                  <div className={cms.fieldGroup}>
                    <label className={cms.label}>Secondary CTA Text</label>
                    <input
                      className={cms.input}
                      value={form.cta_secondary_text}
                      onChange={e => setForm(f => ({ ...f, cta_secondary_text: e.target.value }))}
                      placeholder="Button label"
                    />
                  </div>
                  <div className={cms.fieldGroup}>
                    <label className={cms.label}>Secondary CTA Link</label>
                    <input
                      className={cms.input}
                      value={form.cta_secondary_link}
                      onChange={e => setForm(f => ({ ...f, cta_secondary_link: e.target.value }))}
                      placeholder="/path or https://…"
                    />
                  </div>
                </div>

                {/* Items (JSON) */}
                <div className={cms.fieldGroup}>
                  <label className={cms.label}>
                    Items <span className={cms.hint}>(JSON array — cards, steps, pillars)</span>
                  </label>
                  <textarea
                    className={`${cms.textarea} ${cms.mono}`}
                    rows={8}
                    value={form.items}
                    onChange={e => {
                      setForm(f => ({ ...f, items: e.target.value }))
                      setJsonError('')
                    }}
                    spellCheck={false}
                  />
                  {jsonError && <p className={cms.fieldError}>{jsonError}</p>}
                  <p className={cms.hint} style={{ marginTop: 4 }}>
                    Each item can have: <code>title</code>, <code>text</code>, <code>number</code>
                  </p>
                </div>

                {saveError && <p className={cms.formError}>{saveError}</p>}

                <div className={cms.modalFooter}>
                  <button type="button" className={cms.cancelBtn} onClick={closeEdit}>
                    Cancel
                  </button>
                  <button type="submit" className={cms.saveBtn} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  )
}
