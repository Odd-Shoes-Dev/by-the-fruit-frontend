import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import Pagination from '../components/Pagination'
import FluffyButton from '../components/FluffyButton'
import { apiFetch, getToken, isAdmin } from '../lib/api'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
function absUrl(url) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_BASE}${url}`
}
function UserAvatar({ src, name, size = 44 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const base = { width: size, height: size, borderRadius: '50%', flexShrink: 0 }
  if (src) return <img src={absUrl(src)} alt={name} style={{ ...base, objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }} />
  return <div style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5A623', color: '#fff', fontWeight: 700, fontSize: size * 0.38 }}>{initials}</div>
}

const PAGE_SIZE = 8
const unwrap = json => { const r = json?.data ?? json; return Array.isArray(r) ? r : Array.isArray(r?.results) ? r.results : [] }

export default function InvestorsList() {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/')
      return
    }
    let mounted = true
    async function load() {
      try {
        const res = await apiFetch('/profiles/investors/')
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
      const name = (i.full_name || '').toLowerCase()
      const bio = (i.bio || '').toLowerCase()
      const type = (i.investment_type || '').toLowerCase()
      return !term || name.includes(term) || bio.includes(term) || type.includes(term)
    })
  }, [items, q])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  useEffect(() => { if (page > totalPages) setPage(1) }, [totalPages, page])

  if (loading) return <div className="container"><div className="spinner">Loading…</div></div>

  return (
    <div className="container">
      <header className="page-header">
        <h1>Investors</h1>
        <p className="tagline">Browse vetted investors in the community.</p>
      </header>
      <div className="filters">
        <input className="search" placeholder="Search by name or bio" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} />
      </div>

      {pageItems.length === 0 ? (
        <div className="empty-state">
          <p className="empty-text">No results.</p>
        </div>
      ) : (
        <ul className="list">
          {pageItems.map(inv => (
            <li key={inv.id} className="list-item">
              <div className="list-item-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <UserAvatar src={inv.photo} name={inv.full_name} size={44} />
                  <div>
                    <Link href={`/profile/${inv.id}`}><strong>{inv.full_name || 'Investor'}</strong></Link>
                    <div className="meta">{inv.email}</div>
                    {inv.investment_type && <div className="meta">Focus: {inv.investment_type} · {inv.check_size_range}</div>}
                    {inv.location && <div className="meta">{inv.location}</div>}
                    {inv.bio && <div className="meta">{inv.bio}{inv.bio.length >= 120 ? '…' : ''}</div>}
                  </div>
                </div>
                <div className="list-item-actions">
                  <FluffyButton href={`/profile/${inv.id}`} label="View" width={80} height={36} strands={700} strandLen={6} fontSize={13} color="#F5A623" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

    </div>
  )
}
