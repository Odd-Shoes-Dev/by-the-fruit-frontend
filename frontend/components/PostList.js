import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch, getToken } from '../lib/api'

export default function PostList({ refreshTrigger }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const token = getToken()

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const url = token ? '/profiles/community-posts/feed/' : '/profiles/community-posts/'
        const res = await apiFetch(url)
        if (res.ok) {
          const data = await res.json()
          if (mounted) setPosts(data)
          return
        }
      } catch (err) {}
      const local = JSON.parse(localStorage.getItem('btf_posts') || '[]')
      if (mounted) setPosts(local)
    } finally {
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [token, refreshTrigger])

  if (loading && posts.length === 0) return <div>Loading feed…</div>
  if (!posts || posts.length === 0) return <div>No posts yet. Be the first to share.</div>

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {posts.map((p) => (
        <article key={p.id || p.created_at} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>
              {p.author_detail ? (
                <Link href={`/profile/${p.author}`}>{p.author_detail.full_name || p.author_detail.email}</Link>
              ) : (
                p.author || 'Anonymous'
              )}
            </strong>
            <small style={{ color: 'var(--muted)' }}>{new Date(p.created_at || Date.now()).toLocaleString()}</small>
          </div>
          {p.category && <span className="meta" style={{ fontSize: 0.85 }}>{p.category}</span>}
          <p style={{ marginTop: 8 }}>{p.content}</p>
          {p.image && <img src={p.image} alt="post" style={{ maxWidth: '100%', borderRadius: 8, marginTop: 8 }} />}
        </article>
      ))}
    </div>
  )
}
