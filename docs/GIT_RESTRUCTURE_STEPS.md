# Move Git repo from backend/ to project root

Do these steps in a terminal. Use the **project root** = the folder that contains `backend/`, `frontend/`, and `docs/` (not inside `backend/`).

## 1. Go to project root

```bash
cd path\to\by-the-fruit
```

(So that `backend`, `frontend`, and `docs` are direct children.)

## 2. Move the `.git` folder from backend to root

**Windows (PowerShell):**
```powershell
Move-Item -Path backend\.git -Destination .git
```

**macOS / Linux (Git Bash or WSL):**
```bash
mv backend/.git .git
```

Now the **project root** is the Git repo; `backend/` no longer has its own `.git`.

## 3. Check status

```bash
git status
```

You should see the repo at root level. You may see:
- Deleted paths (files that used to be at the old repo root inside `backend/`)
- Untracked `backend/`, `frontend/`, `docs/`, or other root files

## 4. Add everything and commit

```bash
git add .
git status
git commit -m "Restructure to monorepo: backend, frontend, docs at root"
```

## 5. Push to GitHub

```bash
git push origin main
```

(Use your branch name if different, e.g. `master`.)

---

After this, your GitHub repo root will show `backend/`, `frontend/`, `docs/`, and the root README. The same repo URL and history are preserved.
