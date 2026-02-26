import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { apiFetch, getToken } from '../../lib/api'
import styles from '../../styles/Dashboard.module.css'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''
const unwrap = json => json?.data ?? json

const STATUS_COLORS = {
  pending: '#E8601A',
  signed: '#4CAF50',
  funded: '#2196F3',
  refunded: '#9E9E9E',
}
const BADGE_COLORS = {
  approved: '#4CAF50',
  pending: '#E8601A',
  rejected: '#e53935',
  pending_signature: '#E8601A',
  signed: '#4CAF50',
  counter_signed: '#9C27B0',
  voided: '#9E9E9E',
}
const SPV_STATUS_COLORS = {
  open: '#4CAF50',
  closing: '#E8601A',
  closed: '#9E9E9E',
}

function Pill({ label, color }) {
  return (
    <span className={styles.pill} style={{ background: color || '#555' }}>
      {label}
    </span>
  )
}

function ProgressBar({ percent }) {
  return (
    <div className={styles.progressTrack}>
      <div className={styles.progressFill} style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  )
}

export default function OfferingDashboardPage() {
  const router = useRouter()
  const { id } = router.query
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [closingSpv, setClosingSpv] = useState(null)
  const [error, setError] = useState('')
  const [addSpvName, setAddSpvName] = useState('')
  const [addSpvSaving, setAddSpvSaving] = useState(false)
  const [addSpvError, setAddSpvError] = useState('')

  // Counter-sign state: { [commitmentId]: { open, name, saving, error } }
  const [csState, setCsState] = useState({})

  // Auto-close state: { [spvId]: { value, saving } }
  const [acState, setAcState] = useState({})

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
        const d = unwrap(await res.json())
        setData(d)
        const ac = {}
        ;(d.spvs || []).forEach(spv => {
          ac[spv.id] = { value: spv.auto_close_at ? spv.auto_close_at.slice(0, 16) : '', saving: false }
        })
        setAcState(ac)
      } else if (res.status === 403) {
        router.replace(`/offerings/${id}`)
      } else {
        router.replace('/offerings')
      }
    } catch (e) {}
    setLoading(false)
  }, [id, router])

  useEffect(() => {
    const t = getToken()
    if (!t) { router.replace('/login'); return }
    load()
  }, [load, router])

  // â”€â”€ Close SPV â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function handleCloseSpv(spvId, spvName) {
    if (!confirm(`Close "${spvName}"?\n\nThis will refund all pending commitments and notify funded investors. Cannot be undone.`)) return
    setClosingSpv(spvId)
    setError('')
    try {
      const res = await apiFetch(`/profiles/spvs/${spvId}/close/`, { method: 'POST' })
      if (res.ok) {
        await load()
      } else {
        const d = unwrap(await res.json())
        setError(d?.detail || d?.error || 'Could not close SPV.')
      }
    } catch (e) { setError('Network error.') }
    setClosingSpv(null)
  }

  // â”€â”€ Add SPV â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function handleAddSpv(e) {
    e.preventDefault()
    if (!addSpvName.trim()) { setAddSpvError('Enter an SPV name.'); return }
    setAddSpvSaving(true)
    setAddSpvError('')
    try {
      const res = await apiFetch('/profiles/spvs/', {
        method: 'POST',
        body: JSON.stringify({ offering: Number(id), name: addSpvName.trim(), status: 'open' }),
      })
      if (res.ok) {
        setAddSpvName('')
        await load()
      } else {
        const d = unwrap(await res.json())
        setAddSpvError(d?.detail || d?.error || d?.name?.[0] || 'Could not create SPV.')
      }
    } catch (e) { setAddSpvError('Network error.') }
    setAddSpvSaving(false)
  }

  // â”€â”€ Auto-close â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function handleAutoClose(spvId, clear = false) {
    const val = clear ? null : acState[spvId]?.value
    if (!clear && !val) return
    setAcState(s => ({ ...s, [spvId]: { ...s[spvId], saving: true } }))
    try {
      const res = await apiFetch(`/profiles/spvs/${spvId}/set-auto-close/`, {
        method: 'POST',
        body: JSON.stringify({ auto_close_at: clear ? null : new Date(val).toISOString() }),
      })
      if (res.ok) {
        await load()
      } else {
        const d = unwrap(await res.json())
        setError(d?.error || 'Could not set auto-close.')
      }
    } catch (e) { setError('Network error.') }
    setAcState(s => ({ ...s, [spvId]: { ...s[spvId], saving: false } }))
  }

  // â”€â”€ Counter-sign â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function openCounterSign(cId) {
    setCsState(s => ({ ...s, [cId]: { open: true, name: '', saving: false, error: '' } }))
  }
  async function submitCounterSign(cId, agreementId) {
    const name = csState[cId]?.name?.trim()
    if (!name) { setCsState(s => ({ ...s, [cId]: { ...s[cId], error: 'Enter your full legal name.' } })); return }
    setCsState(s => ({ ...s, [cId]: { ...s[cId], saving: true, error: '' } }))
    try {
      const res = await apiFetch(`/profiles/subscription-agreements/${agreementId}/counter-sign/`, {
        method: 'POST',
        body: JSON.stringify({ issuer_signer_name: name }),
      })
      if (res.ok) {
        setCsState(s => ({ ...s, [cId]: { open: false, name: '', saving: false, error: '' } }))
        await load()
      } else {
        const d = unwrap(await res.json())
        setCsState(s => ({ ...s, [cId]: { ...s[cId], saving: false, error: d?.error || d?.detail || 'Could not counter-sign.' } }))
      }
    } catch (e) {
      setCsState(s => ({ ...s, [cId]: { ...s[cId], saving: false, error: 'Network error.' } }))
    }
  }

  // â”€â”€ Pitch materials â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function uploadPitchMaterial(e) {
    e.preventDefault()
    if (!pitchLabel.trim()) { setPitchError('Enter a label for this file.'); return }
    if (!pitchFile) { setPitchError('Select a file to upload.'); return }
    setPitchUploading(true)
    setPitchError('')
    setPitchSuccess('')
    try {
      const form = new FormData()
      form.append('offering', id)
      form.append('label', pitchLabel.trim())
      form.append('file', pitchFile)
      const token = getToken()
      const res = await fetch(`${API_BASE}/profiles/pitch-materials/`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Token ${token}` } : {}) },
        body: form,
      })
      if (res.ok) {
        setPitchLabel('')
        setPitchFile(null)
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

  if (loading) return <div className="container"><div className="spinner">Loadingâ€¦</div></div>
  if (!data) return null

  const targetRaise = Number(data.target_raise)
  const pitchMaterials = data.pitch_materials || []

  return (
    <>
      <Head><title>{data.title} â€” Pipeline Dashboard â€” By The Fruit</title></Head>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

          <div className={styles.nav}>
            <Link href={`/offerings/${id}`} className={styles.backLink}>â† Back to Offering</Link>
            <span className={styles.navTitle}>Pipeline Dashboard</span>
          </div>

          {/* â”€â”€ Offering Header â”€â”€ */}
          <div className={styles.offeringHeader}>
            <div className={styles.offeringMeta}>
              <p className={styles.eyebrow}>Offering</p>
              <h1 className={styles.title}>{data.title}</h1>
              <div className={styles.statusRow}>
                <Pill label={data.status} color={data.status === 'live' ? '#4CAF50' : data.status === 'draft' ? '#9E9E9E' : '#E8601A'} />
                {data.closing_date && (
                  <span className={styles.closingDate}>
                    Closes {new Date(data.closing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statVal}>${Number(data.funded_total).toLocaleString()}</span>
                <span className={styles.statLabel}>Funded</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statVal}>${targetRaise.toLocaleString()}</span>
                <span className={styles.statLabel}>Target</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statVal}>{data.progress_percent}%</span>
                <span className={styles.statLabel}>Progress</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statVal}>{data.total_investors}</span>
                <span className={styles.statLabel}>Investors</span>
              </div>
            </div>
          </div>

          <div className={styles.progressSection}>
            <div className={styles.progressLabels}>
              <span>${Number(data.funded_total).toLocaleString()} raised</span>
              <span>${targetRaise.toLocaleString()} target</span>
            </div>
            <ProgressBar percent={data.progress_percent} />
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          {/* â”€â”€ SPVs â”€â”€ */}
          {data.spvs.length === 0 ? (
            <div className={styles.empty}>No SPVs for this offering yet.</div>
          ) : (
            data.spvs.map(spv => (
              <div key={spv.id} className={styles.spvBlock}>
                <div className={styles.spvHeader}>
                  <div style={{ flex: 1 }}>
                    <h2 className={styles.spvName}>{spv.name}</h2>
                    <div className={styles.spvMeta}>
                      <Pill label={spv.status} color={SPV_STATUS_COLORS[spv.status] || '#555'} />
                      <span className={styles.spvStat}>{spv.investor_count} investor{spv.investor_count !== 1 ? 's' : ''}</span>
                      <span className={styles.spvStat}>${Number(spv.total_committed).toLocaleString()} committed</span>
                      <span className={styles.spvStat}>{spv.funded_count} funded</span>
                      <span className={styles.spvStat}>{spv.signed_count} signed</span>
                      {spv.closed_at && (
                        <span className={styles.spvStat}>
                          Closed {new Date(spv.closed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                      {spv.auto_close_at && spv.status !== 'closed' && (
                        <span className={styles.spvStat} style={{ color: 'var(--orange)' }}>
                          Auto-closes {new Date(spv.auto_close_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    {/* Auto-close setter */}
                    {spv.status !== 'closed' && (
                      <div className={styles.autoCloseRow}>
                        <span className={styles.autoCloseLabel}>Auto-close:</span>
                        <input
                          type="datetime-local"
                          className={styles.autoCloseInput}
                          value={acState[spv.id]?.value || ''}
                          onChange={e => setAcState(s => ({ ...s, [spv.id]: { ...s[spv.id], value: e.target.value } }))}
                        />
                        <button
                          className={styles.autoCloseSetBtn}
                          disabled={!acState[spv.id]?.value || acState[spv.id]?.saving}
                          onClick={() => handleAutoClose(spv.id)}
                        >
                          {acState[spv.id]?.saving ? 'Savingâ€¦' : 'Set'}
                        </button>
                        {spv.auto_close_at && (
                          <button className={styles.autoCloseClearBtn} onClick={() => handleAutoClose(spv.id, true)}>
                            âœ• Clear
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {spv.status !== 'closed' && (
                    <button
                      className={styles.closeBtn}
                      onClick={() => handleCloseSpv(spv.id, spv.name)}
                      disabled={closingSpv === spv.id}
                    >
                      {closingSpv === spv.id ? 'Closingâ€¦' : 'Close SPV'}
                    </button>
                  )}
                </div>

                {spv.commitments.length === 0 ? (
                  <p className={styles.noCommitments}>No commitments yet.</p>
                ) : (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Investor</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>KYC</th>
                          <th>Payment</th>
                          <th>Signature</th>
                          <th>Counter-Sign</th>
                          <th>Committed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {spv.commitments.map(c => (
                          <tr key={c.id}>
                            <td>
                              <div className={styles.investorName}>{c.investor_name}</div>
                              <div className={styles.investorEmail}>{c.investor_email}</div>
                            </td>
                            <td className={styles.amount}>${Number(c.amount).toLocaleString()}</td>
                            <td><Pill label={c.status} color={STATUS_COLORS[c.status] || '#555'} /></td>
                            <td>
                              {c.kyc_verified
                                ? <Pill label="Verified" color="#4CAF50" />
                                : <Pill label="Pending" color="#E8601A" />}
                            </td>
                            <td>
                              {c.payment_intent_id
                                ? <Pill label="Paid" color="#2196F3" />
                                : <Pill label="Unpaid" color="rgba(244,239,230,0.12)" />}
                            </td>
                            <td>
                              {c.agreement_status
                                ? <Pill label={c.agreement_status.replace(/_/g, ' ')} color={BADGE_COLORS[c.agreement_status] || '#555'} />
                                : <span className={styles.na}>â€”</span>}
                            </td>
                            <td>
                              {c.agreement_status === 'counter_signed' ? (
                                <span className={styles.counterSignedBadge}>âœ“ Counter-signed</span>
                              ) : c.agreement_status === 'signed' && c.agreement_id ? (
                                csState[c.id]?.open ? (
                                  <div>
                                    <div className={styles.counterSignRow}>
                                      <input
                                        className={styles.counterSignInput}
                                        placeholder="Your full legal name"
                                        value={csState[c.id]?.name || ''}
                                        onChange={e => setCsState(s => ({ ...s, [c.id]: { ...s[c.id], name: e.target.value } }))}
                                      />
                                      <button
                                        className={styles.counterSignSubmit}
                                        disabled={csState[c.id]?.saving}
                                        onClick={() => submitCounterSign(c.id, c.agreement_id)}
                                      >
                                        {csState[c.id]?.saving ? 'â€¦' : 'âœ“'}
                                      </button>
                                    </div>
                                    {csState[c.id]?.error && (
                                      <p style={{ fontSize: '0.7rem', color: '#ff8a80', margin: '4px 0 0' }}>{csState[c.id].error}</p>
                                    )}
                                  </div>
                                ) : (
                                  <button className={styles.counterSignBtn} onClick={() => openCounterSign(c.id)}>
                                    Counter-sign
                                  </button>
                                )
                              ) : (
                                <span className={styles.na}>â€”</span>
                              )}
                            </td>
                            <td className={styles.date}>
                              {c.committed_at
                                ? new Date(c.committed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                                : 'â€”'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}

          {/* â”€â”€ Pitch Materials â”€â”€ */}
          <div className={styles.pitchSection}>
            <div className={styles.pitchHeader}>
              <h3 className={styles.pitchHeading}>Pitch Materials</h3>
              <span style={{ fontSize: '0.72rem', color: 'rgba(244,239,230,0.3)' }}>
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
                        {m.uploaded_by_name ? ` Â· ${m.uploaded_by_name}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <a href={m.file} target="_blank" rel="noopener noreferrer" className={styles.pitchDownloadLink}>
                        Download â†—
                      </a>
                      <button className={styles.pitchDeleteBtn} onClick={() => deletePitchMaterial(m.id, m.label)}>âœ•</button>
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
                {pitchUploading ? 'Uploadingâ€¦' : 'â†‘ Upload'}
              </button>
            </form>
            {pitchError && <p className={`${styles.pitchMsg} ${styles.pitchMsgError}`}>{pitchError}</p>}
            {pitchSuccess && <p className={`${styles.pitchMsg} ${styles.pitchMsgSuccess}`}>{pitchSuccess}</p>}
          </div>

          {/* â”€â”€ Add SPV â”€â”€ */}
          <div className={styles.addSpvWrap}>
            <h3 className={styles.addSpvHeading}>Add New SPV</h3>
            <form onSubmit={handleAddSpv} className={styles.addSpvForm}>
              <input
                className={styles.addSpvInput}
                type="text"
                placeholder="SPV name (e.g. Haiven SPV II)"
                value={addSpvName}
                onChange={e => { setAddSpvName(e.target.value); setAddSpvError('') }}
              />
              <button type="submit" className={styles.addSpvBtn} disabled={addSpvSaving}>
                {addSpvSaving ? 'Creatingâ€¦' : '+ Create SPV'}
              </button>
            </form>
            {addSpvError && <p className={styles.addSpvError}>{addSpvError}</p>}
          </div>

        </motion.div>
      </div>
    </>
  )
}
