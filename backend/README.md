# By The Fruit — Backend (Django REST API)

Django REST API for the By The Fruit marketplace: auth, profiles, connections, channels (with WebSockets), events, feed, and deals for creators. This README covers setup, running, database, and testing.

For the full project (frontend + docs), see the **root [README](../README.md)**.

---

## Prerequisites

- **Python 3.10+**
- **pip** and **virtualenv** (or `venv`)

---

## Setup

### 1. Virtual environment and dependencies

```bash
cd backend/by-the-fruit
python -m venv venv
```

**Activate the virtual environment** (required — all backend commands below assume the venv is active):

- **Windows (PowerShell or CMD):** `venv\Scripts\activate`
- **macOS / Linux:** `source venv/bin/activate`

You should see `(venv)` in your prompt. Then install dependencies:

```bash
pip install -r requirements.txt
```

### 2. Environment variables

Copy the example env file and edit it:

```bash
cp .env.example .env
```

**Required in `.env`:**

| Variable | Example | Description |
|----------|---------|-------------|
| `SECRET_KEY` | (long random string) | Django secret. Generate with: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DEBUG` | `1` | Use `1` in dev, `0` in production |
| `ALLOWED_HOSTS` | `127.0.0.1,localhost` | Comma-separated hosts |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated frontend origins |
| `ADMIN_EMAIL` | `admin@example.com` | Used by `create_super_user` |
| `ADMIN_PASSWORD` | (secure password) | Used by `create_super_user` |

**Optional:** `DB_CHOICE=sqlite` (default) or `postgres`, `SITE_NAME`, `CSRF_TRUSTED_ORIGINS` (for HTTPS).

### 3. Database and superuser

**SQLite (default):** No extra install. Migrations create `db.sqlite3` in this directory.

```bash
python manage.py migrate
python manage.py create_super_user
```

**PostgreSQL:** Set `DB_CHOICE=postgres` and configure the database URL in `main/settings.py` (e.g. via `dj_database_url` and `DATABASE_URL`). Then run the same `migrate` and `create_super_user` commands.

---

## Running the backend

In each new terminal, activate the venv first (`venv\Scripts\activate` on Windows, `source venv/bin/activate` on macOS/Linux), then:

**REST API only (no WebSockets):**

```bash
python manage.py runserver
```

- API: **http://127.0.0.1:8000**
- Admin: **http://127.0.0.1:8000/admin/**
- Swagger: **http://127.0.0.1:8000/swagger/**

**REST + WebSockets (real-time channel chat):**

```bash
daphne -b 0.0.0.0 -p 8000 main.asgi:application
```

Use this when you need live chat in channels. The frontend connects to `ws://.../ws/channels/{id}/?token=...`.

---

## Database handling

- **Apply migrations after model changes:**  
  `python manage.py makemigrations` then `python manage.py migrate`
- **Migrations live in:** `accounts/migrations/`, `profiles/migrations/`, and (if used) `api/migrations/`. `main/settings.py` may set `MIGRATION_MODULES`; if so, migrations are applied from those modules.
- **Reset SQLite (dev):** Delete `db.sqlite3`, then run `migrate` and `create_super_user` again.
- **Backups:** For SQLite, copy `db.sqlite3`. For Postgres, use `pg_dump` or your host’s backup tool.

Schema overview: **docs/DATABASE.md** (in repo root).

---

## Testing

Run all tests:

```bash
python manage.py test
```

Run by app:

```bash
python manage.py test accounts
python manage.py test profiles
python manage.py test api
```

Tests use the same settings; Django creates a test database (SQLite by default for test runs).

---

## Key URLs and apps

| Path | Purpose |
|------|---------|
| `/user/` | Auth: login, register, me (accounts) |
| `/api/` | Submit flows (founder/investor intake, etc.) |
| `/profiles/` | Profiles, connections, channels, events, feed, deals-for-creators |
| `/admin/` | Django admin |
| `/swagger/` | API docs (drf-yasg) |

---

## Project layout

```
backend/by-the-fruit/
├── main/           # Settings, URLs, ASGI/WSGI
├── accounts/        # CustomUser, auth, /user/
├── api/             # Submit endpoints, /api/
├── profiles/        # Business, InvestmentProfile, connections, channels, events, feed
├── manage.py
├── requirements.txt
├── .env.example     # Template; copy to .env
└── README.md        # This file
```

For API and feature details, see **docs/PHASES.md** and the **docs/PHASE*.md** files in the repo root.
