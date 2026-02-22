import { useState } from 'react'
import { apiFetch, getToken } from '../lib/api'

export default function PostForm({ onCreate }) {
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState(null)
  const token = getToken()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim()) return
    setStatus('sending')
    const payload = { content: content.trim(), category: category || null }

    if (token) {
      try {
        const res = await apiFetch('/profiles/community-posts/', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          const data = await res.json()
          setStatus('saved')
          onCreate && onCreate(data)
          setContent('')
          setCategory('')
          return
        }
      } catch (err) {}
    }

    const posts = JSON.parse(localStorage.getItem('btf_posts') || '[]')
    const item = { ...payload, author: 'Me', created_at: new Date().toISOString() }
    posts.unshift(item)
    localStorage.setItem('btf_posts', JSON.stringify(posts))
    setStatus('saved-local')
    onCreate && onCreate(item)
    setContent('')
    setCategory('')
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <label>Share an update, deal, or event
        <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} placeholder="What's on your mind?" required />
      </label>
      <label>Category (optional)
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">—</option>
          <option value="technology">Technology</option>
          <option value="finance">Finance</option>
          <option value="healthcare">Healthcare</option>
          <option value="education">Education</option>
          <option value="other">Other</option>
        </select>
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="btn" disabled={!content.trim()}>Post</button>
        <span style={{ alignSelf: 'center', color: 'var(--muted)' }}>{status === 'sending' ? 'Sending...' : status === 'saved' ? 'Posted' : ''}</span>
      </div>
    </form>
  )
}
