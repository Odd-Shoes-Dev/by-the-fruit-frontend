# By The Fruit — Implementation Phases

Documentation for each development phase. Updated as features are completed.

**Per-phase docs:** `PHASE1_PROFILE_FIELDS.md`, `PHASE2_CONNECTIONS_CHANNELS.md`, `PHASE3_REALTIME.md`, `PHASE4_FAMILY.md`, `PHASE5_FEED_ALGORITHM.md`, `PHASE6_EVENTS.md`, `PHASE7_CREATORS_MICRO_INVESTORS.md`, `PHASE8_TESTIMONIALS_NEWSLETTER_ADMIN.md`

---

## Phase 1: Profile Fields (Contact & Location)

**Status:** ✅ Complete

### Scope
Add location, address, phone, and postal code for investors and founders across the platform.

### Backend Changes
- **CustomUser**: `location`, `postal_code` (address, phone already existed)
- **Business**: `postal_code`
- **InvestmentProfile**: `location`, `address`, `phone`, `postal_code` (for public submit flow)
- **PATCH /user/me**: Update current user profile
- **Register**: Accept optional contact fields

### Frontend Changes
- **FounderProfileForm**, **InvestorProfileForm**: Contact & Location section
- **FounderForm**, **InvestorForm**: Business contact / investor contact fields
- **Signup**: Optional contact fields, password field, API integration

### Migrations
- `accounts/migrations/0004_customuser_location_postal.py`
- `profiles/migrations/0006_business_postal_code.py`
- `profiles/migrations/0007_investmentprofile_address_location_phone_postal.py`

### Files Touched
- `backend/by-the-fruit/accounts/models.py`, `views.py`, `serializers.py`
- `backend/by-the-fruit/profiles/models.py`
- `frontend/components/FounderForm.js`, `InvestorForm.js`, `FounderProfileForm.js`, `InvestorProfileForm.js`
- `frontend/pages/signup.js`

---

## Phase 2: Connections & Channels

**Status:** ✅ Complete

### Scope
Investor-founder connection flow: Interested → Connect → mutual acceptance → private channel creation. Channels include messages and progress updates.

### Backend Changes
- **Connection**: `investor`, `founder`, `status` (interested | connect_pending | connected | rejected)
- **Channel**: Created when connection accepted; links founder + investor
- **ChannelMember**: Members with roles; invite-only for admins/others
- **ChannelProgressUpdate**: Founder posts visible only to channel members
- **ChannelMessage**: Messages in channel (non–real-time initially)

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/profiles/connections/` | GET | List user's connections |
| `/profiles/connections/interested/` | POST | Investor marks interested |
| `/profiles/connections/connect/` | POST | Investor requests connect |
| `/profiles/connections/{id}/accept/` | POST | Founder accepts |
| `/profiles/connections/{id}/reject/` | POST | Founder rejects |
| `/profiles/connections/interested-in-me/` | GET | Investors interested in founder |
| `/profiles/connections/pending-for-me/` | GET | Pending connect requests |
| `/profiles/channels/` | GET, POST | List/create channels |
| `/profiles/channels/{id}/invite/` | POST | Invite user |
| `/profiles/channels/{id}/accept-invite/` | POST | Accept invite |
| `/profiles/channels/{id}/remove-member/` | POST | Remove member |
| `/profiles/channel-messages/?channel={id}` | GET, POST | Messages |
| `/profiles/channel-progress/?channel={id}` | GET, POST | Progress updates |
| `/profiles/founders/` | GET | List founders |

### Frontend Changes
- **ConnectionButtons**: Interested / Connect on founder cards
- **Login**: Real API login, token storage
- **Connections page** (`/connections`): Pending requests, interested list, connected list
- **Channels page** (`/channels`): Channel list
- **Channel detail** (`/channels/[id]`): Messages & progress forms
- **lib/api.js**: Token, auth headers, apiFetch

### Migrations
- `profiles/migrations/0008_connection_channel_channelmember_channelprogressupdate_channelmessage.py`

### Flow
1. Investor browses founders → clicks Interested or Connect
2. Founder sees requests at `/connections` → Accept or Reject
3. On accept → Channel created, both added as members
4. Channel: messages + progress updates; can invite others (invite must be accepted)

---

## Phase 3: Real-Time Chat

**Status:** ✅ Complete

### Scope
WebSocket-based real-time messaging in investor-founder channels. Messages appear instantly without refresh.

### Backend Changes
- **Django Channels**: ASGI, WebSocket consumer
- **Channel layer**: InMemoryChannelLayer (dev); use Redis in production
- **WebSocket URL**: `ws://host/ws/channels/{channel_id}/?token=<auth_token>`
- **Auth**: Token passed in query string; validated on connect
- **Consumer**: `profiles.consumers.ChannelChatConsumer` — validates membership, saves to DB, broadcasts to group

### Flow
1. Client opens WebSocket to `ws://{host}/ws/channels/{id}/?token=xxx`
2. Server validates token and channel membership
3. Messages sent via WebSocket are saved to DB and broadcast to all channel members
4. Fallback: REST API still works when WebSocket unavailable

### Frontend Changes
- **useChannelChat** hook (`lib/useChannelChat.js`): Loads initial messages via REST, connects WebSocket, exposes `send`, `messages`, `connected`
- **Channel detail page**: Uses hook; shows "● Real-time" when connected; falls back to REST send when not

### Dependencies
- `channels`
- `daphne` (ASGI server)
- `channels-redis` (optional; for production multi-worker)

### Run with Daphne
```bash
daphne -b 0.0.0.0 -p 8000 main.asgi:application
```
Or `uvicorn` with `--interface asgi` for development.

---

## Phase 4: Family Members

**Status:** ✅ Complete

### Scope
- Family members on profiles: name, photo, link (if on platform), relationship
- Per-section visibility: Everyone | Connections | Only me

### Backend Changes
- **FamilyMember**: user, name, photo, profile_link (FK to CustomUser), relationship (spouse, child, parent, sibling, other)
- **CustomUser**: family_visibility, bio_visibility (everyone | connections | only_me)
- **API**: `/profiles/family-members/` CRUD (scoped to current user)

### Frontend Changes
- **FamilyMemberEditor**: Richer UI — name, relationship, profile link; syncs to API on add/remove
- **Profile settings page** (`/profile/settings`): Bio, family, visibility controls

---

## Phase 5: Feed Algorithm

**Status:** ✅ Complete

### Scope
- Simple relevance algorithm for posts so investors/founders see content relevant to connections and interests.

### Backend Changes
- **CommunityPost**: author, community (optional), content, image, video, category
- **GET /profiles/community-posts/** — list all (chronological)
- **GET /profiles/community-posts/feed/** — relevance-ordered for authenticated user:
  - +10 if post author is a connected user
  - +5 if post author is in same community
  - +2 if post category matches user's investment_type (investors) or business category (founders)
- **POST /profiles/community-posts/** — create (auth required)

### Frontend Changes
- **PostForm**: Posts to community-posts API; content + optional category
- **PostList**: Fetches from feed when logged in (relevance), else list; shows author link
- **Feed** link in nav when logged in

---

## Phase 6: Events & Pitching Competitions

**Status:** ✅ Complete

### Scope
- Admin-scheduled events; live and upcoming in Events section
- Founders register for slots; investors set reminders
- Admin can tag participants (competition); recording_url when ended
- See **PHASE6_EVENTS.md** for API and models

---

## Phase 7: Creators/Influencers & Micro-Investors

**Status:** ✅ Complete

### Scope
- **InvestmentProfile**: `is_micro_investor`, `is_creator_influencer`, `audience_reach`
- **Deals for creators**: GET `/profiles/investment-requests/deals-for-creators/` — feed of investment requests for creator/influencer investors (relevance by category match)
- Micro-investor flag in place; Reg CF limits to be enforced later (see COMPLIANCE.md)

### Frontend
- **InvestorProfileForm**: Micro-investor and Creator/Influencer checkboxes; audience reach field
- **Deals page** (`/deals`): Deals feed or message to enable creator in profile
- **Deals** link in nav when logged in

### See
- **PHASE7_CREATORS_MICRO_INVESTORS.md** for API and model details

---

## Phase 8: Testimonials, Newsletter & Admin

**Status:** ✅ Complete

### Scope
- **Testimonials**: Admin-curated; visible toggle in Django admin; public list on landing
- **Newsletter**: Contact form (email + message) → ContactMessage; admin views in Django admin
- **Founders/Investors lists**: Admin only (API + frontend)
- **Admin page**: Connected to backend (posts, events, founders, investors, testimonials, messages)
- **Profile [id]**: Loads from `/user/{id}`; edit form for own profile

### See
- **PHASE8_TESTIMONIALS_NEWSLETTER_ADMIN.md** for details
