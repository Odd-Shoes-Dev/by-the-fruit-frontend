# Phase 8: Testimonials, Newsletter & Admin

## Overview
- **Testimonials**: Admin-curated quotes shown on the landing page. Admin toggles visibility in Django admin.
- **Newsletter**: Contact form (email + message) for visitors to reach admin. Messages stored in DB.
- **Admin-only lists**: Founders and Investors lists are restricted to admin users.
- **Admin page**: Connected to backend APIs; view posts, events, founders, investors, testimonials, contact messages.
- **Profiles**: Profile [id] page loads user data from backend (`/user/{id}`).

## Backend

### Models
- **Testimonial**: author_name, role, quote, order, visible (admin toggles)
- **ContactMessage**: email, message, created_at

### API
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/profiles/testimonials/` | GET | Public | List visible testimonials |
| `/profiles/testimonials/` | POST, PUT, PATCH, DELETE | Admin | Full CRUD |
| `/profiles/contact-messages/` | POST | Public | Submit message |
| `/profiles/contact-messages/` | GET, etc. | Admin | List messages |
| `/profiles/founders/` | GET | Admin only | List founders |
| `/profiles/investment-profiles/` | GET | Admin only | List investors |

### Django Admin
- **Testimonial**: list_display author_name, role, visible, order; list_editable visible, order
- **ContactMessage**: list_display email, message_preview, created_at

## Frontend

### Landing page
- CTAs: "Sign up as Founder", "Sign up as Investor", "Log in" (no Browse Founders/Investors for public)
- Testimonials from API (visible only)
- Newsletter section: email + message form → POST `/profiles/contact-messages/`
- Admin nav links (Founders, Investors, Admin) when `is_staff`

### Founders / Investors pages
- Require admin; redirect to home if not
- Use `apiFetch` with token

### Admin page
- Fetches from: community-posts, events/upcoming, founders, investment-profiles, testimonials, contact-messages
- Link to Django admin for managing testimonials and messages

### Profile [id]
- Fetches `/user/{id}` when authenticated
- Shows edit form (FounderProfileForm / InvestorProfileForm) only for own profile

### Signup
- Supports `?role=founder` and `?role=investor` for contextual title

## Migration
- `profiles/migrations/0013_testimonial_contactmessage.py`
