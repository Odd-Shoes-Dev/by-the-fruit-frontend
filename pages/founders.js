import { useRouter } from 'next/router'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import Pagination from '../components/Pagination'
import ConnectionButtons from '../components/ConnectionButtons'
import { apiFetch, getToken, isAdmin } from '../lib/api'

const PAGE_SIZE = 6
const unwrap = json => { const r = json?.data ?? json; return Array.isArray(r) ? r : Array.isArray(r?.results) ? r.results : [] }

export default function FoundersList() {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken() || !isAdmin()) {
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
            <li key={f.id} className="list-item">
              <div className="list-item-row">
                <div>
                  <Link href={`/profile/${f.id}`}><strong>{f.name || f.full_name}</strong></Link>
                  <div className="meta">{f.company}</div>
                </div>
                <div className="list-item-actions">
                  <ConnectionButtons targetUserId={f.id} viewerRole="investor" />
                  <Link href={`/profile/${f.id}`} className="btn btn-sm">View</Link>
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
