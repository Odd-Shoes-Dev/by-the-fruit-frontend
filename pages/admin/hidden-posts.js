import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch, getToken, isAdmin } from '../../lib/api'
import { PostCard } from '../../components/PostList'
import AdminLayout from '../../components/AdminLayout'
import styles from '../../styles/PostList.module.css'

export default function HiddenPostsPage() {
  const router = useRouter()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const r = await apiFetch('/profiles/community-posts/hidden/')
      if (!r.ok) throw new Error(r.status)
      const json = await r.json()
      const raw = json?.data ?? json
      const items = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
      setPosts(items)
    } catch {
      setError('Could not load hidden posts.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!getToken() || !isAdmin()) { router.replace('/login'); return }
    load()
  }, [load])

  function handleDelete(id) {
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  function handleHideToggle(id, isHidden) {
    // When unhidden, remove from this list
    if (!isHidden) setPosts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <>
      <Head><title>Hidden Posts — Admin — By The Fruit</title></Head>
      <AdminLayout>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(180,83,9,0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="#b45309" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 700 }}>Hidden Posts</h1>
              <p style={{ margin: '2px 0 0', fontSize: '0.87rem', color: 'rgba(26,18,8,0.45)' }}>
                Posts hidden from the public feed. Restore or permanently delete them here.
              </p>
            </div>
            <Link
              href="/admin"
              style={{ marginLeft: 'auto', fontSize: '0.84rem', color: 'var(--orange)', textDecoration: 'none', fontWeight: 500 }}
            >
              ← Back to admin
            </Link>
          </div>

          {/* Count badge */}
          {!loading && !error && (
            <p style={{ marginBottom: 20, fontSize: '0.88rem', color: 'rgba(26,18,8,0.5)' }}>
              {posts.length === 0
                ? 'No hidden posts.'
                : `${posts.length} hidden post${posts.length !== 1 ? 's' : ''}`}
            </p>
          )}

          {/* Loading */}
          {loading && (
            <div className={styles.emptyState}>
              <div className={styles.loadingDots}><span /><span /><span /></div>
              <p>Loading hidden posts…</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>⚠️</span>
              <p>{error}</p>
              <button
                onClick={load}
                style={{ marginTop: 8, padding: '8px 20px', background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Posts list */}
          {!loading && !error && posts.length > 0 && (
            <div className={styles.feed}>
              <AnimatePresence initial={false}>
                {posts.map((p, i) => (
                  <div key={p.id}>
                    {/* Hidden badge above the card */}
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      marginBottom: 6, marginLeft: 4,
                      background: 'rgba(180,83,9,0.1)', color: '#b45309',
                      border: '1px solid rgba(180,83,9,0.25)',
                      borderRadius: 20, padding: '3px 10px',
                      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
                      userSelect: 'none',
                    }}>
                      <svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                      HIDDEN
                    </div>
                    <PostCard
                      p={{ ...p, is_hidden: true }}
                      i={i}
                      showUnhide={true}
                      onDelete={handleDelete}
                      onHideToggle={handleHideToggle}
                    />
                  </div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && posts.length === 0 && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>👁️</span>
              <p>No hidden posts right now.</p>
            </div>
          )}
        </motion.div>
      </AdminLayout>
    </>
  )
}
