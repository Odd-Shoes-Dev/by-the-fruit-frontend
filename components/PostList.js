import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch, getToken, getUserId } from '../lib/api'
import VideoPlayer from './VideoPlayer'
import styles from '../styles/PostList.module.css'

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
export function PostCard({ p, i, onSaveChange }) {
  const [liked, setLiked] = useState(!!p.is_liked)
  const [likesCount, setLikesCount] = useState(p.likes_count ?? 0)
  const [saved, setSaved] = useState(!!p.is_saved)
  const [showComments, setShowComments] = useState(false)
  const [commentsCount, setCommentsCount] = useState(p.comments_count ?? 0)
  const isSaving = useRef(false)
  const isLiking = useRef(false)
  const token = getToken()

  const author = p.author_detail
  const name = author?.full_name || author?.email || p.author || 'Anonymous'
  const photo = absUrl(author?.photo)
  const authorId = author?.id || p.author
  const catColor = CATEGORY_COLORS[p.category] || CATEGORY_COLORS.other

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
        {p.category && (
          <span className={styles.categoryBadge} style={{ background: catColor + '18', color: catColor, borderColor: catColor + '30' }}>
            {p.category}
          </span>
        )}
      </div>

      {/* Content */}
      <p className={styles.postContent}>{p.content}</p>

      {/* Image */}
      {p.image && (
        <img src={absUrl(p.image)} alt="post attachment" className={styles.postImage} />
      )}

      {/* Video */}
      {p.video && (
        <VideoPlayer src={absUrl(p.video)} poster={p.image ? absUrl(p.image) : undefined} />
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

  return (
    <div className={styles.feed}>
      <AnimatePresence initial={false}>
        {posts.map((p, i) => (
          <PostCard key={p.id || p.created_at || i} p={p} i={i} />
        ))}
      </AnimatePresence>
    </div>
  )
}
