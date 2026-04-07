import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import Pagination from '../components/Pagination'
import ConnectionButtons from '../components/ConnectionButtons'
import { apiFetch, getToken } from '../lib/api'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
function absUrl(url) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_BASE}${url}`
}
function UserAvatar({ src, name, size = 44 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const base = { width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'inline-block' }
  if (src) return <img src={absUrl(src)} alt={name} style={{ ...base, objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }} />
  return <div style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5A623', color: '#fff', fontWeight: 700, fontSize: size * 0.38 }}>{initials}</div>
}

const PAGE_SIZE = 6
const unwrap = json => { const r = json?.data ?? json; return Array.isArray(r) ? r : Array.isArray(r?.results) ? r.results : [] }

export default function FoundersList() {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!getToken()) {
      router.replace('/')
      return
    }
    let mounted = true
    async function load() {
      try {
        const res = await apiFetch('/profiles/founders/')
        if (res.ok && mounted) {
          setItems(unwrap(await res.json()))
        } else if (res.status === 403 && mounted) {
          router.replace('/')
        }
      } catch (e) {}
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [router])

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    return items.filter(i => !term || (i.name && i.name.toLowerCase().includes(term)) || (i.company && i.company.toLowerCase().includes(term)))
  }, [items, q])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { if (page > totalPages) setPage(1) }, [totalPages, page])

  if (loading) return <div className="container"><div className="spinner">Loading…</div></div>

  return (
    <div className="container">
      <header className="page-header">
        <h1>Founders</h1>
        <p className="tagline">Browse verified founders in the community.</p>
      </header>
      <div className="filters">
        <input className="search" placeholder="Search by name or company" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} />
      </div>

      {pageItems.length === 0 ? (
        <div className="empty-state">
          <p className="empty-text">No results.</p>
        </div>
      ) : (
        <ul className="list">
          {pageItems.map(f => (
            <li key={f.id} className="list-item" onClick={() => router.push(`/profile/${f.id}`)} style={{ cursor: 'pointer' }}>
              <div className="list-item-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <UserAvatar src={f.photo} name={f.name || f.full_name} size={44} />
                  <div>
                    <strong>{f.name || f.full_name}</strong>
                    <div className="meta">{f.company}</div>
                  </div>
                </div>
                <div className="list-item-actions" onClick={e => e.stopPropagation()}>
                  <ConnectionButtons targetUserId={f.id} viewerRole="investor" iconOnly={isMobile} />
                </div>
              </div>
              {f.family && <div className="meta">Family: {(f.family || []).join(', ')}</div>}
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}
