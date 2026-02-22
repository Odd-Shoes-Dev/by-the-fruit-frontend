# Phase 4: Family Members & Profile Visibility

## Overview
Users can add family members to their profile (name, photo, relationship, optional link to platform profile) and control who can see each section: bio and family.

## Models

### FamilyMember
| Field | Type | Notes |
|-------|------|-------|
| user | FK CustomUser | Owner |
| name | CharField | Required |
| photo | ImageField | Optional |
| profile_link | FK CustomUser | Optional; links to user if they have an account |
| relationship | CharField | spouse, child, parent, sibling, other |

### CustomUser visibility fields
| Field | Choices | Default |
|-------|---------|---------|
| family_visibility | everyone, connections, only_me | everyone |
| bio_visibility | everyone, connections, only_me | everyone |

## API

### Family members
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/profiles/family-members/` | GET | List current user's family members |
| `/profiles/family-members/` | POST | Create (name, relationship, profile_link) |
| `/profiles/family-members/{id}/` | GET, PUT, PATCH, DELETE | CRUD |

### User profile (includes family)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/user/me` | GET | Current user with family_members, visibility |
| `/user/me` | PATCH | Update bio, family_visibility, bio_visibility |

## Visibility logic (to implement in profile view)
When displaying a profile to a viewer:
- **everyone**: Always show
- **connections**: Show only if viewer is connected (investor-founder)
- **only_me**: Never show to others
