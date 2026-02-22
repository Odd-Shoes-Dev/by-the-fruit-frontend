import React from 'react'

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  const prev = () => onChange(Math.max(1, page - 1))
  const next = () => onChange(Math.min(totalPages, page + 1))
  return (
    <div className="pager">
      <button onClick={() => onChange(1)}>First</button>
      <button onClick={prev}>Prev</button>
      <span>Page {page} / {totalPages}</span>
      <button onClick={next}>Next</button>
      <button onClick={() => onChange(totalPages)}>Last</button>
    </div>
  )
}
