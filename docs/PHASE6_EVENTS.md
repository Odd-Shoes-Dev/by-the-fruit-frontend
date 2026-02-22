# Phase 6: Events & Pitching Competitions

## Overview
Admin-scheduled events (e.g. pitching competitions) appear in the Events section. Founders can register for slots; investors can set reminders. Events can be live or ended with optional recording URL.

## Models
- **Event**: title, description, theme, requirements, starts_at, ends_at, community (optional), created_by (admin), max_slots, status (scheduled | live | ended), recording_url
- **EventRegistration**: event, user (founder registers for a slot)
- **EventReminder**: event, user, remind_at (investor reminder)
- **EventParticipant**: event, user, tagged_by (admin tags founder as participant in competition)

## API Summary
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/profiles/events/` | GET, POST | List all, create (auth) |
| `/profiles/events/upcoming/` | GET | Upcoming (scheduled, starts_at > now) |
| `/profiles/events/live/` | GET | Live events |
| `/profiles/events/{id}/register/` | POST | Founder register for slot |
| `/profiles/events/{id}/remind-me/` | POST | Set reminder |
| `/profiles/events/{id}/tag-participant/` | POST | Admin tag participant (user_id) |
| `/profiles/event-registrations/` | GET | My registrations |
| `/profiles/event-reminders/` | GET | My reminders |

## Frontend
- **Events page** (`/events`): Lists live and upcoming events from API; Register and Remind me when logged in
- **Events** link in nav when logged in

## Future (not implemented)
- Actual live stream (embed or link to external provider)
- Auto-save recording when live ends (cron or webhook)
- Push/email notifications for reminders
