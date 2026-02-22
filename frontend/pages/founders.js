import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import Pagination from '../components/Pagination'
import ConnectionButtons from '../components/ConnectionButtons'
import { apiFetch, getToken, isAdmin } from '../lib/api'

const PAGE_SIZE = 6

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
          const data = await res.json()
          setItems(data)
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

  useEffect(() => { if (page > totalPages) setPage(1) }, [totalPages])

  if (loading) return <div className="container"><p>Loading…</p></div>

  return (
    <div className="container">
      <h2>Founders</h2>
      <div className="filters">
        <input className="search" placeholder="Search by name or company" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {pageItems.length === 0 ? <div>No results</div> : (
        <ul className="list">
          {pageItems.map(f => (
            <li key={f.id} className="list-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Link href={`/profile/${f.id}`}><strong>{f.name || f.full_name}</strong></Link>
                  <div className="meta">{f.company}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <ConnectionButtons targetUserId={f.id} viewerRole="investor" />
                  <Link href={`/profile/${f.id}`}><button className="btn">View</button></Link>
                </div>
              </div>
              {f.family && <div className="meta">Family: {(f.family || []).join(', ')}</div>}
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <p style={{ marginTop: 18 }}><Link href="/">Back</Link></p>
    </div>
  )
}
