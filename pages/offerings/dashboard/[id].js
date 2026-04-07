import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { apiFetch, getToken } from '../../../lib/api'
import styles from '../../../styles/Dashboard.module.css'

function SeedIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: 6 }}>
      <path d="M12 22V12" />
      <path d="M12 12C12 7 7 3 2 4c0 5 3.5 9 10 8z" />
      <path d="M12 12c0-5 5-9 10-8-1 5-4.5 9-10 8z" />
    </svg>
  )
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''
const unwrap = json => json?.data ?? json

const STATUS_COLORS = {
  draft: '#9E9E9E',
  live: '#4CAF50',
  closed: '#2196F3',
  cancelled: '#e53935',
}

export default function OfferingDashboardPage() {
  const router = useRouter()
  const { id } = router.query
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Pitch materials
  const [pitchLabel, setPitchLabel] = useState('')
  const [pitchFile, setPitchFile] = useState(null)
  const [pitchUploading, setPitchUploading] = useState(false)
  const [pitchError, setPitchError] = useState('')
  const [pitchSuccess, setPitchSuccess] = useState('')
  const fileInputRef = useRef(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await apiFetch(`/profiles/offerings/${id}/dashboard/`)
      if (res.ok) {
        setData(unwrap(await res.json()))
      } else if (res.status === 403) {
        router.replace(`/offerings/${id}`)
      } else {
        router.replace('/offerings')
      }
    } catch (e) {}
    setLoading(false)
  }, [id, router])

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return }
    load()
  }, [load, router])

  async function uploadPitchMaterial(e) {
    e.preventDefault()
    if (!pitchLabel.trim()) { setPitchError('Enter a label for this file.'); return }
    if (!pitchFile) { setPitchError('Select a file to upload.'); return }
    setPitchUploading(true); setPitchError(''); setPitchSuccess('')
    try {
      const form = new FormData()
      form.append('offering', id)
      form.append('label', pitchLabel.trim())
      form.append('file', pitchFile)
      const token = getToken()
      const res = await fetch(`${API_BASE}/profiles/pitch-materials/`, {
        method: 'POST',
        headers: token ? { Authorization: `Token ${token}` } : {},
        body: form,
      })
      if (res.ok) {
        setPitchLabel(''); setPitchFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        setPitchSuccess('File uploaded.')
        await load()
        setTimeout(() => setPitchSuccess(''), 3000)
      } else {
        const d = unwrap(await res.json())
        setPitchError(d?.file?.[0] || d?.label?.[0] || d?.detail || d?.error || 'Upload failed.')
      }
    } catch (e) { setPitchError('Network error.') }
    setPitchUploading(false)
  }

  async function deletePitchMaterial(matId, label) {
    if (!confirm(`Delete "${label}"?`)) return
    try {
      await apiFetch(`/profiles/pitch-materials/${matId}/`, { method: 'DELETE' })
      await load()
    } catch (e) {}
  }

  if (loading) return <div className="container"><div className="spinner">Loading&hellip;</div></div>
  if (!data) return null

  const seeds = data.seeds || []
  const pitchMaterials = data.pitch_materials || []

  return (
    <>
      <Head><title>{data.title} &mdash; Dashboard &mdash; By The Fruit</title></Head>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

          {/* Nav */}
          <div className={styles.nav}>
            <Link href={`/offerings/${id}`} className={styles.backLink}>&larr; Back to Offering</Link>
            <span className={styles.navTitle}>Offering Dashboard</span>
          </div>

          {/* Header */}
          <div className={styles.offeringHeader}>
            <div className={styles.offeringMeta}>
              <p className={styles.eyebrow}>Offering</p>
              <h1 className={styles.title}>{data.title}</h1>
              <div className={styles.statusRow}>
                <span className={styles.pill} style={{ background: STATUS_COLORS[data.status] || '#555' }}>
                  {data.status}
                </span>
                {data.round_type_display && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '3px 10px', borderRadius: 20, background: 'rgba(245,166,35,0.15)', color: 'var(--orange)', border: '1px solid rgba(245,166,35,0.3)' }}>
                    {data.round_type_display}
                  </span>
                )}
                {data.closing_date && (
                  <span className={styles.closingDate}>
                    Closes {new Date(data.closing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statVal}>{data.seed_count}</span>
                <span className={styles.statLabel}>Seeds</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statVal}>${Number(data.target_raise).toLocaleString()}</span>
                <span className={styles.statLabel}>Target</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statVal}>${Number(data.min_investment).toLocaleString()}</span>
                <span className={styles.statLabel}>Min. Investment</span>
              </div>
            </div>
          </div>

          {/* Edit link */}
          <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
            <Link href={`/offerings/edit/${id}`} style={{ fontSize: '0.85rem', color: 'var(--orange)', textDecoration: 'none', fontWeight: 600 }}>
              Edit Offering &rarr;
            </Link>
          </div>

          {/* Seeds section */}
          <div className={styles.spvBlock}>
            <div className={styles.spvHeader}>
              <div>
                <h2 className={styles.spvName}><SeedIcon size={18} />Seed Interest</h2>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', opacity: 0.55 }}>
                  Community members who believe in this project. Investors look at seed count as a signal of momentum.
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{data.seed_count}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{data.seed_count === 1 ? 'person' : 'people'}</div>
              </div>
            </div>

            {seeds.length === 0 ? (
              <p className={styles.noCommitments}>No seeds yet &mdash; share your offering to build momentum.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Seeded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seeds.map(s => (
                      <tr key={s.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {s.photo ? (
                              <img src={s.photo} alt={s.name} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(245,166,35,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--orange)' }}>
                                {(s.name || '?')[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <Link href={`/profile/${s.user_id}`} style={{ fontWeight: 600, fontSize: '0.88rem', color: 'inherit', textDecoration: 'none' }}>
                                {s.name}
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td className={styles.date}>
                          {new Date(s.seeded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pitch Materials */}
          <div className={styles.pitchSection}>
            <div className={styles.pitchHeader}>
              <h3 className={styles.pitchHeading}>Pitch Materials</h3>
              <span style={{ fontSize: '0.72rem', opacity: 0.4 }}>
                {pitchMaterials.length} file{pitchMaterials.length !== 1 ? 's' : ''}
              </span>
            </div>

            {pitchMaterials.length === 0 ? (
              <p className={styles.pitchEmpty}>No files uploaded yet.</p>
            ) : (
              <ul className={styles.pitchList}>
                {pitchMaterials.map(m => (
                  <li key={m.id} className={styles.pitchItem}>
                    <div>
                      <div className={styles.pitchItemLabel}>{m.label}</div>
                      <div className={styles.pitchItemMeta}>
                        {m.created_at ? new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                        {m.uploaded_by_name ? ` \u00b7 ${m.uploaded_by_name}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <a href={m.file} target="_blank" rel="noopener noreferrer" className={styles.pitchDownloadLink}>
                        Download &nearr;
                      </a>
                      <button className={styles.pitchDeleteBtn} onClick={() => deletePitchMaterial(m.id, m.label)}>&#x2715;</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={uploadPitchMaterial} className={styles.pitchUploadForm}>
              <div className={styles.pitchFormGroup}>
                <label className={styles.pitchFormLabel}>Label</label>
                <input
                  className={styles.pitchLabelInput}
                  type="text"
                  placeholder="e.g. Pitch Deck, Q4 Financials"
                  value={pitchLabel}
                  onChange={e => { setPitchLabel(e.target.value); setPitchError('') }}
                />
              </div>
              <div className={styles.pitchFormGroup}>
                <label className={styles.pitchFormLabel}>File</label>
                <input
                  ref={fileInputRef}
                  className={styles.pitchFileInput}
                  type="file"
                  onChange={e => { setPitchFile(e.target.files[0] || null); setPitchError('') }}
                />
              </div>
              <button type="submit" className={styles.pitchUploadBtn} disabled={pitchUploading}>
                {pitchUploading ? 'Uploading...' : '+ Upload'}
              </button>
            </form>
            {pitchError && <p className={`${styles.pitchMsg} ${styles.pitchMsgError}`}>{pitchError}</p>}
            {pitchSuccess && <p className={`${styles.pitchMsg} ${styles.pitchMsgSuccess}`}>{pitchSuccess}</p>}
          </div>

        </motion.div>
      </div>
    </>
  )
}
