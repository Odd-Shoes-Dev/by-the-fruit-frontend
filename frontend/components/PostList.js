import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch, getToken } from '../lib/api'
import styles from '../styles/PostList.module.css'

function Avatar({ src, name, size = 44 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={styles.avatar}
        style={{ width: size, height: size }}
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
      />
    )
  }
  return (
    <div className={styles.avatarFallback} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  )
}

const CATEGORY_COLORS = {
  technology: '#3b82f6',
  finance: '#10b981',
  healthcare: '#8b5cf6',
  education: '#f59e0b',
  other: '#6b7280',
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
        <div className={styles.loadingDots}>
          <span /><span /><span />
        </div>
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
        {posts.map((p, i) => {
          const author = p.author_detail
          const name = author?.full_name || author?.email || p.author || 'Anonymous'
          const photo = author?.photo || null
          const authorId = author?.id || p.author
          const catColor = CATEGORY_COLORS[p.category] || CATEGORY_COLORS.other

          return (
            <motion.article
              key={p.id || p.created_at || i}
              className={styles.postCard}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, delay: i < 5 ? i * 0.05 : 0 }}
            >
              {/* Header row */}
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
                <img src={p.image} alt="post attachment" className={styles.postImage} />
              )}
            </motion.article>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
