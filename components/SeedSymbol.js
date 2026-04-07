/**
 * SeedSymbol — the custom seed icon used everywhere in the Orchard system.
 * A small organic seed shape used instead of any currency symbol.
 */
export function SeedSymbol({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="seed"
    >
      {/* Seed shape: teardrop / organic oval rotated */}
      <ellipse cx="10" cy="12" rx="5.5" ry="7" fill="#4caf50" transform="rotate(-20 10 12)" />
      <ellipse cx="10" cy="12" rx="1.5" ry="4.5" fill="#a5d6a7" opacity="0.7" transform="rotate(-20 10 12)" />
      {/* Sprout */}
      <path d="M10 6 Q12 3 15 2" stroke="#81c784" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

/**
 * Formats a seed count: 1000 → "1,000 ✿" using the seed symbol.
 */
export function SeedCount({ amount, size = 14, className = '' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} className={className}>
      <SeedSymbol size={size} />
      <span>{(amount || 0).toLocaleString()}</span>
    </span>
  )
}
