import { useState, useEffect } from 'react'
import { apiFetch, getToken, getStoredUser } from '../lib/api'
import FluffyButton from './FluffyButton'
import styles from '../styles/PostList.module.css'

function Avatar({ src, name, size = 40 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (src) {
    return <img src={src} alt={name} width={size} height={size} className={styles.avatar} style={{ width: size, height: size }} />
  }
  return (
    <div className={styles.avatarFallback} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  )
}

export default function PostForm({ onCreate }) {
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  async function handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault()
    if (!content.trim()) return
    setStatus('sending')
    setError(null)
    const payload = { content: content.trim(), category: category || null }
    const token = getToken()

    if (token) {
      try {
        const res = await apiFetch('/profiles/community-posts/', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          const json = await res.json()
          const data = json?.data ?? json
          setStatus('saved')
          setContent('')
          setCategory('')
          setFocused(false)
          setTimeout(() => setStatus(null), 3000)
          onCreate && onCreate(data)
          return
        }
        let msg = `Error ${res.status}`
        try {
          const errJson = await res.json()
          const errData = errJson?.data ?? errJson
          msg = errData?.detail || errData?.content?.[0] || errData?.non_field_errors?.[0] || JSON.stringify(errData) || msg
        } catch (_) {}
        setStatus(null)
        setError(msg)
        return
      } catch (err) {
        setStatus(null)
        setError('Network error — check your connection.')
        return
      }
    }

    // No token fallback
    const posts = JSON.parse(localStorage.getItem('btf_posts') || '[]')
    const item = { ...payload, author: 'Me', created_at: new Date().toISOString() }
    posts.unshift(item)
    localStorage.setItem('btf_posts', JSON.stringify(posts))
    setStatus('saved-local')
    setContent('')
    setCategory('')
    setFocused(false)
    onCreate && onCreate(item)
  }

  const name = user?.full_name || user?.email || ''
  const photo = user?.photo || null

  return (
    <div className={styles.postFormCard}>
      <div className={styles.postFormTop}>
        <Avatar src={photo} name={name} size={40} />
        <textarea
          className={styles.postFormTextarea}
          value={content}
          onChange={e => setContent(e.target.value)}
          onFocus={() => setFocused(true)}
          rows={focused || content ? 3 : 1}
          placeholder="Share an update, deal, or event…"
        />
      </div>

      {(focused || content) && (
        <div className={styles.postFormFooter}>
          <select
            className={styles.postFormSelect}
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="">Category (optional)</option>
            <option value="technology">Technology</option>
            <option value="finance">Finance</option>
            <option value="healthcare">Healthcare</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>

          <div className={styles.postFormActions}>
            {status === 'saved' && <span className={styles.postSuccess}>✓ Posted</span>}
            {status === 'saved-local' && <span className={styles.postMuted}>Saved locally</span>}
            {error && <span className={styles.postError}>{error}</span>}
            <FluffyButton
              onClick={handleSubmit}
              disabled={!content.trim() || status === 'sending'}
              label={status === 'sending' ? 'Posting…' : 'Post'}
              width={88}
              height={36}
              strands={600}
              strandLen={6}
              fontSize={13}
            />
          </div>
        </div>
      )}
    </div>
  )
}
