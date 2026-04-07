/**
 * pages/admin/seed-projects.js — Admin panel for the Seed Allocation system.
 *
 * Shows:
 * - Platform analytics (total members, allocation rate, tier breakdown)
 * - All seed projects with inline controls (feature, unlock milestone)
 * - Add / edit project form
 */
import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiFetch, getToken, isAdmin } from '../../lib/api'
import AdminLayout from '../../components/AdminLayout'
import { SeedSymbol, SeedCount } from '../../components/SeedSymbol'
import styles from '../../styles/Orchard.module.css'

const unwrap = json => {
  const r = json?.data ?? json
  return Array.isArray(r) ? r : Array.isArray(r?.results) ? r.results : []
}

const STAGES = ['concept', 'pilot', 'development', 'launched']
const STAGE_LABELS = { concept: 'Concept', pilot: 'Pilot', development: 'Development', launched: 'Launched' }

const BLANK_FORM = {
  title: '', tagline: '', description: '', stage: 'concept',
  seed_threshold: 10000, is_active: true, is_featured: false, deadline: '',
}

export default function AdminSeedProjectsPage() {
  const router = useRouter()
  const [analytics, setAnalytics] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(BLANK_FORM)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!getToken() || !isAdmin()) { router.push('/login'); return }
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const [projRes, analyticsRes] = await Promise.all([
        apiFetch('/seeds/projects/'),
        apiFetch('/seeds/admin-analytics/overview/'),
      ])
      if (projRes.ok) setProjects(unwrap(await projRes.json()))
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json())
    } catch (e) {}
    setLoading(false)
  }

  async function handleUnlock(projectId) {
    if (!confirm('Unlock milestone for this project?')) return
    const res = await apiFetch(`/seeds/projects/${projectId}/unlock-milestone/`, { method: 'POST' })
    if (res.ok) load()
  }

  async function handleToggleFeatured(project) {
    const res = await apiFetch(`/seeds/projects/${project.id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ is_featured: !project.is_featured }),
    })
    if (res.ok) {
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, is_featured: !p.is_featured } : p))
    }
  }

  async function handleToggleActive(project) {
    const res = await apiFetch(`/seeds/projects/${project.id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !project.is_active }),
    })
    if (res.ok) {
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, is_active: !p.is_active } : p))
    }
  }

  function openEdit(project) {
    setEditId(project.id)
    setForm({
      title: project.title || '',
      tagline: project.tagline || '',
      description: project.description || '',
      stage: project.stage || 'concept',
      seed_threshold: project.seed_threshold || 10000,
      is_active: project.is_active ?? true,
      is_featured: project.is_featured ?? false,
      deadline: project.deadline ? project.deadline.slice(0, 16) : '',
    })
    setShowForm(true)
    setError('')
  }

  function openAdd() {
    setEditId(null)
    setForm(BLANK_FORM)
    setShowForm(true)
    setError('')
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      seed_threshold: parseInt(form.seed_threshold, 10),
      deadline: form.deadline || null,
    }
    try {
      const res = editId
        ? await apiFetch(`/seeds/projects/${editId}/`, { method: 'PATCH', body: JSON.stringify(payload) })
        : await apiFetch('/seeds/projects/', { method: 'POST', body: JSON.stringify(payload) })
      if (res.ok) {
        setShowForm(false)
        setEditId(null)
        setForm(BLANK_FORM)
        load()
      } else {
        const err = await res.json()
        setError(JSON.stringify(err))
      }
    } catch (e) {
      setError('Network error')
    }
    setSaving(false)
  }

  async function handleDelete(projectId) {
    if (!confirm('Delete this project permanently?')) return
    await apiFetch(`/seeds/projects/${projectId}/`, { method: 'DELETE' })
    load()
  }

  return (
    <AdminLayout active="seed-projects">
      <Head><title>Seed Projects — Admin</title></Head>

      <div className={styles.adminHeader}>
        <h1 className={styles.adminTitle}><SeedSymbol size={20} /> The Orchard — Seed Projects</h1>
        <button className={styles.addBtn} onClick={openAdd}>
          + Add Project
        </button>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className={styles.adminStatsRow}>
          <div className={styles.statBox}>
            <div className={styles.statBoxNum}>{analytics.total_members}</div>
            <div className={styles.statBoxLabel}>Total Members</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statBoxNum}>{analytics.paid_members}</div>
            <div className={styles.statBoxLabel}>Paid Members</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statBoxNum}>{(analytics.total_seeds_issued || 0).toLocaleString()}</div>
            <div className={styles.statBoxLabel}>Seeds Issued</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statBoxNum}>{(analytics.total_seeds_allocated || 0).toLocaleString()}</div>
            <div className={styles.statBoxLabel}>Seeds Allocated</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statBoxNum}>{analytics.allocation_rate_percent}%</div>
            <div className={styles.statBoxLabel}>Allocation Rate</div>
          </div>
          {analytics.tier_breakdown && Object.entries(analytics.tier_breakdown).map(([tier, count]) => (
            <div key={tier} className={styles.statBox}>
              <div className={styles.statBoxNum}>{count}</div>
              <div className={styles.statBoxLabel} style={{ textTransform: 'capitalize' }}>{tier}</div>
            </div>
          ))}
        </div>
      )}

      {/* Project form */}
      {showForm && (
        <div style={{
          background: '#fff', border: '1px solid #e0ece0', borderRadius: 16,
          padding: '1.5rem', margin: '0 1.5rem 1.5rem',
        }}>
          <h3 style={{ margin: '0 0 1.1rem', color: '#1a2e1a' }}>
            {editId ? 'Edit Project' : 'New Project'}
          </h3>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#5a7a5a', display: 'block', marginBottom: 4 }}>Title *</label>
                <input
                  required value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  style={{ width: '100%', padding: '0.6rem', border: '1.5px solid #d4e8d4', borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#5a7a5a', display: 'block', marginBottom: 4 }}>Stage</label>
                <select
                  value={form.stage}
                  onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
                  style={{ width: '100%', padding: '0.6rem', border: '1.5px solid #d4e8d4', borderRadius: 8, fontSize: '0.9rem' }}
                >
                  {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.78rem', color: '#5a7a5a', display: 'block', marginBottom: 4 }}>Tagline</label>
                <input
                  value={form.tagline}
                  onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                  style={{ width: '100%', padding: '0.6rem', border: '1.5px solid #d4e8d4', borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.78rem', color: '#5a7a5a', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={4}
                  style={{ width: '100%', padding: '0.6rem', border: '1.5px solid #d4e8d4', borderRadius: 8, fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#5a7a5a', display: 'block', marginBottom: 4 }}>Seed Threshold</label>
                <input
                  type="number" min={1} value={form.seed_threshold}
                  onChange={e => setForm(f => ({ ...f, seed_threshold: e.target.value }))}
                  style={{ width: '100%', padding: '0.6rem', border: '1.5px solid #d4e8d4', borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#5a7a5a', display: 'block', marginBottom: 4 }}>Deadline (optional)</label>
                <input
                  type="datetime-local" value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  style={{ width: '100%', padding: '0.6rem', border: '1.5px solid #d4e8d4', borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                  Active (visible)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
                  Featured (pinned)
                </label>
              </div>
            </div>
            {error && <p style={{ color: '#c62828', fontSize: '0.82rem', marginTop: '0.75rem' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="submit" className={styles.addBtn} disabled={saving}>
                {saving ? 'Saving…' : editId ? 'Update Project' : 'Create Project'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{
                padding: '0.55rem 1rem', background: '#f0f5f0',
                border: '1px solid #d4e8d4', borderRadius: '100px',
                fontSize: '0.85rem', cursor: 'pointer',
              }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects table */}
      {loading ? (
        <div className={styles.loading}>Loading…</div>
      ) : (
        <table className={styles.projectTable}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Stage</th>
              <th>Seeds</th>
              <th>Target</th>
              <th>Progress</th>
              <th>Supporters</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: '#8aaa8a', padding: '2rem' }}>No projects yet. Add one above.</td></tr>
            ) : projects.map(p => (
              <tr key={p.id}>
                <td>
                  <strong>{p.title}</strong>
                  {p.is_featured && <span style={{ marginLeft: 6, fontSize: '0.7rem', background: '#fff3e0', color: '#e65100', padding: '1px 6px', borderRadius: 100, fontWeight: 700 }}>Featured</span>}
                  {p.milestone_unlocked && <span style={{ marginLeft: 6, fontSize: '0.7rem', background: '#e8f5e9', color: '#2e7d32', padding: '1px 6px', borderRadius: 100, fontWeight: 700 }}>Unlocked</span>}
                </td>
                <td>{STAGE_LABELS[p.stage] || p.stage}</td>
                <td><SeedCount amount={p.total_seeds} size={12} /></td>
                <td><SeedCount amount={p.seed_threshold} size={12} /></td>
                <td>
                  <div style={{ width: 100, height: 8, background: '#e8f2e8', borderRadius: 100, overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(p.progress_percent || 0, 100)}%`,
                      height: '100%',
                      background: '#4caf50',
                      borderRadius: 100,
                    }} />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#8aaa8a' }}>{p.progress_percent || 0}%</span>
                </td>
                <td>{(p.supporter_count || 0).toLocaleString()}</td>
                <td>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px',
                    borderRadius: 100,
                    background: p.is_active ? '#e8f5e9' : '#fce4ec',
                    color: p.is_active ? '#2e7d32' : '#c62828',
                  }}>
                    {p.is_active ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button onClick={() => openEdit(p)} style={{
                      padding: '0.3rem 0.7rem', fontSize: '0.75rem',
                      background: '#e8f2e8', border: '1px solid #d4e8d4',
                      borderRadius: 100, cursor: 'pointer', color: '#2d6a2d', fontWeight: 600,
                    }}>Edit</button>
                    <button
                      className={styles.unlockBtn}
                      onClick={() => handleUnlock(p.id)}
                      disabled={p.milestone_unlocked}
                    >
                      {p.milestone_unlocked ? '✓ Unlocked' : 'Unlock'}
                    </button>
                    <button onClick={() => handleToggleFeatured(p)} style={{
                      padding: '0.3rem 0.7rem', fontSize: '0.75rem',
                      background: p.is_featured ? '#fff3e0' : '#f5f5f5',
                      border: '1px solid #ddd', borderRadius: 100,
                      cursor: 'pointer', fontWeight: 600,
                      color: p.is_featured ? '#e65100' : '#555',
                    }}>
                      {p.is_featured ? '★ Unfeature' : '☆ Feature'}
                    </button>
                    <button onClick={() => handleToggleActive(p)} style={{
                      padding: '0.3rem 0.7rem', fontSize: '0.75rem',
                      background: '#f5f5f5', border: '1px solid #ddd',
                      borderRadius: 100, cursor: 'pointer', color: '#555',
                    }}>
                      {p.is_active ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => handleDelete(p.id)} style={{
                      padding: '0.3rem 0.7rem', fontSize: '0.75rem',
                      background: '#fce4ec', border: '1px solid #f8bbd0',
                      borderRadius: 100, cursor: 'pointer', color: '#c62828', fontWeight: 600,
                    }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminLayout>
  )
}
