# Phase 3: Real-Time Chat — Setup & Architecture

## Overview
Investor-founder channel messages are delivered in real time via WebSockets. The REST API remains available as a fallback.

## Architecture

```
┌─────────────────┐     WebSocket      ┌──────────────────┐
│  Next.js Client │ ◄─────────────────►│  Daphne (ASGI)   │
│  useChannelChat │   ws/channels/123/  │  ChannelChat     │
└─────────────────┘     ?token=xxx      │  Consumer        │
         │                              └────────┬─────────┘
         │ REST (fallback)                       │
         ▼                                      │ group_send
┌─────────────────┐                    ┌────────▼─────────┐
│  Django REST    │                    │ Channel Layer    │
│  /channel-      │                    │ (InMemory/Redis) │
│  messages/      │                    └────────┬─────────┘
└─────────────────┘                           │
                                               │ broadcast
                                        ┌──────▼──────┐
                                        │ Other       │
                                        │ consumers   │
                                        └─────────────┘
```

## Backend Setup

### 1. Install dependencies
```bash
pip install channels daphne
```

### 2. Run with Daphne (ASGI)
```bash
cd backend/by-the-fruit
daphne -b 0.0.0.0 -p 8000 main.asgi:application
```

For development with auto-reload:
```bash
daphne -b 0.0.0.0 -p 8000 main.asgi:application --verbosity 2
```

### 3. Production: Redis channel layer
For multiple workers or production, use Redis:

```bash
pip install channels-redis
```

In `main/settings.py`:
```python
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {'hosts': [('redis', 6379)]},
    },
}
```

## Frontend Setup

### Environment
Ensure `NEXT_PUBLIC_API_BASE_URL` is set (e.g. `http://localhost:8000`). The WebSocket URL is derived from it:
- `http://localhost:8000` → `ws://localhost:8000`
- `https://api.example.com` → `wss://api.example.com`

### Auth
The WebSocket connects with `?token=<auth_token>`. The token is from `/user/login` (Django Token auth).

## WebSocket Protocol

### Connect
```
ws://{host}/ws/channels/{channel_id}/?token={auth_token}
```

### Send message (client → server)
```json
{"content": "Hello!"}
```

### Receive message (server → client)
```json
{
  "type": "message",
  "id": 42,
  "content": "Hello!",
  "sender_id": 1,
  "sender_name": "John Doe",
  "created_at": "2026-02-22T12:00:00"
}
```

## Close codes
- `4001`: Missing token
- `4002`: Invalid token
- `4003`: Not a channel member
