import { useEffect, useMemo, useState } from 'react'
import Pagination from '../../components/Pagination'

export default function AdminIndex() {
  const [tab, setTab] = useState('posts')
  const [posts, setPosts] = useState([])
  const [events, setEvents] = useState([])
  const [founders, setFounders] = useState([])
  const [investors, setInvestors] = useState([])
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 6

  useEffect(() => {
    setPosts(JSON.parse(localStorage.getItem('btf_posts') || '[]'))
    setEvents(JSON.parse(localStorage.getItem('btf_events') || '[]'))
    setFounders(JSON.parse(localStorage.getItem('btf_founders') || '[]'))
    setInvestors(JSON.parse(localStorage.getItem('btf_investors') || '[]'))
  }, [])

  function saveKey(key, arr, setFn) {
    localStorage.setItem(key, JSON.stringify(arr))
    setFn(arr)
  }

  function removeItem(key, id) {
    if (key === 'posts') saveKey('btf_posts', posts.filter(p => p.id !== id), setPosts)
    if (key === 'events') saveKey('btf_events', events.filter(e => e.id !== id), setEvents)
    if (key === 'founders') saveKey('btf_founders', founders.filter(f => f.id !== id), setFounders)
    if (key === 'investors') saveKey('btf_investors', investors.filter(i => i.id !== id), setInvestors)
  }

  const source = useMemo(() => {
    if (tab === 'posts') return posts
    if (tab === 'events') return events
    if (tab === 'founders') return founders
    return investors
  }, [tab, posts, events, founders, investors])

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    if (!term) return source
    return source.filter(item => JSON.stringify(item).toLowerCase().includes(term))
  }, [q, source])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="container">
      <h2>Admin — Local Moderation</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => { setTab('posts'); setPage(1) }} className="btn">Posts</button>
        <button onClick={() => { setTab('events'); setPage(1) }} className="btn">Events</button>
        <button onClick={() => { setTab('founders'); setPage(1) }} className="btn">Founders</button>
        <button onClick={() => { setTab('investors'); setPage(1) }} className="btn">Investors</button>
      </div>

      <div className="admin-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <input className="search" placeholder="Search across items" value={q} onChange={e => setQ(e.target.value)} />
          <div className="meta">{filtered.length} results</div>
        </div>

        {pageItems.length === 0 ? <div>No items</div> : (
          pageItems.map(item => (
            <div key={item.id} className="admin-row">
              <div style={{ flex: 1 }}>
                <strong>{item.title || item.name || item.company || 'Item'}</strong>
                <div className="meta">{(item.content || item.description || '').toString().slice(0, 120)}</div>
                <div className="meta">Family: {(item.family || []).join(', ')}</div>
              </div>
              <div className="admin-controls">
                <button onClick={() => removeItem(tab, item.id)}>Remove</button>
                <a href={`/profile/${item.id}`}><button>Open</button></a>
              </div>
            </div>
          ))
        )}

        <Pagination page={page} totalPages={totalPages} onChange={p => setPage(p)} />
      </div>
    </div>
  )
}
