# Auth, signup, onboarding & password reset

## Routes

| Route | Purpose |
|-------|--------|
| `/signup` | Generic signup |
| `/signup/founder` | Redirects to `/signup?role=founder`; after signup → login → `/onboarding/founder` |
| `/signup/investor` | Redirects to `/signup?role=investor`; after signup → login → `/onboarding/investor` |
| `/login` | Login; if `btf_pending_role` is set, redirects to `/onboarding/founder` or `/onboarding/investor` |
| `/onboarding/founder` | Complete founder profile: create a Business (POST `/profiles/businesses/`) |
| `/onboarding/investor` | Complete investor profile: create InvestmentProfile (POST `/profiles/investment-profiles/`) |
| `/forgot-password` | Request reset link; POST `/user/request-reset-password` |
| `/reset-password?uidb64=...&token=...` | Set new password; validates via GET `/user/password-reset/uidb64/token`, then PATCH `/user/password-reset-complete` |
| `/verify-email` | Stub; backend verify-email not yet enabled |

## Flow: Founder

1. User clicks “Sign up as Founder” on landing → `/signup/founder` → `/signup?role=founder`.
2. Submits signup → backend creates user. Frontend sets `btf_pending_role=founder` and shows “Log in to complete your founder profile”.
3. User logs in → frontend redirects to `/onboarding/founder`.
4. User submits company name, category, description (optional) → POST `/profiles/businesses/` (backend sets `user=request.user`).
5. Redirect to `/profile/settings` or skip.

## Flow: Investor

1. User clicks “Sign up as Investor” → `/signup/investor` → `/signup?role=investor`.
2. Signup → `btf_pending_role=investor` → login → redirect to `/onboarding/investor`.
3. User submits bio, check size range, investment focus → POST `/profiles/investment-profiles/` (backend sets `user=request.user`).
4. Redirect to `/profile/settings` or skip.

## Backend

- `POST /user/register` — create user.
- `POST /user/login` — returns user + token.
- `POST /profiles/businesses/` — create business (auth required; user set server-side).
- `POST /profiles/investment-profiles/` — create investment profile (auth required; user set server-side).
- `POST /user/request-reset-password` — body `{ "email": "..." }`; sends email with reset link (link currently points to backend; see TODO_LATER for frontend link).
- `GET /user/password-reset/<uidb64>/<token>` — validate token.
- `PATCH /user/password-reset-complete` — body `{ "password", "token", "uidb64" }`.

## Notifications

- **In-app:** No notification centre yet. Event “Remind me” only stores a reminder; no push/email.
- See **TODO_LATER.md** for event reminders and in-app notifications backlog.
