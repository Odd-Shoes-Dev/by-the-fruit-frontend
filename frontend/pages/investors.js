import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import Pagination from '../components/Pagination'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''
const PAGE_SIZE = 8

export default function InvestorsList() {
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/profiles/investment-profiles/`)
        if (res.ok) {
          const data = await res.json()
          setItems(data)
          return
        }
      } catch (e) {}

      const local = JSON.parse(localStorage.getItem('btf_investors') || '[]')
      setItems(local)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    return items.filter(i => !term || (i.name && i.name.toLowerCase().includes(term)) || (i.gifts && i.gifts.toLowerCase().includes(term)))
  }, [items, q])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  useEffect(() => { if (page > totalPages) setPage(1) }, [totalPages])

  return (
    <div className="container">
      <h2>Investors</h2>
      <div className="filters">
        <input className="search" placeholder="Search by name or gifts" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {pageItems.length === 0 ? <div>No results</div> : (
        <ul className="list">
          {pageItems.map(f => (
            <li key={f.id} className="list-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Link href={`/profile/${f.id}`}><strong>{f.name}</strong></Link>
                  <div className="meta">{f.gifts}</div>
                </div>
                <div>
                  <Link href={`/profile/${f.id}`}><button className="btn">View</button></Link>
                </div>
              </div>
              <div className="meta">Family: {(f.family || []).join(', ')}</div>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <p style={{ marginTop: 18 }}><Link href="/">Back</Link></p>
    </div>
  )
}
