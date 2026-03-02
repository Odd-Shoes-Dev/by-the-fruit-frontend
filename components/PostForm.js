import { useState, useEffect, useRef } from 'react'
import { apiFetch, getToken, getStoredUser } from '../lib/api'
import FluffyButton from './FluffyButton'
import styles from '../styles/PostList.module.css'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'

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
  const [image, setImage] = useState(null)
  const [video, setVideo] = useState(null)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [focused, setFocused] = useState(false)
  const imageRef = useRef()
  const videoRef = useRef()

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  async function handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault()
    if (!content.trim()) return
    setStatus('sending')
    setError(null)
    const token = getToken()

    if (token) {
      try {
        let res
        if (image || video) {
          // Use FormData for multipart upload
          const form = new FormData()
          form.append('content', content.trim())
          if (category) form.append('category', category)
          if (image) form.append('image', image)
          if (video) form.append('video', video)
          res = await fetch(`${API_BASE}/profiles/community-posts/`, {
            method: 'POST',
            headers: { Authorization: `Token ${token}` },
            body: form,
          })
        } else {
          res = await apiFetch('/profiles/community-posts/', {
            method: 'POST',
            body: JSON.stringify({ content: content.trim(), category: category || null })
          })
        }
        if (res.ok) {
          const json = await res.json()
          const data = json?.data ?? json
          setStatus('saved')
          setContent('')
          setCategory('')
          setImage(null)
          setVideo(null)
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
    const item = { content: content.trim(), category: category || null, author: 'Me', created_at: new Date().toISOString() }
    posts.unshift(item)
    localStorage.setItem('btf_posts', JSON.stringify(posts))
    setStatus('saved-local')
    setContent('')
    setCategory('')
    setImage(null)
    setVideo(null)
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

      {(focused || content || image || video || error || status === 'sending') && (
        <div className={styles.postFormFooter}>
          {/* Hidden file inputs */}
          <input
            ref={imageRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => setImage(e.target.files[0] || null)}
          />
          <input
            ref={videoRef}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files[0] || null
              if (file && file.size > 100 * 1024 * 1024) {
                setError('Video must be under 100 MB.')
                e.target.value = ''
                return
              }
              setError(null)
              setVideo(file)
            }}
          />

          <div className={styles.postFormAttachRow}>
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

            <button type="button" className={styles.attachBtn} onClick={() => imageRef.current.click()} title="Attach image">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              {image ? <span className={styles.attachName}>{image.name}</span> : 'Photo'}
              {image && <span className={styles.attachClear} onClick={e => { e.stopPropagation(); setImage(null); imageRef.current.value = '' }}>✕</span>}
            </button>

            <button type="button" className={styles.attachBtn} onClick={() => videoRef.current.click()} title="Attach video">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2"/>
              </svg>
              {video ? <span className={styles.attachName}>{video.name}</span> : 'Video'}
              {video && <span className={styles.attachClear} onClick={e => { e.stopPropagation(); setVideo(null); videoRef.current.value = '' }}>✕</span>}
            </button>
          </div>

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
