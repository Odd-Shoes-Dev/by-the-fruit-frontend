import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import Pagination from '../components/Pagination'
import { apiFetch, getToken, isAdmin } from '../lib/api'

const PAGE_SIZE = 8
const unwrap = json => { const r = json?.data ?? json; return Array.isArray(r) ? r : Array.isArray(r?.results) ? r.results : [] }

export default function InvestorsList() {
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
        const res = await apiFetch('/profiles/investment-profiles/')
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
    return items.filter(i => {
      const name = i.full_name || i.user_detail?.full_name || ''
      const bio = (i.bio || '').toLowerCase()
      return !term || name.toLowerCase().includes(term) || bio.includes(term)
    })
  }, [items, q])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  useEffect(() => { if (page > totalPages) setPage(1) }, [totalPages, page])

  if (loading) return <div className="container"><p>Loading…</p></div>

  return (
    <div className="container">
      <header><h1>Investors</h1></header>
      <div className="filters">
        <input className="search" placeholder="Search by name or bio" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} />
      </div>

      {pageItems.length === 0 ? <div>No results</div> : (
        <ul className="list">
          {pageItems.map(ip => {
            const userId = ip.user || ip.user_id
            const name = ip.user_detail?.full_name || ip.full_name || 'Investor'
            return (
              <li key={ip.id} className="list-item">
                <div className="list-item-row">
                  <div>
                    <Link href={userId ? `/profile/${userId}` : '#'}><strong>{name}</strong></Link>
                    <div className="meta">{(ip.bio || '').slice(0, 80)}{(ip.bio || '').length > 80 ? '…' : ''}</div>
                  </div>
                  <div className="list-item-actions">
                    {userId && <Link href={`/profile/${userId}`}><button className="btn">View</button></Link>}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

    </div>
  )
}
