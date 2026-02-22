# By The Fruit — Documentation index

This folder holds project documentation: phases, database, compliance, and how to run and test the app.

---

## Running and testing the app

- **Root [README](../README.md)** — One-repo recommendation, quick start, database, testing, env vars for both backend and frontend.
- **Backend [README](../backend/by-the-fruit/README.md)** — Django setup, .env, migrations, run (runserver vs daphne), tests.
- **Frontend [README](../frontend/README.md)** — Next.js setup, .env, dev/build, connecting to the backend.

---

## Implementation phases

- **[PHASES.md](PHASES.md)** — Master list of all phases (1–7) with status and short scope. Start here for a high-level overview.

Per-phase docs (scope, API, models):

| Phase | Doc | Summary |
|-------|-----|--------|
| 1 | [PHASE1_PROFILE_FIELDS.md](PHASE1_PROFILE_FIELDS.md) | Profile fields: contact, location, postal code |
| 2 | [PHASE2_CONNECTIONS_CHANNELS.md](PHASE2_CONNECTIONS_CHANNELS.md) | Connections (interested → connect → channel) and channels |
| 3 | [PHASE3_REALTIME.md](PHASE3_REALTIME.md) | Real-time chat (Django Channels, WebSocket) |
| 4 | [PHASE4_FAMILY.md](PHASE4_FAMILY.md) | Family members and visibility settings |
| 5 | [PHASE5_FEED_ALGORITHM.md](PHASE5_FEED_ALGORITHM.md) | Community feed and relevance algorithm |
| 6 | [PHASE6_EVENTS.md](PHASE6_EVENTS.md) | Events and pitching competitions |
| 7 | [PHASE7_CREATORS_MICRO_INVESTORS.md](PHASE7_CREATORS_MICRO_INVESTORS.md) | Creators/influencers and micro-investors; deals-for-creators API |

---

## Database and compliance

- **[DATABASE.md](DATABASE.md)** — Schema overview (CustomUser, Business, InvestmentProfile, connections, channels, events, etc.). No raw SQL; Django migrations are the source of truth.
- **[COMPLIANCE.md](COMPLIANCE.md)** — Legal/compliance checklist (US Reg D/Reg CF, KYC, disclaimers, etc.). Not legal advice; for implementation tracking only.

---

## Auth & onboarding
- **[AUTH_AND_ONBOARDING.md](AUTH_AND_ONBOARDING.md)** — Signup/login, dedicated founder/investor routes, onboarding, password reset, verify-email stub.

---

## Quick reference

- **Backend base URL (dev):** `http://127.0.0.1:8000`
- **Frontend (dev):** `http://localhost:3000`
- **Admin:** `http://127.0.0.1:8000/admin/`
- **API docs (Swagger):** `http://127.0.0.1:8000/swagger/`
