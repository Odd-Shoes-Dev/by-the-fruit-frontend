# By The Fruit — Frontend (Next.js)

Next.js app for the By The Fruit marketplace: founders, investors, feed, connections, channels (with real-time chat), events, and deals for creators. This README covers setup, running, building, and pointing at the backend.

For the full project (backend + docs), see the **root [README](../README.md)**.

---

## Prerequisites

- **Node.js 18+**
- **npm** (or yarn/pnpm)

---

## Setup

```bash
cd frontend
npm install
```

### Environment

Copy the example env file and set the backend URL if needed:

```bash
cp .env.local.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | If API is on another origin | Backend base URL **with no trailing slash**, e.g. `http://127.0.0.1:8000`. Omit or leave empty if the frontend is served from the same host as the API and you use relative paths. |

The app uses this for API calls (e.g. `apiFetch('/user/me')` → `http://127.0.0.1:8000/user/me` when set).

---

## Running

**Development (with hot reload):**

```bash
npm run dev
```

App: **http://localhost:3000**

**Production build and run:**

```bash
npm run build
npm start
```

Runs on port 3000 by default (see `package.json` scripts).

---

## Backend connection

1. Backend must be running (see **backend/by-the-fruit/README.md**).
2. In `frontend/.env.local`, set `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000` (or your backend URL).
3. Auth: login/signup store a token; the frontend sends `Authorization: Token <token>` on API requests.

---

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm start` | Run production server (after `build`) |
| `npm run lint` | Run Next.js ESLint |

---

## Testing

- **Lint:** `npm run lint`
- Add a test runner (e.g. Jest, React Testing Library) and a `test` script in `package.json` when you add tests.

---

## Project layout

```
frontend/
├── pages/          # Next.js pages (index, login, signup, community, events, deals, connections, channels, profile, founders, investors)
├── components/     # Shared components (ConnectionButtons, PostForm, PostList, etc.)
├── lib/            # api.js (auth, apiFetch), useChannelChat.js
├── styles/         # Global CSS
├── .env.local      # Local env (create from .env.local.example; do not commit secrets)
└── README.md       # This file
```

Feature and API details: **docs/PHASES.md** and **docs/PHASE*.md** in the repo root.
