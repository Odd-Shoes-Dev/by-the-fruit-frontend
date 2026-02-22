import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import Pagination from '../components/Pagination'
import { apiFetch, getToken, isAdmin } from '../lib/api'

const PAGE_SIZE = 8

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
    return items.filter(i => {
      const name = i.full_name || i.user_detail?.full_name || ''
      const bio = (i.bio || '').toLowerCase()
      return !term || name.toLowerCase().includes(term) || bio.includes(term)
    })
  }, [items, q])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  useEffect(() => { if (page > totalPages) setPage(1) }, [totalPages])

  if (loading) return <div className="container"><p>Loading…</p></div>

  return (
    <div className="container">
      <h2>Investors</h2>
      <div className="filters">
        <input className="search" placeholder="Search by name or bio" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {pageItems.length === 0 ? <div>No results</div> : (
        <ul className="list">
          {pageItems.map(ip => {
            const userId = ip.user || ip.user_id
            const name = ip.user_detail?.full_name || ip.full_name || 'Investor'
            return (
              <li key={ip.id} className="list-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Link href={userId ? `/profile/${userId}` : '#'}><strong>{name}</strong></Link>
                    <div className="meta">{(ip.bio || '').slice(0, 80)}{(ip.bio || '').length > 80 ? '…' : ''}</div>
                  </div>
                  <div>
                    {userId && <Link href={`/profile/${userId}`}><button className="btn">View</button></Link>}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <p style={{ marginTop: 18 }}><Link href="/">Back</Link></p>
    </div>
  )
}
