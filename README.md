# By The Fruit

A faith-oriented marketplace connecting founders and investors. Full-stack app: **Next.js** frontend and **Django REST** backend with real-time chat, connections, channels, events, and a relevance-based feed.

---

## Repository structure: one repo (recommended)

**Use a single GitHub repository** (monorepo) for this project.

| Approach | When it fits |
|----------|----------------|
| **One repo** ✅ | One product, one team, backend and frontend stay in sync. Easier to clone, run, and document. |
| Separate repos | Only if different teams own backend vs frontend and need independent release cycles. |

This codebase is structured as a **monorepo**:

```
by-the-fruit/
├── backend/by-the-fruit/   # Django REST API (Python)
├── frontend/               # Next.js app (React)
├── docs/                   # Project documentation
└── README.md               # This file
```

---

## Quick start (run the whole app)

### Prerequisites

- **Python 3.10+** (backend)
- **Node.js 18+** and **npm** (frontend)
- (Optional) **PostgreSQL** if you prefer it over SQLite

### 1. Clone and backend setup

```bash
git clone https://github.com/YOUR_ORG/by-the-fruit.git
cd by-the-fruit
```

**Backend (Django):**

```bash
cd backend/by-the-fruit
python -m venv venv
```

Activate the virtual environment (required before installing or running anything):

- **Windows (PowerShell or CMD):** `venv\Scripts\activate`
- **macOS / Linux:** `source venv/bin/activate`

You should see `(venv)` in your prompt. Then:

```bash
pip install -r requirements.txt
cp .env.example .env
# Edit .env: set SECRET_KEY, DEBUG=1, ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS, ADMIN_EMAIL, ADMIN_PASSWORD (see Backend section below)
python manage.py migrate
python manage.py create_super_user
```

**Run backend:**

- REST only: `python manage.py runserver` → API at **http://127.0.0.1:8000**
- REST + WebSockets (real-time chat): `daphne -b 0.0.0.0 -p 8000 main.asgi:application`

### 2. Frontend setup

In a new terminal:

```bash
cd by-the-fruit/frontend
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000 (or your backend URL; no trailing slash)
npm install
npm run dev
```

Frontend: **http://localhost:3000**

### 3. Verify

- Open http://localhost:3000 — you should see the By The Fruit homepage.
- Log in (or sign up) — the frontend uses the backend `/user/` and `/api/` auth endpoints.
- Admin: http://127.0.0.1:8000/admin/ (use the superuser you created).

---

## Database

- **Default:** SQLite. File: `backend/by-the-fruit/db.sqlite3` (created on first `migrate`). No extra setup.
- **PostgreSQL:** Set `DB_CHOICE=postgres` and configure the DB URL (e.g. via `DATABASE_URL` / `dj_database_url` in `main/settings.py`). Run `python manage.py migrate` as usual.

**Handling the database:**

- **Create/apply migrations (after model changes):**  
  `cd backend/by-the-fruit && python manage.py makemigrations && python manage.py migrate`
- **Reset DB (SQLite, dev only):** delete `db.sqlite3`, then run `python manage.py migrate` and `python manage.py create_super_user` again.
- **Backups:** For SQLite, copy `db.sqlite3`. For Postgres, use your DB backup tools (`pg_dump`, etc.).

See **docs/DATABASE.md** for schema overview and **backend/by-the-fruit/README.md** for env and migration details.

---

## Testing

### Backend (Django)

```bash
cd backend/by-the-fruit
# Activate venv, then:
python manage.py test
```

To run a specific app’s tests:

```bash
python manage.py test accounts
python manage.py test profiles
```

### Frontend (Next.js)

```bash
cd frontend
npm run lint
```

Add `npm run test` (and a test script in `package.json`) when you add a test runner (e.g. Jest).

---

## Environment variables

### Backend (`backend/by-the-fruit/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | Django secret (e.g. `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`) |
| `DEBUG` | Yes | `1` for development, `0` for production |
| `ALLOWED_HOSTS` | Yes | Comma-separated, e.g. `127.0.0.1,localhost` |
| `CORS_ALLOWED_ORIGINS` | Yes | Comma-separated frontend origins, e.g. `http://localhost:3000,http://127.0.0.1:3000` |
| `ADMIN_EMAIL` | Yes | Superuser email for `create_super_user` |
| `ADMIN_PASSWORD` | Yes | Superuser password |
| `DB_CHOICE` | No | `sqlite` (default) or `postgres` |
| `SITE_NAME` | No | Admin site title |
| `CSRF_TRUSTED_ORIGINS` | No | Comma-separated if using HTTPS (e.g. `https://yourdomain.com`) |

See **backend/by-the-fruit/.env.example** for a template.

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Yes (if API on different origin) | Backend base URL with no trailing slash, e.g. `http://127.0.0.1:8000` |

If the frontend is served from the same host as the API, you can leave it empty or set it to the same origin.

---

## Documentation

| Document | Description |
|----------|-------------|
| **docs/PHASES.md** | Implementation phases (1–7) and status |
| **docs/DATABASE.md** | Database schema overview |
| **docs/COMPLIANCE.md** | Legal/compliance checklist (US Reg D/CF, etc.) |
| **docs/README.md** | Index of all docs and per-phase guides |
| **docs/PHASE1_PROFILE_FIELDS.md** … **PHASE7_CREATORS_MICRO_INVESTORS.md** | Per-phase scope, API, and notes |
| **backend/by-the-fruit/README.md** | Backend setup, run, test, env |
| **frontend/README.md** | Frontend setup, run, build, env |

---

## License and contributing

Add your license and contribution guidelines here. Do not commit `.env` or secrets; use `.env.example` as a template.
