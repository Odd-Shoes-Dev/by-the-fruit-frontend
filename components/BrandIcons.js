/**
 * BrandIcons.js
 * Custom SVG icon set for By the Fruit.
 * All icons use brand orange (#E8601A) on a dark bg token that callers
 * can wrap however they like.  Each component accepts an optional `size`
 * prop (default 44).
 */

const C = '#F5A623'   // brand orange
const S = 1.6         // default stroke-width

/* ── helpers ── */
const base = (size, children, viewBox = '0 0 44 44') => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox={viewBox}
    fill="none"
    aria-hidden="true"
  >
    {children}
  </svg>
)

/* ════════════════════════════════════════
   STEP ICONS  (used in .stepIco)
═════════════════════════════════════════ */

/** Sprout / seedling — Share Your Story */
export function IconSprout({ size = 44 }) {
  return base(size, <>
    {/* stem */}
    <line x1="22" y1="36" x2="22" y2="18" stroke={C} strokeWidth={S} strokeLinecap="round"/>
    {/* left leaf */}
    <path
      d="M22 24 C18 20 12 20 11 25 C14 26 18 26 22 24Z"
      fill={C} opacity="0.85"
    />
    {/* right leaf */}
    <path
      d="M22 20 C26 16 32 16 33 21 C30 22 26 22 22 20Z"
      fill={C} opacity="0.85"
    />
    {/* soil dots */}
    <circle cx="16" cy="37" r="1.2" fill={C} opacity="0.35"/>
    <circle cx="22" cy="38.5" r="1.2" fill={C} opacity="0.35"/>
    <circle cx="28" cy="37" r="1.2" fill={C} opacity="0.35"/>
  </>)
}

/** Orchard tree — The Orchard Matches */
export function IconTree({ size = 44 }) {
  return base(size, <>
    {/* trunk */}
    <rect x="19.5" y="28" width="5" height="8" rx="2" fill={C} opacity="0.75"/>
    {/* canopy layers */}
    <polygon points="22,8 33,26 11,26" fill={C} opacity="0.55"/>
    <polygon points="22,13 31,28 13,28" fill={C} opacity="0.75"/>
    {/* two fruits */}
    <circle cx="18" cy="20" r="2" fill={C}/>
    <circle cx="26" cy="18" r="2" fill={C}/>
  </>)
}

/** Apple — Come to the Table */
export function IconApple({ size = 44 }) {
  return base(size, <>
    {/* leaf & stem */}
    <path d="M22 10 C22 10 22 7 25 6 C25 9 23 10 22 10Z" fill={C}/>
    <line x1="22" y1="10" x2="22" y2="13" stroke={C} strokeWidth={S} strokeLinecap="round"/>
    {/* body */}
    <path
      d="M29 14 C33 14 36 18 36 23 C36 30 31 38 22 38 C13 38 8 30 8 23 C8 18 11 14 15 14 C17 14 19.5 15.5 22 15.5 C24.5 15.5 27 14 29 14Z"
      fill={C} opacity="0.85"
    />
    {/* shine */}
    <ellipse cx="16" cy="21" rx="3" ry="4.5" fill="white" opacity="0.12" transform="rotate(-20 16 21)"/>
  </>)
}

/* ════════════════════════════════════════
   SECTOR ICONS  (used in .sectorIco)
═════════════════════════════════════════ */

/** Broadcast arcs — Media */
export function IconMedia({ size = 44 }) {
  return base(size, <>
    {/* mast */}
    <line x1="22" y1="22" x2="22" y2="36" stroke={C} strokeWidth={S} strokeLinecap="round"/>
    <line x1="16" y1="36" x2="28" y2="36" stroke={C} strokeWidth={S} strokeLinecap="round"/>
    {/* waves */}
    <path d="M16 22 A8 8 0 0 1 28 22" stroke={C} strokeWidth={S} strokeLinecap="round"/>
    <path d="M12 18 A14 14 0 0 1 32 18" stroke={C} strokeWidth={S+0.4} strokeLinecap="round"/>
    <path d="M8 14 A20 20 0 0 1 36 14" stroke={C} strokeWidth={S+0.2} strokeLinecap="round" opacity="0.55"/>
    {/* dot at centre */}
    <circle cx="22" cy="22" r="2.4" fill={C}/>
  </>)
}

/** Lightning bolt — Tech */
export function IconTech({ size = 44 }) {
  return base(size, <>
    <path
      d="M26 6 L14 24 L21 24 L18 38 L30 20 L23 20 Z"
      fill={C} opacity="0.9"
    />
  </>)
}

/** Play / clapperboard — Entertainment */
export function IconEntertainment({ size = 44 }) {
  return base(size, <>
    {/* outer rounded rect */}
    <rect x="6" y="10" width="32" height="26" rx="4" stroke={C} strokeWidth={S}/>
    {/* clapper stripes at top */}
    <line x1="6" y1="17" x2="38" y2="17" stroke={C} strokeWidth={S - 0.4}/>
    <line x1="13" y1="10" x2="11" y2="17" stroke={C} strokeWidth={S - 0.4}/>
    <line x1="20" y1="10" x2="18" y2="17" stroke={C} strokeWidth={S - 0.4}/>
    <line x1="27" y1="10" x2="25" y2="17" stroke={C} strokeWidth={S - 0.4}/>
    {/* play triangle */}
    <polygon points="18,22 18,32 29,27" fill={C} opacity="0.9"/>
  </>)
}

/* ════════════════════════════════════════
   PILLAR DOT ICONS  (used in .pillarDot)
   Small glyphs, rendered at 18–20 px
═════════════════════════════════════════ */

/** $ — Redemptive Capital */
export function IconDollar({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <text
        x="10" y="15"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="16"
        fontWeight="700"
        fill={C}
      >$</text>
    </svg>
  )
}

/** ∞ — Radical Hospitality */
export function IconInfinity({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <text
        x="10" y="14"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="14"
        fontWeight="700"
        fill={C}
      >∞</text>
    </svg>
  )
}

/** Leaf path — Ecosystem Growth */
export function IconLeaf({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 17 C10 17 4 13 4 8 C4 4 7 2 10 2 C13 2 16 4 16 8 C16 13 10 17 10 17Z"
        fill={C} opacity="0.85"
      />
      <line x1="10" y1="17" x2="10" y2="8" stroke="#0E1F14" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  )
}

/** ★ — Founder-First */
export function IconStar({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <polygon
        points="10,2 12.3,7.5 18.5,7.8 13.9,11.7 15.5,18 10,14.5 4.5,18 6.1,11.7 1.5,7.8 7.7,7.5"
        fill={C}
      />
    </svg>
  )
}
