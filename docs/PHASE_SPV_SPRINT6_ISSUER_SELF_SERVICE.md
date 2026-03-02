# Phase: SPV Sprint 6 — Issuer Self-Service

## Overview

Sprint 6 allows founders to **create and manage their own offerings directly from the UI**. It adds a full issuer dashboard (`/my-offerings`), create/edit forms, and a self-serve "Add SPV" panel on the pipeline dashboard.

---

## Frontend

### New Page — `pages/my-offerings.js`

Route: `/my-offerings`

Fetches `GET /profiles/offerings/my-offerings/`. Requires `getToken()`.

**Layout:**

- **Header row** — "My Offerings" heading + **"+ New Offering"** button → `/offerings/new`
- **Empty state** — CTA link to `/offerings/new` if no offerings exist
- **Offering card list** — one card per offering with:
  - Title + status pill (coloured by status)
  - Tagline (truncated)
  - Meta row: Target raise · Closing date · Progress % + amount raised
  - **Edit**, **Pipeline**, **View** action buttons

**Status pill colours:**

| Value | Colour |
|---|---|
| `draft` | Grey `#9E9E9E` |
| `live` | Green `#4CAF50` |
| `closed` | Blue `#2196F3` |
| `cancelled` | Red `#e53935` |

---

### New Page — `pages/offerings/new.js`

Route: `/offerings/new`

Creates a new offering via `POST /profiles/offerings/`. `business` is auto-assigned by the backend.

**Form fields:**

| Field | Type | Notes |
|---|---|---|
| `title` | text | Required |
| `tagline` | text | Max 500 chars |
| `target_raise` | number | Required, USD |
| `min_investment` | number | Default 1000 |
| `closing_date` | date | Optional |
| `status` | select | draft / live / closed / cancelled |
| `video_url` | url | Optional pitch video |
| `terms_text` | textarea | Deal terms |
| `is_public` | checkbox | Discoverable by all approved investors |

`pitch_deck` file upload is excluded (handled via Django admin for now).

On success: redirects to `/my-offerings`.

---

### New Page — `pages/offerings/edit/[id].js`

Route: `/offerings/edit/{id}`

Prefetches `GET /profiles/offerings/{id}/` to pre-fill the form. Submits via `PATCH /profiles/offerings/{id}/`.

**Additional features vs `new.js`:**
- **"Pipeline Dashboard →"** link in the top bar
- **Delete button** — calls `DELETE /profiles/offerings/{id}/` after `window.confirm`; redirects to `/my-offerings` on success
- **"View Public Page →"** link after save
- Inline **"✓ Changes saved."** success message (no redirect)

---

### Updated — `pages/offerings/dashboard/[id].js`

**New section at the bottom:** "Add New SPV" form.

- Text input for SPV name
- **"+ Create SPV"** button → `POST /profiles/spvs/` with `{ offering: id, name, status: 'open' }`
- Dashboard data reloads automatically on success
- Inline error message on failure

---

### Updated — `components/Layout.js`

Added **"My Deals"** nav link (desktop + mobile) after "Offerings", visible to all approved authenticated users.

```jsx
<Link href="/my-offerings" className={styles.navLink}>My Deals</Link>
```

---

### New Stylesheet — `styles/MyOfferings.module.css`

| Class | Purpose |
|---|---|
| `.header` | Flex row: heading left, "+ New Offering" button right |
| `.newBtn` | Orange CTA button |
| `.list` | Vertical stack of offering cards |
| `.card` | Dark bordered card with hover effect |
| `.cardTitleRow` | Title + status pill inline |
| `.statusPill` | Coloured rounded pill |
| `.cardMeta` | Muted meta row (target, closing, progress) |
| `.cardActions` | Edit / Pipeline / View link buttons |
| `.empty` | Centred empty-state CTA |

---

### New Stylesheet — `styles/OfferingForm.module.css`

Shared by both `new.js` and `edit/[id].js`.

| Class | Purpose |
|---|---|
| `.wrap` | Max-width centred layout wrapper |
| `.formCard` | Dark bordered form container |
| `.row2` | 2-column field grid (single-col on mobile) |
| `.fieldGroup` | Label + input + error stack |
| `.input` / `.select` / `.textarea` | Consistent dark-theme form controls |
| `.checkRow` | Checkbox with inline label |
| `.submitBtn` | Orange primary submit button |
| `.deleteBtn` | Red-tinted danger button (edit page) |
| `.errorMsg` / `.successMsg` / `.fieldError` | Inline feedback messages |

---

### Updated — `styles/Dashboard.module.css`

New classes for the Add SPV form:

| Class | Purpose |
|---|---|
| `.addSpvWrap` | Orange-bordered container below SPV list |
| `.addSpvForm` | Flex row: input + button |
| `.addSpvInput` | Dark-theme text input |
| `.addSpvBtn` | Orange submit button |
| `.addSpvError` | Red inline error |

---

## Backend Summary

See [by-the-fruit/docs/PHASE_SPV_SPRINT6_ISSUER_SELF_SERVICE.md](https://github.com/Odd-Shoes-Dev/by-the-fruit/blob/dev/docs/PHASE_SPV_SPRINT6_ISSUER_SELF_SERVICE.md) for backend details.

Key backend changes (no migration):
- `GET /profiles/offerings/my-offerings/` — issuer's own offerings list
- `OfferingViewSet.get_queryset` — issuer-scoped visibility
- `OfferingViewSet.perform_create/update/destroy` — ownership gates
- `SPVViewSet` — opened to issuers with offering ownership check on create
