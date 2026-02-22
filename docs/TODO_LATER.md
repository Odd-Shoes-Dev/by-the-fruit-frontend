# By The Fruit — To Do Later

Items to add or finish when ready. Not blocking current release.

---

## Footer social links (see Phase 8 landing)

- Add real URLs for Twitter, Facebook, LinkedIn (and any other channels) in the site footer.
- Currently the landing page has placeholders (`twitter.com/yourprofile`, etc.). Replace with actual links when the brand accounts are set up.

---

## Signup / login routes for founders and investors — Implemented

- **Done:** Dedicated routes `/signup/founder` and `/signup/investor` (redirect to `/signup?role=...`).
- **Done:** Landing CTAs “Sign up as Founder” and “Sign up as Investor” point to those routes.
- **Done:** After signup with a role, user is prompted to log in; after login they are redirected to `/onboarding/founder` or `/onboarding/investor` to complete their profile (Business or InvestmentProfile).
- **Done:** Backend `perform_create` for Business and InvestmentProfile sets `user=request.user`.

---

## Password reset — Frontend wired; email link points to backend

- **Done:** `/forgot-password` — form to request reset; POST to `/user/request-reset-password`.
- **Done:** `/reset-password?uidb64=...&token=...` — form to set new password; PATCH to `/user/password-reset-complete`.
- **Done:** “Forgot password?” link on login page.
- **To do:** Backend currently sends an email with a link to the **backend** URL (`/user/password-reset/uidb64/token`). To send users to the **frontend** reset page, configure a `FRONTEND_URL` (or similar) in backend and build the link as `${FRONTEND_URL}/reset-password?uidb64=${uidb64}&token=${token}` in `ResetPasswordWithEmail`. Also fix the backend bug: `to_email` should be `user.email`, not `CustomUser.email`.

---

## Email verification

- Backend `verify-email` is commented out; frontend has a stub page `/verify-email` for when it’s enabled.
- Wire backend and frontend when you’re ready to require verification.

---

## Event reminders & notifications

- **Event “Remind me”:** Works: creates an `EventReminder` in the DB via POST `/profiles/events/{id}/remind-me/`. No push or email is sent yet.
- **In-app notifications:** There is no notification centre (e.g. bell icon, list of notifications). Event reminders, connection requests, and channel messages are not surfaced as “notifications” in the UI.
- **To do later:** Push/email for event reminders (e.g. Celery task that runs before `remind_at` and sends email). Optional: add an in-app notifications API and UI (e.g. “You have a new connection request”, “New message in Channel X”).
