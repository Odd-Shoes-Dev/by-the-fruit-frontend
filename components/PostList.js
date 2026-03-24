import { useEffect, useState, useRef, Component } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch, getToken, getUserId, isAdmin } from '../lib/api'
import styles from '../styles/PostList.module.css'

// VideoPlayer uses IntersectionObserver, videoRef.muted, and a module-level
// singleton — all browser-only APIs that crash during Next.js SSR.
// ssr: false skips server rendering entirely, so no SSR crash, no hydration
// mismatch, and no silently-dropped post cards for video posts.
const VideoPlayer = dynamic(() => import('./VideoPlayer'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%', borderRadius: 12, marginTop: 14,
      background: '#0a0f0c', height: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ color: '#aaa', fontSize: 13 }}>Loading video…</span>
    </div>
  ),
})

// ── VideoPlayer error boundary ─────────────────────────────────────
// VideoPlayer uses IntersectionObserver, refs, and multiple effects.
// If it throws (e.g. during hydration or on a specific codec/format),
// React would silently drop the entire PostCard without this guard.
class VideoErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: false }
  }
  static getDerivedStateFromError() {
    return { error: true }
  }
  render() {
    if (this.state.error) {
      // Fallback: native <video> — always works regardless of JS errors
      return (
        <video
          src={this.props.src}
          controls
          playsInline
          preload="metadata"
          style={{ width: '100%', borderRadius: 12, marginTop: 14, background: '#000', display: 'block' }}
        />
      )
    }
    return this.props.children
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'

function absUrl(url) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_BASE}${url}`
}

function Avatar({ src, name, size = 44 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (src) {
    return (
      <img src={src} alt={name} width={size} height={size} className={styles.avatar}
        style={{ width: size, height: size }}
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
    )
  }
  return (
    <div className={styles.avatarFallback} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  )
}

const CATEGORY_COLORS = {
  technology: '#3b82f6', finance: '#10b981', healthcare: '#8b5cf6',
  education: '#f59e0b', other: '#6b7280',
}

function formatDate(str) {
  if (!str) return ''
  const d = new Date(str)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Comment section ────────────────────────────────────────────────
export function CommentSection({ postId, onCommentAdded }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const inputRef = useRef()

  useEffect(() => {
    let mounted = true
    apiFetch(`/profiles/community-posts/${postId}/comments/`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { if (mounted) setComments(Array.isArray(d) ? d : d?.results ?? []) })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [postId])

  async function submit(e) {
    e.preventDefault()
    if (!text.trim() || posting) return
    setPosting(true)
    const res = await apiFetch(`/profiles/community-posts/${postId}/comments/`, {
      method: 'POST',
      body: JSON.stringify({ content: text.trim() }),
    })
    if (res.ok) {
      const data = await res.json()
      setComments(prev => [...prev, data])
      setText('')
      onCommentAdded?.()
    }
    setPosting(false)
  }

  return (
    <div className={styles.commentSection}>
      {loading ? (
        <p className={styles.commentLoading}>Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className={styles.commentEmpty}>No comments yet. Be the first!</p>
      ) : (
        <div className={styles.commentList}>
          {comments.map(c => {
            const author = c.author_detail
            const name = author?.full_name || author?.email || 'Anonymous'
            const photo = absUrl(author?.photo)
            const authorId = author?.id
            return (
              <div key={c.id} className={styles.commentItem}>
                <Link href={authorId ? `/profile/${authorId}` : '#'}>
                  <Avatar src={photo} name={name} size={30} />
                </Link>
                <div className={styles.commentBubble}>
                  <Link href={authorId ? `/profile/${authorId}` : '#'} className={styles.commentAuthor}>{name}</Link>
                  <span className={styles.commentContent}>{c.content}</span>
                  <span className={styles.commentTime}>{formatDate(c.created_at)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {getToken() && (
        <form onSubmit={submit} className={styles.commentForm}>
          <input
            ref={inputRef}
            className={styles.commentInput}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write a comment…"
            disabled={posting}
            maxLength={1000}
          />
          <button className={styles.commentSubmit} disabled={!text.trim() || posting} type="submit">
            {posting ? '…' : (
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </form>
      )}
    </div>
  )
}

// ── Single post card ───────────────────────────────────────────────
export function PostCard({ p, i, onSaveChange, onDelete, onEdit, onHideToggle, showUnhide = false }) {
  const [liked, setLiked] = useState(!!p.is_liked)
  const [likesCount, setLikesCount] = useState(p.likes_count ?? 0)
  const [saved, setSaved] = useState(!!p.is_saved)
  const [showComments, setShowComments] = useState(false)
  const [commentsCount, setCommentsCount] = useState(p.comments_count ?? 0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(p.content)
  const [editCategory, setEditCategory] = useState(p.category || '')
  // null = no change, false = remove, File = replace
  const [editImage, setEditImage] = useState(null)
  const [editVideo, setEditVideo] = useState(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [hiding, setHiding] = useState(false)
  const isSaving = useRef(false)
  const isLiking = useRef(false)
  const menuRef = useRef()
  const editImageRef = useRef()
  const editVideoRef = useRef()
  const token = getToken()

  const author = p.author_detail
  const name = author?.full_name || author?.email || p.author || 'Anonymous'
  const photo = absUrl(author?.photo)
  const authorId = author?.id || p.author
  const catColor = CATEGORY_COLORS[p.category] || CATEGORY_COLORS.other
  const isAuthor = token && String(getUserId()) === String(authorId)
  const adminUser = isAdmin()
  const canManage = token && (isAuthor || adminUser)

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handle(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [menuOpen])

  function openEdit() {
    setEditContent(p.content)
    setEditCategory(p.category || '')
    setEditImage(null)
    setEditVideo(null)
    setEditError(null)
    setEditing(true)
    setMenuOpen(false)
  }

  function cancelEdit() {
    setEditing(false)
    setEditContent(p.content)
    setEditCategory(p.category || '')
    setEditImage(null)
    setEditVideo(null)
    setEditError(null)
    if (editImageRef.current) editImageRef.current.value = ''
    if (editVideoRef.current) editVideoRef.current.value = ''
  }

  async function handleEditSave() {
    if (!editContent.trim() || editSaving) return
    setEditSaving(true)
    setEditError(null)
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
    const hasMediaChange = editImage !== null || editVideo !== null
    try {
      let res
      if (hasMediaChange) {
        // Multipart PATCH — required when uploading or clearing files
        const form = new FormData()
        form.append('content', editContent.trim())
        form.append('category', editCategory || '')
        if (editImage === false) {
          // Send empty string to clear the field
          form.append('image', '')
        } else if (editImage instanceof File) {
          form.append('image', editImage)
        }
        if (editVideo === false) {
          form.append('video', '')
        } else if (editVideo instanceof File) {
          form.append('video', editVideo)
        }
        res = await fetch(`${API_BASE}/profiles/community-posts/${p.id}/`, {
          method: 'PATCH',
          headers: { Authorization: `Token ${token}` },
          body: form,
        })
      } else {
        res = await apiFetch(`/profiles/community-posts/${p.id}/`, {
          method: 'PATCH',
          body: JSON.stringify({ content: editContent.trim(), category: editCategory || null }),
        })
      }
      if (res.ok) {
        const data = await res.json()
        onEdit?.(data)
        setEditing(false)
        if (editImageRef.current) editImageRef.current.value = ''
        if (editVideoRef.current) editVideoRef.current.value = ''
      } else {
        const err = await res.json().catch(() => ({}))
        setEditError(err?.detail || err?.content?.[0] || err?.image?.[0] || err?.video?.[0] || 'Save failed. Please try again.')
      }
    } catch {
      setEditError('Network error. Please try again.')
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await apiFetch(`/profiles/community-posts/${p.id}/`, { method: 'DELETE' })
      if (res.ok || res.status === 204) {
        onDelete?.(p.id)
      } else {
        setConfirmDelete(false)
        setDeleting(false)
      }
    } catch {
      setConfirmDelete(false)
      setDeleting(false)
    }
  }

  async function handleHideToggle(action) {
    setHiding(true)
    setMenuOpen(false)
    try {
      const res = await apiFetch(`/profiles/community-posts/${p.id}/hide/`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        const data = await res.json()
        onHideToggle?.(p.id, data.is_hidden)
      }
    } catch {}
    finally { setHiding(false) }
  }

  async function toggleLike() {
    if (!token || isLiking.current) return
    isLiking.current = true
    // Optimistic update
    const willLike = !liked
    setLiked(willLike)
    setLikesCount(c => willLike ? c + 1 : Math.max(0, c - 1))
    try {
      const res = await apiFetch(`/profiles/community-posts/${p.id}/like/`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setLiked(data.liked)
        setLikesCount(data.likes_count)
      } else {
        // Revert on error
        setLiked(!willLike)
        setLikesCount(c => willLike ? Math.max(0, c - 1) : c + 1)
      }
    } catch {
      setLiked(!willLike)
      setLikesCount(c => willLike ? Math.max(0, c - 1) : c + 1)
    } finally {
      isLiking.current = false
    }
  }

  async function toggleSave() {
    if (!token || isSaving.current) return
    isSaving.current = true
    const willSave = !saved
    setSaved(willSave)  // optimistic
    try {
      const res = await apiFetch(`/profiles/community-posts/${p.id}/save/`, {
        method: 'POST',
        body: JSON.stringify({ action: willSave ? 'save' : 'unsave' }),
      })
      if (res.ok) {
        const data = await res.json()
        setSaved(data.saved)
        onSaveChange?.(p.id, data.saved)
      } else {
        setSaved(!willSave)  // revert on error
      }
    } catch {
      setSaved(!willSave)  // revert on network error
    } finally {
      isSaving.current = false
    }
  }

  function handleCommentToggle() {
    setShowComments(v => !v)
  }

  return (
    <motion.article
      className={styles.postCard}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, delay: i < 5 ? i * 0.05 : 0 }}
    >
      {/* Header */}
      <div className={styles.postHeader}>
        <Link href={authorId ? `/profile/${authorId}` : '#'} className={styles.authorLink}>
          <Avatar src={photo} name={name} size={44} />
          <div className={styles.authorInfo}>
            <span className={styles.authorName}>{name}</span>
            <span className={styles.postTime}>{formatDate(p.created_at)}</span>
          </div>
        </Link>
        <div className={styles.postHeaderRight}>
          {p.category && (
            <span className={styles.categoryBadge} style={{ background: catColor + '18', color: catColor, borderColor: catColor + '30' }}>
              {p.category}
            </span>
          )}
          {canManage && (
            <div className={styles.postMenu} ref={menuRef}>
              <button
                className={styles.postMenuBtn}
                onClick={() => { setMenuOpen(v => !v); setConfirmDelete(false) }}
                title="Post options"
                aria-label="Post options"
              >
                &#8942;
              </button>
              {menuOpen && (
                <div className={styles.postMenuDropdown}>
                  {isAuthor && (
                    <button className={styles.postMenuOption} onClick={openEdit}>
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>
                  )}
                  {adminUser && (
                    <button
                      className={`${styles.postMenuOption} ${styles.postMenuOptionHide}`}
                      onClick={() => handleHideToggle(showUnhide || p.is_hidden ? 'unhide' : 'hide')}
                      disabled={hiding}
                    >
                      {hiding ? (
                        <span style={{ fontSize: '0.78rem' }}>…</span>
                      ) : (showUnhide || p.is_hidden) ? (
                        <>
                          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          Restore post
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                          Hide post
                        </>
                      )}
                    </button>
                  )}
                  <button className={`${styles.postMenuOption} ${styles.postMenuOptionDelete}`} onClick={() => { setConfirmDelete(true); setMenuOpen(false) }}>
                    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content — inline edit form or regular display */}
      {editing ? (
        <div className={styles.editBlock}>
          <textarea
            className={styles.editTextarea}
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            rows={4}
            maxLength={5000}
            autoFocus
          />
          <select
            className={styles.editCategorySelect}
            value={editCategory}
            onChange={e => setEditCategory(e.target.value)}
          >
            <option value="">No category</option>
            <option value="technology">Technology</option>
            <option value="finance">Finance</option>
            <option value="healthcare">Healthcare</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>

          {/* Hidden file inputs */}
          <input ref={editImageRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { setEditImage(e.target.files[0] || null) }} />
          <input ref={editVideoRef} type="file" accept="video/*" style={{ display: 'none' }}
            onChange={e => {
              const f = e.target.files[0] || null
              if (f && f.size > 100 * 1024 * 1024) { setEditError('Video must be under 100 MB.'); e.target.value = ''; return }
              setEditError(null)
              setEditVideo(f)
            }} />

          {/* Image row */}
          <div className={styles.editMediaRow}>
            <span className={styles.editMediaLabel}>Image:</span>
            {editImage === false ? (
              <span className={styles.editMediaRemoved}>Will be removed</span>
            ) : editImage instanceof File ? (
              <span className={styles.editMediaName}>{editImage.name}</span>
            ) : p.image ? (
              <img src={absUrl(p.image)} alt="current" className={styles.editMediaThumb} />
            ) : (
              <span className={styles.editMediaNone}>None</span>
            )}
            <button type="button" className={styles.editMediaBtn}
              onClick={() => { setEditImage(null); if (editImageRef.current) editImageRef.current.value = ''; editImageRef.current?.click() }}>
              Replace
            </button>
            {(p.image || editImage instanceof File) && editImage !== false && (
              <button type="button" className={`${styles.editMediaBtn} ${styles.editMediaBtnRemove}`}
                onClick={() => { setEditImage(false); if (editImageRef.current) editImageRef.current.value = '' }}>
                Remove
              </button>
            )}
            {editImage !== null && (
              <button type="button" className={styles.editMediaBtn}
                onClick={() => { setEditImage(null); if (editImageRef.current) editImageRef.current.value = '' }}>
                Reset
              </button>
            )}
          </div>

          {/* Video row */}
          <div className={styles.editMediaRow}>
            <span className={styles.editMediaLabel}>Video:</span>
            {editVideo === false ? (
              <span className={styles.editMediaRemoved}>Will be removed</span>
            ) : editVideo instanceof File ? (
              <span className={styles.editMediaName}>{editVideo.name}</span>
            ) : p.video ? (
              <span className={styles.editMediaName}>Current video</span>
            ) : (
              <span className={styles.editMediaNone}>None</span>
            )}
            <button type="button" className={styles.editMediaBtn}
              onClick={() => { setEditVideo(null); if (editVideoRef.current) editVideoRef.current.value = ''; editVideoRef.current?.click() }}>
              Replace
            </button>
            {(p.video || editVideo instanceof File) && editVideo !== false && (
              <button type="button" className={`${styles.editMediaBtn} ${styles.editMediaBtnRemove}`}
                onClick={() => { setEditVideo(false); if (editVideoRef.current) editVideoRef.current.value = '' }}>
                Remove
              </button>
            )}
            {editVideo !== null && (
              <button type="button" className={styles.editMediaBtn}
                onClick={() => { setEditVideo(null); if (editVideoRef.current) editVideoRef.current.value = '' }}>
                Reset
              </button>
            )}
          </div>

          {editError && <p className={styles.editError}>{editError}</p>}
          <div className={styles.editActions}>
            <button className={styles.editSaveBtn} onClick={handleEditSave} disabled={editSaving || !editContent.trim()}>
              {editSaving ? 'Saving…' : 'Save'}
            </button>
            <button className={styles.editCancelBtn} onClick={cancelEdit} disabled={editSaving}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className={styles.postContent}>{p.content}</p>
      )}

      {/* Confirm delete strip */}
      {confirmDelete && (
        <div className={styles.deleteConfirm}>
          <span className={styles.deleteConfirmText}>Delete this post?</span>
          <button className={styles.deleteConfirmYes} onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Yes, delete'}
          </button>
          <button className={styles.deleteConfirmCancel} onClick={() => setConfirmDelete(false)} disabled={deleting}>
            Cancel
          </button>
        </div>
      )}

      {/* Image */}
      {p.image && (
        <img src={absUrl(p.image)} alt="post attachment" className={styles.postImage} />
      )}

      {/* Video */}
      {p.video && (
        <VideoErrorBoundary src={absUrl(p.video)}>
          <VideoPlayer src={absUrl(p.video)} poster={p.image ? absUrl(p.image) : undefined} />
        </VideoErrorBoundary>
      )}

      {/* ── Engagement bar ── */}
      <div className={styles.engagementBar}>
        {/* Like */}
        <button
          className={`${styles.engageBtn} ${liked ? styles.engageBtnActive : ''}`}
          onClick={toggleLike}
          title={liked ? 'Unlike' : 'Like'}
          disabled={!token}
        >
          <svg viewBox="0 0 24 24" width={18} height={18} fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>{likesCount > 0 ? likesCount : ''}</span>
        </button>

        {/* Comment */}
        <button
          className={`${styles.engageBtn} ${showComments ? styles.engageBtnActive : ''}`}
          onClick={handleCommentToggle}
          title="Comments"
        >
          <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{commentsCount > 0 ? commentsCount : ''}</span>
        </button>

        {/* Save */}
        <button
          className={`${styles.engageBtn} ${styles.engageBtnSave} ${saved ? styles.engageBtnSaved : ''}`}
          onClick={toggleSave}
          title={saved ? 'Unsave post' : 'Save post'}
          disabled={!token}
        >
          <svg viewBox="0 0 24 24" width={18} height={18} fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <span>{saved ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      {/* ── Comment section (collapsible) ── */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <CommentSection
              postId={p.id}
              onCommentAdded={() => setCommentsCount(c => c + 1)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

// ── PostList ───────────────────────────────────────────────────────
export default function PostList({ refreshTrigger }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const token = getToken()
        const url = token ? '/profiles/community-posts/feed/' : '/profiles/community-posts/'
        const res = await apiFetch(url)
        if (res.ok) {
          const json = await res.json()
          const raw = json?.data ?? json
          const items = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
          if (mounted) setPosts(items)
          return
        }
      } catch (err) {}
      try {
        const local = JSON.parse(localStorage.getItem('btf_posts') || '[]')
        if (mounted) setPosts(local)
      } catch {}
    }
    load().finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [refreshTrigger])

  if (loading && posts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.loadingDots}><span /><span /><span /></div>
        <p>Loading feed…</p>
      </div>
    )
  }

  if (!posts || posts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>💬</span>
        <p>No posts yet. Be the first to share.</p>
      </div>
    )
  }

  function handleDelete(id) {
    setPosts(prev => prev.filter(post => post.id !== id))
  }

  function handleEdit(updatedPost) {
    setPosts(prev => prev.map(post => post.id === updatedPost.id ? updatedPost : post))
  }

  function handleHideToggle(id, isHidden) {
    // When a post is hidden on the regular feed, remove it from view
    if (isHidden) setPosts(prev => prev.filter(post => post.id !== id))
    else setPosts(prev => prev.map(post => post.id === id ? { ...post, is_hidden: false } : post))
  }

  return (
    <div className={styles.feed}>
      <AnimatePresence initial={false}>
        {posts.map((p, i) => (
          <PostCard
            key={p.id || p.created_at || i}
            p={p}
            i={i}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onHideToggle={handleHideToggle}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
