# Sprint 7 — Admin Web Dashboard (Frontend)

## Overview

Sprint 7 replaces the old single-page Django-admin-dependent tab interface (`pages/admin/index.js`) with a full multi-page admin panel. The admin can now manage the entire platform from the website without touching Django admin.

---

## New Files

### `components/AdminLayout.js`

Shared sidebar layout used by all admin pages.

**Props:**

| Prop | Type | Description |
|---|---|---|
| `active` | `string` | Nav item key to highlight (see values below) |
| `badges` | `object` | Optional `{key: count}` map — shows orange pill next to nav item |
| `children` | `node` | Page content |

**Nav key → URL mapping:**

| Key | Label | URL |
|---|---|---|
| `overview` | Overview | `/admin` |
| `waitlist` | Waitlist | `/admin/waitlist` |
| `users` | All Users | `/admin/users` |
| `kyc` | KYC Queue | `/admin/kyc` |
| `offerings` | Offerings | `/admin/offerings` |
| `contacts` | Contact Messages | `/admin/contacts` |

**Responsive behaviour:** sidebar collapses to a horizontal nav row below 860px.

---

### `styles/Admin.module.css`

Shared stylesheet for all admin pages.

**Key classes:**

| Class | Purpose |
|---|---|
| `.adminWrap` | Outer flex container (sidebar + main) |
| `.sidebar` | Left nav sidebar |
| `.sidebarLink` / `.sidebarLinkActive` | Nav link states — active has orange left border |
| `.badge` | Orange pill for notification counts |
| `.main` | Main content area |
| `.pageHeader` | Top hero row with title/sub and optional action |
| `.eyebrow` | Small uppercase label above page title |
| `.pageTitle` | `h1` style |
| `.pageSub` | Subtitle below title |
| `.statsGrid` | 4-column responsive stats grid |
| `.statCard` | Individual stat card |
| `.statVal` | Large number value |
| `.statLabel` | Description text |
| `.statAccent` / `.statGreen` / `.statRed` | Coloured accent bar on stat card |
| `.quickGrid` | 5-column quick-link cards grid |
| `.quickCard` | Quick-link card |
| `.tableWrap` | Horizontally scrollable table wrapper |
| `.table` | Base table style |
| `.cellPrimary` / `.cellMuted` / `.cellEmail` | Table cell text variants |
| `.pill` / `.pillOrange` / `.pillGreen` / `.pillGrey` / `.pillRed` / `.pillBlue` | Status badge pills |
| `.actionRow` | `display:flex; gap` container for action buttons |
| `.approveBtn` / `.rejectBtn` | Green approve / red reject action buttons |
| `.filterBar` | Row of filter tab buttons |
| `.filterBtn` / `.filterActive` | Filter button states |
| `.searchInput` | Search text input |
| `.sectionCard` | White-on-dark card container |
| `.sectionCardHeader` / `.sectionCardTitle` / `.viewAllLink` | Section card header |
| `.empty` | Empty-state centered text |
| `.errorMsg` / `.successMsg` | Alert message styles |
| `.reasonInput` | Rejection reason textarea |
| `.msgBody` | Expanded message body text |

---

## Pages

### `pages/admin/index.js` — Overview Dashboard

- Fetches `GET /profiles/admin-stats/`
- Shows 4 section cards: Users, KYC, Offerings/SPVs, Capital
- Shows 5 quick-link cards to each sub-page
- Admin-only guard (`isAdmin()` check on mount)

---

### `pages/admin/waitlist.js` — Waitlist Management

- Fetches `GET /accounts/waitlist?status={filter}` where filter is `pending | approved | rejected | all`
- Filter tabs at top
- **Pending list:** Approve + Reject buttons → `PATCH /accounts/waitlist/{id}/action`
- On success: removes user from the displayed list
- Hides action column for approved/rejected tabs (read-only view)

---

### `pages/admin/users.js` — All Users

- Fetches all users via `GET /accounts/waitlist?status=all`
- Client-side search by name or email
- Client-side filter by `approval_status`
- Inline status updates: Approve/Reject buttons conditionally shown
- On success: updates user's status inline without removing the row

---

### `pages/admin/kyc.js` — KYC Queue

- Fetches `GET /profiles/kyc-documents/` (admin sees all documents)
- Client-side filter by `status` (pending / approved / rejected / all)
- **Document fields shown:** `user_name`, `user_email`, `document_type`, `document_file` (link), `status`, `reviewed_at`
- **Approve:** `POST /profiles/kyc-documents/{id}/approve/`
- **Reject:** per-row textarea for optional reason → `POST /profiles/kyc-documents/{id}/reject/` with `{reason}`
- On success updates status inline

---

### `pages/admin/offerings.js` — Offerings

- Fetches `GET /profiles/offerings/` (admin sees all)
- Client-side search (title or business_name) + status filter
- **Columns:** Title, Business, Status, Target Raise, Total Committed, Progress %, Closing Date, Actions
- **Actions:** View (`/offerings/{id}`) + Pipeline (`/offerings/dashboard/{id}`)

---

### `pages/admin/contacts.js` — Contact Messages

- Fetches `GET /profiles/contact-messages/`
- **Columns:** Email, Received, Message (expandable)
- Expand/collapse message body per row
- Delete: `DELETE /profiles/contact-messages/{id}/` — removes row on success

> Note: `ContactMessage` model only has `email` and `message`. There is no `name` or `subject` field.

---

## Updated Files

### `components/Layout.js`

Added `<Link href="/admin">Admin</Link>` to the **desktop** nav inside the `{admin && ...}` conditional block. (Mobile nav already had this link from a prior sprint.)

---

## Auth Guard Pattern

Every admin page uses the same guard at the top of `useEffect`:

```js
if (!getToken() || !isAdmin()) {
  router.replace('/login')
  return
}
```

Unauthenticated or non-admin users are immediately redirected to `/login`.

---

## Navigation Flow

```
/login (admin credentials)
  → redirects to /admin

/admin                  ← Overview stats
/admin/waitlist         ← Approve/reject new signups
/admin/users            ← Search all users
/admin/kyc              ← Review KYC documents
/admin/offerings        ← Browse all offerings
/admin/contacts         ← Read/delete contact messages
```
