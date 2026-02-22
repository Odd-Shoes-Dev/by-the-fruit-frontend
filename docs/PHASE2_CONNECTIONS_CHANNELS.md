# Phase 2: Connections & Channels

## Overview
Investor–founder connection flow: Interested → Connect → mutual acceptance → private channel. Channels have messages and progress updates.

## Models
- **Connection**: investor, founder, status (interested | connect_pending | connected | rejected)
- **Channel**: Created when connection accepted; founder + investor
- **ChannelMember**: Roles (founder, investor, member); invite-only for others
- **ChannelProgressUpdate**, **ChannelMessage**

## API Summary
| Area | Endpoints |
|------|-----------|
| Connections | GET/POST connections, POST interested/, connect/, {id}/accept/, reject/, interested-in-me/, pending-for-me/ |
| Channels | CRUD channels, invite, accept-invite, remove-member |
| Messages / updates | channel-messages/, channel-progress/ |
| Founders | GET /profiles/founders/ |

## Frontend
- ConnectionButtons (Interested / Connect on founder cards)
- Login → real API, token storage
- /connections, /channels, /channels/[id]
- lib/api.js (token, apiFetch)
