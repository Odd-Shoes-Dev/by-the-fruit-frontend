import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import Pagination from '../../components/Pagination'
import { apiFetch, getToken, isAdmin } from '../../lib/api'

export default function AdminIndex() {
  const router = useRouter()
  const [tab, setTab] = useState('posts')
  const [posts, setPosts] = useState([])
  const [events, setEvents] = useState([])
  const [founders, setFounders] = useState([])
  const [investors, setInvestors] = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [messages, setMessages] = useState([])
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const PAGE_SIZE = 6

  useEffect(() => {
    if (!getToken() || !isAdmin()) {
      router.replace('/')
      return
    }
    let mounted = true
    async function load() {
      try {
        const [postsRes, eventsRes, foundersRes, investorsRes, testimonialsRes, messagesRes] = await Promise.all([
          apiFetch('/profiles/community-posts/'),
          apiFetch('/profiles/events/upcoming/'),
          apiFetch('/profiles/founders/'),
          apiFetch('/profiles/investment-profiles/'),
          apiFetch('/profiles/testimonials/'),
          apiFetch('/profiles/contact-messages/')
        ])
        if (mounted) {
          if (postsRes.ok) setPosts(await postsRes.json())
          if (eventsRes.ok) setEvents(await eventsRes.json())
          if (foundersRes.ok) setFounders(await foundersRes.json())
          if (investorsRes.ok) setInvestors(await investorsRes.json())
          if (testimonialsRes.ok) setTestimonials(await testimonialsRes.json())
          if (messagesRes.ok) setMessages(await messagesRes.json())
        }
      } catch (e) {}
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [router])

  const source = useMemo(() => {
    if (tab === 'posts') return posts
    if (tab === 'events') return events
    if (tab === 'founders') return founders
    if (tab === 'investors') return investors
    if (tab === 'testimonials') return testimonials
    if (tab === 'messages') return messages
    return []
  }, [tab, posts, events, founders, investors, testimonials, messages])

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    if (!term) return source
    return source.filter(item => JSON.stringify(item).toLowerCase().includes(term))
  }, [q, source])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function itemLabel(item) {
    if (tab === 'posts') return item.content?.slice(0, 60) || 'Post'
    if (tab === 'events') return item.title || 'Event'
    if (tab === 'founders') return item.name || item.full_name || item.company || 'Founder'
    if (tab === 'investors') return item.user_detail?.full_name || item.bio?.slice(0, 40) || 'Investor'
    if (tab === 'testimonials') return item.author_name || item.quote?.slice(0, 40) || 'Testimonial'
    if (tab === 'messages') return item.email || item.message?.slice(0, 40) || 'Message'
    return 'Item'
  }

  function profileLink(item) {
    if (tab === 'founders') return `/profile/${item.id}`
    if (tab === 'investors') return `/profile/${item.user || item.user_id}`
    return null
  }

  if (loading) return <div className="container"><p>Loading…</p></div>

  return (
    <div className="container">
      <h2>Admin — Backend Data</h2>
      <p className="meta">Manage testimonials and view contact messages in <a href={`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/admin/`} target="_blank" rel="noreferrer">Django admin</a>.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button onClick={() => { setTab('posts'); setPage(1) }} className="btn">Posts</button>
        <button onClick={() => { setTab('events'); setPage(1) }} className="btn">Events</button>
        <button onClick={() => { setTab('founders'); setPage(1) }} className="btn">Founders</button>
        <button onClick={() => { setTab('investors'); setPage(1) }} className="btn">Investors</button>
        <button onClick={() => { setTab('testimonials'); setPage(1) }} className="btn">Testimonials</button>
        <button onClick={() => { setTab('messages'); setPage(1) }} className="btn">Messages</button>
      </div>

      <div className="admin-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <input className="search" placeholder="Search across items" value={q} onChange={e => setQ(e.target.value)} />
          <div className="meta">{filtered.length} results</div>
        </div>

        {pageItems.length === 0 ? <div>No items</div> : (
          pageItems.map(item => (
            <div key={item.id || item.uuid || JSON.stringify(item)} className="admin-row">
              <div style={{ flex: 1 }}>
                <strong>{itemLabel(item)}</strong>
                <div className="meta">{(item.content || item.description || item.quote || item.message || '').toString().slice(0, 120)}</div>
              </div>
              <div className="admin-controls">
                {profileLink(item) && <Link href={profileLink(item)}><button>View</button></Link>}
              </div>
            </div>
          ))
        )}

        <Pagination page={page} totalPages={totalPages} onChange={p => setPage(p)} />
      </div>
    </div>
  )
}
