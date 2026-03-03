import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch, getToken } from '../lib/api'
import { PostCard } from '../components/PostList'
import styles from '../styles/PostList.module.css'
import savedStyles from '../styles/SavedPosts.module.css'

export default function SavedPosts() {
  const router = useRouter()
  const [savedPosts, setSavedPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadSaved = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // Use the dedicated saved-posts endpoint so we get ALL of the user's
      // bookmarks (not just the top-50 relevance feed), and is_saved is
      // always authoritative from the DB for this user.
      const r = await apiFetch('/profiles/saved-posts/')
      if (!r.ok) throw new Error(r.status)
      const json = await r.json()
      const raw = json?.data ?? json
      const items = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
      // Each item is a SavedPost record; post_detail holds the full post object.
      const posts = items
        .map(item => item.post_detail)
        .filter(Boolean)
        .map(p => ({ ...p, is_saved: true }))
      setSavedPosts(posts)
    } catch (err) {
      setError('Could not load saved posts.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return }
    loadSaved()
  }, [loadSaved])

  // Re-sync when user tabs back (catches saves done on other pages)
  useEffect(() => {
    window.addEventListener('focus', loadSaved)
    return () => window.removeEventListener('focus', loadSaved)
  }, [loadSaved])

  return (
    <>
      <Head><title>Saved Posts — By The Fruit</title></Head>
      <motion.main className="container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <header className="page-header">
          <h1>
            <svg viewBox="0 0 24 24" width={26} height={26} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10, verticalAlign: 'middle', color: 'var(--orange)' }}>
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            Saved Posts
          </h1>
          <p className="tagline">Posts you&apos;ve bookmarked for later.</p>
        </header>

        {loading && (
          <div className={styles.emptyState}>
            <div className={styles.loadingDots}><span /><span /><span /></div>
            <p>Loading saved posts…</p>
          </div>
        )}

        {!loading && error && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && savedPosts.length === 0 && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🔖</span>
            <p>No saved posts yet.</p>
            <Link href="/community" className={savedStyles.goFeed}>Browse the feed</Link>
          </div>
        )}

        {!loading && savedPosts.length > 0 && (
          <div className={styles.feed} style={{ marginTop: 16 }}>
            <AnimatePresence initial={false}>
              {savedPosts.map((p, i) => (
                <PostCard
                  key={p.id}
                  p={p}
                  i={i}
                  onSaveChange={(id, isSaved) => {
                    // Remove post instantly when user unsaves from this page
                    if (!isSaved) {
                      setSavedPosts(prev => prev.filter(post => post.id !== id))
                    }
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.main>
    </>
  )
}