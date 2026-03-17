# Phase: SPV Sprint 5 — Pipeline Dashboard & SPV Closing

## Overview

Sprint 5 gives offering issuers and admins a **real-time pipeline view** of every commitment across all SPVs, with KYC, payment, and signature status visible at a glance. Admins can also officially **close an SPV** from the dashboard.

---

## Frontend

### New Page — `pages/offerings/dashboard/[id].js`

Route: `/offerings/dashboard/{offering_id}`

Fetches `GET /profiles/offerings/{id}/dashboard/`. Non-admin users are redirected to the offering detail by a backend 403.

**Layout:**

1. **Offering header** — title, status pill, optional closing date
2. **4-stat grid** — Funded · Target · Progress % · Investor count
3. **Progress bar** — funded total vs target raise
4. **Per-SPV blocks** — one block per SPV containing:
   - SPV name, status pill, summary stats (investor count, committed, funded, signed)
   - **Close SPV** button (only if `status !== 'closed'`) — triggers `POST /profiles/spvs/{id}/close/` after `window.confirm`
   - **Commitments table** with columns: Investor · Amount · Status · KYC · Payment · Signature · Committed date

**Status pill colours:**

| Value | Colour |
|---|---|
| `pending` | Orange `#E8601A` |
| `funded` / `signed` | Green `#4CAF50` |
| `refunded` / `voided` | Grey `#9E9E9E` |
| `paid` | Blue `#2196F3` |

**Close SPV flow:**
- `window.confirm` warns the issuer that pending commitments will be refunded and funded investors notified
- On confirm: `POST /profiles/spvs/{spvId}/close/` → refreshes dashboard data
- Button shows "Closing…" while in-flight, disabled state

---

### Updated — `pages/offerings/[id].js`

For admin/staff users a **"Pipeline Dashboard →"** link appears in the top navigation bar (next to "← All Offerings"). Visibility is controlled by `isAdmin()` from `lib/api.js`.

---

### New Stylesheet — `styles/Dashboard.module.css`

Key classes:

| Class | Purpose |
|---|---|
| `.statsGrid` | 4-column responsive stat card grid |
| `.statCard` | Dark bordered stat card |
| `.progressTrack` / `.progressFill` | Animated green progress bar |
| `.spvBlock` | Per-SPV dark card |
| `.spvHeader` | Flex header row with close button |
| `.closeBtn` | Red-tinted destructive action button |
| `.table` | Full-width pipeline table |
| `.pill` | Small uppercase coloured status pill |
| `.errorBanner` | Red inline error message banner |

---

### Updated — `styles/Offerings.module.css`

New `.dashboardLink` — pill-shaped link shown in offering detail header for admin users, highlights orange on hover.

---

## Backend Summary

See [by-the-fruit/docs/PHASE_SPV_SPRINT5_DASHBOARD.md](https://github.com/Odd-Shoes-Dev/by-the-fruit/blob/dev/docs/PHASE_SPV_SPRINT5_DASHBOARD.md) for backend details.

Key backend additions (no migration):
- `GET /profiles/offerings/{id}/dashboard/` — full pipeline data
- `POST /profiles/spvs/{id}/close/` — close SPV, refund pending, email funded investors
- `POST /profiles/subscription-agreements/{id}/void/` — staff voids a signed agreement
- `spv_closed` email method in `services/emailService.py`
