# Phase: SPV / Offering Sprint 1 — Frontend

## Overview

Sprint 1 adds three new investor-facing pages and nav links for the Offering/SPV investment flow.

---

## Pages

### `/offerings` — `pages/offerings/index.js`
Listing page for all live and public offerings.

**Features:**
- Fetches `GET /profiles/offerings/` 
- Card grid: business logo, category badge, title, business name, tagline
- 4-stat row: target raise, committed, min investment, closing date
- Progress bar filled to `progress_percent`
- "View Offering →" link to detail page
- Login prompt for unauthenticated users

---

### `/offerings/[id]` — `pages/offerings/[id].js`
Offering detail page with commit/invest flow.

**Features:**
- Fetches `GET /profiles/offerings/{id}/`
- Displays: title, logo, category, tagline
- YouTube/Vimeo embed (converts watch URL → embed)
- Pitch deck download link
- Deal terms text block
- Stats + ProgressBar in sticky right panel
- **Commit form** (logged-in + approved users only):
  - Amount input (pre-filled with `min_investment`)
  - FluffyButton submit → `POST /profiles/offerings/{id}/commit/`
  - Success state: shows commitment amount + status
  - Error state: shows API error message
- Disclaimer text
- Checks for existing commitment on load (hides form if already committed)
- Closed/cancelled badge for non-live offerings

---

### `/portfolio` — `pages/portfolio.js`
Investor portfolio dashboard.

**Features:**
- Fetches `GET /profiles/spv-commitments/` (own commitments only)
- Summary stats row: total committed, funded count, pending count
- Commitment list: SPV name, offering title, amount, status badge, committed date
- Status badge colors:
  - `pending` → orange
  - `signed` → green
  - `funded` → blue
  - `refunded` → grey

---

## Styles

### `styles/Offerings.module.css`
Shared stylesheet for all Offering pages.

Key class groups:
- `header`, `eyebrow`, `title`, `sub` — page header
- `grid`, `card`, `cardTop`, `logo`, `cardTitle`, `cardSub` — card grid
- `stats`, `stat`, `statLabel`, `statVal` — stats rows
- `progressTrack`, `progressFill`, `progressLabel` — progress bar
- `detailGrid`, `detailHeader`, `detailTitle`, `logoLg` — detail page layout
- `videoWrap`, `videoEmbed` — 16:9 video embed
- `termsBox`, `sectionLabel`, `deckLink` — content blocks
- `investPanel`, `commitForm`, `amountInput`, `commitNote` — invest panel
- `successBox`, `closedBadge`, `statusBadge`, `disclaimer` — status states
- `portfolioStats`, `portfolioStat`, `commitList`, `commitRow` — portfolio page

---

## Navigation (`components/Layout.js`)

Added to both desktop `navLinks` and mobile `mobileMenu` for `token && approved` users:

```jsx
<Link href="/offerings" className={styles.navLink}>Offerings</Link>
<Link href="/portfolio" className={styles.navLink}>Portfolio</Link>
```

Positioned after "Events", before "Deals".

---

## API Endpoints Used

| Page | Method | Endpoint |
|---|---|---|
| Index | GET | `/profiles/offerings/` |
| Detail | GET | `/profiles/offerings/{id}/` |
| Commit | POST | `/profiles/offerings/{id}/commit/` |
| Portfolio | GET | `/profiles/spv-commitments/` |

---

## Future Sprints

| Sprint | Feature |
|---|---|
| Sprint 2 | KYC upload modal + verification gate before committing |
| Sprint 3 | Stripe payment flow in portfolio, "Fund Commitment" button |
| Sprint 4 | DocuSign e-signature embed in commitment detail |
| Sprint 5 | Founder/business dashboard to manage offerings + view investor roster |
