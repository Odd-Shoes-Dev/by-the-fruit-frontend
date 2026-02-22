# By The Fruit — Database Schema Overview

Database is managed via **Django migrations**. No raw SQL schema files. This doc provides a human-readable overview.

---

## Core Models

### accounts.CustomUser
Base user for founders and investors.

| Field | Type | Notes |
|-------|------|-------|
| email | EmailField | Unique, primary identifier |
| full_name | CharField | |
| phone | CharField | Unique, nullable |
| photo | ImageField | Profile photo |
| address | TextField | Street address |
| location | CharField | City/region (e.g. "San Francisco, CA") |
| postal_code | CharField | ZIP/postal code |
| phone | CharField | Phone number |
| bio | TextField | |
| auth_provider, auth_id | | For social login |
| is_admin, is_staff, is_verified | Boolean | |

---

### profiles.InvestmentProfile
Investor profile (links to CustomUser).

| Field | Type | Notes |
|-------|------|-------|
| user | FK → CustomUser | |
| bio | TextField | |
| philosophy | TextField | |
| check_size_range | CharField | e.g. 1000-5000, 50000-100000 |
| investment_type | CharField | BUSINESS_CATEGORIES |
| location | CharField | City/region |
| address | TextField | Street address |
| phone | CharField | Contact phone |
| postal_code | CharField | ZIP/postal code |
| linkedin, twitter, facebook, instagram | URLField | Social links |

---

### profiles.Business
Founder's company (links to CustomUser).

| Field | Type | Notes |
|-------|------|-------|
| user | FK → CustomUser | Founder |
| name | CharField | Business name |
| category | CharField | BUSINESS_CATEGORIES |
| description | TextField | |
| address | TextField | |
| city, country | CharField | |
| postal_code | CharField | |
| phone, email, website | | Contact |
| logo | ImageField | |
| is_verified | Boolean | |

---

### profiles.InvestmentRequest
Founder's request for funding.

| Field | Type | Notes |
|-------|------|-------|
| user | FK → CustomUser | Founder |
| business | FK → Business | |
| amount | Decimal | Requested amount |
| description | TextField | |
| date | DateField | |
| status | CharField | pending, approved, rejected |

---

### profiles.Investment
Investor's commitment to a request.

| Field | Type | Notes |
|-------|------|-------|
| investor | FK → CustomUser | |
| request | FK → InvestmentRequest | |
| amount | Decimal | |
| description | TextField | |
| date | DateField | |
| status | CharField | |

---

### profiles.Community
Groups of people and businesses.

| Field | Type | Notes |
|-------|------|-------|
| name, description | | |
| image, thumbnail | ImageField | |
| people | M2M → CustomUser | Members |
| businesses | M2M → Business | |

---

### profiles.JobPosting
Jobs posted by businesses.

| Field | Type | Notes |
|-------|------|-------|
| business | FK → Business | |
| title, description | | |
| location, type | | full_time, part_time, etc. |
| salary_range | CharField | |
| deadline | DateField | |
| is_active | Boolean | |

---

### profiles.JobApplication
User applies to a job.

| Field | Type | Notes |
|-------|------|-------|
| job | FK → JobPosting | |
| applicant | FK → CustomUser | |
| resume | FileField | |
| cover_letter | TextField | |
| status | CharField | pending, reviewed, etc. |

---

## Base Model (Abstract)
All profile models inherit from BaseModel:
- `uuid`, `created_at`, `updated_at`
- `deleted`, `active` (soft delete)

---

## Phase 2 Models (Implemented)
- **Connection** — Investor ↔ Founder; status: interested | connect_pending | connected | rejected
- **Channel** — Created when connection accepted; links founder + investor
- **ChannelMember** — Members (founder, investor, or invited); admin join by invitation only
- **ChannelProgressUpdate** — Founder posts updates visible to channel members
- **ChannelMessage** — Messages in channel (real-time in Phase 3)

---

## Phase 4 Models (Implemented)
- **FamilyMember** — user, name, photo, profile_link (FK to CustomUser), relationship
- **CustomUser** — family_visibility, bio_visibility (everyone | connections | only_me)

## Phase 5 Models (Implemented)
- **CommunityPost** — author, community (optional), content, image, video, category

## Phase 6 Models (Implemented)
- **Event** — title, description, theme, requirements, starts_at, ends_at, community, created_by, max_slots, status, recording_url
- **EventRegistration** — event, user (founder)
- **EventReminder** — event, user, remind_at
- **EventParticipant** — event, user, tagged_by (admin)

---

## Upcoming Models (Phase 7+)
