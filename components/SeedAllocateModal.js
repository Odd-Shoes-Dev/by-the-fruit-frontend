/**
 * SeedAllocateModal.js — allocation flow modal.
 * Quick-select (100 / 250 / 500) + custom input + compliance note.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch } from '../lib/api'
import styles from '../styles/Orchard.module.css'
import { SeedSymbol, SeedCount } from './SeedSymbol'

const QUICK_AMOUNTS = [100, 250, 500]

export default function SeedAllocateModal({ project, wallet, onClose, onSuccess }) {
  const [selected, setSelected] = useState(null)
  const [custom, setCustom] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [newBalance, setNewBalance] = useState(null)

  const currentAllocation = project?.user_allocation || 0
  const balance = wallet?.balance ?? 0

  function getAmount() {
    if (selected !== null && selected !== 'custom') return selected
    const n = parseInt(custom, 10)
    return isNaN(n) ? null : n
  }

  async function handleConfirm() {
    const amount = getAmount()
    if (!amount || amount <= 0) {
      setError('Please select or enter an amount.')
      return
    }
    if (amount > balance + currentAllocation) {
      setError(`You only have ${(balance + currentAllocation).toLocaleString()} seeds available.`)
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/seeds/allocations/allocate/', {
        method: 'POST',
        body: JSON.stringify({ project_id: project.id, amount }),
      })
      const data = await res.json()
      if (res.ok) {
        setNewBalance(data.new_balance)
        setSuccess(true)
        if (onSuccess) onSuccess({ amount, new_balance: data.new_balance })
      } else {
        setError(data.detail || 'Something went wrong.')
      }
    } catch (e) {
      setError('Network error. Please try again.')
    }
    setLoading(false)
  }

  function handleAmountClick(amt) {
    setSelected(amt)
    setCustom('')
    setError('')
  }

  function handleCustomChange(e) {
    setSelected('custom')
    setCustom(e.target.value)
    setError('')
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <motion.div
        className={styles.modal}
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
      >
        {success ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>🌱</div>
            <h3 className={styles.successTitle}>Seeds Planted!</h3>
            <p className={styles.successSub}>
              You've sent {getAmount()?.toLocaleString()} seeds to "{project.title}".<br />
              Remaining balance: <SeedCount amount={newBalance ?? balance} />
            </p>
            <button className={styles.doneBtn} onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderTop}>
                <div>
                  <h3 className={styles.modalTitle}>Allocate Seeds</h3>
                  <p className={styles.modalProjectName}>{project?.title}</p>
                </div>
                <button className={styles.modalClose} onClick={onClose}>✕</button>
              </div>
              <div className={styles.modalBalance}>
                <SeedSymbol size={16} />
                <span>Your balance:</span>
                <span className={styles.modalBalanceNum}>{balance.toLocaleString()}</span>
                <span style={{ color: '#b5d4b5' }}>seeds</span>
                {currentAllocation > 0 && (
                  <span style={{ color: '#b5d4b5', marginLeft: 'auto', fontSize: '0.75rem' }}>
                    (currently {currentAllocation.toLocaleString()} allocated here)
                  </span>
                )}
              </div>
            </div>

            <div className={styles.modalBody}>
              {/* Quick-select */}
              <div className={styles.quickButtons}>
                {QUICK_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    className={`${styles.quickBtn} ${selected === amt ? styles.quickBtnActive : ''}`}
                    onClick={() => handleAmountClick(amt)}
                    disabled={amt > balance + currentAllocation}
                  >
                    {amt.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Custom input */}
              <label className={styles.customInputLabel}>Or enter a custom amount</label>
              <input
                type="number"
                className={styles.customInput}
                placeholder="e.g. 750"
                value={custom}
                onChange={handleCustomChange}
                min={1}
                max={balance + currentAllocation}
              />

              {/* Compliance note */}
              <div className={styles.complianceNote}>
                <strong>Compliance reminder:</strong> Seeds have no monetary value, do not
                represent equity or ownership, are not investments, and cannot be converted
                to any financial instrument. This is a cultural conviction signal only.
              </div>

              {error && <p className={styles.errorMsg}>{error}</p>}

              <button
                className={styles.confirmBtn}
                onClick={handleConfirm}
                disabled={loading || getAmount() === null}
              >
                {loading ? 'Allocating…' : `Confirm — ${getAmount()?.toLocaleString() ?? 0} seeds`}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
