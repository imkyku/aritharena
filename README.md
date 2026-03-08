# Arithmetic Arena Bot

Production-oriented Telegram Mini App PvP arithmetic game with server-authoritative realtime gameplay.

## Monorepo Structure

```text
.
+- apps/
¦  +- api/                    # NestJS backend (auth, matchmaking, matches, ratings, leaderboard)
¦  L- web/                    # React + Vite Telegram Mini App client
+- packages/
¦  +- shared/                 # Shared contracts + bigint-safe game engine helpers
¦  L- config/                 # Reusable tsconfig/eslint config package
+- docker/
¦  L- nginx/                  # Reverse proxy and static web nginx configs
+- .github/workflows/         # CI pipeline
+- docker-compose.yml         # Local multi-service environment
L- README.md
```

## Architecture

### Server-authoritative gameplay
- Client sends only operation intents (`type`, `operand`, `seq`, `matchId`).
- Backend validates:
  - operation ranges/costs
  - exact division
  - non-negative results
  - max 18-digit result guard
  - sequence freshness/idempotency
  - available elixir (lazy regeneration)
- Backend applies changes with BigInt and broadcasts authoritative `match:state`.

### Identity and auth
- Telegram Mini App `initData` is validated on backend (`HMAC-SHA256`, hash check, age check).
- JWT session is issued only after successful Telegram validation.
- Socket handshake requires authenticated JWT.

### Persistence and state
- MongoDB stores users/ratings/matches/moves/snapshots/seasons/audit.
- Redis stores ephemeral queue and runtime match state cache.
- Final match resolution + rating updates are persisted transactionally for ranked matches.

### Locales
- Main locale: Russian (`ru`)
- Additional locale: English (`en`)

## Core Features Implemented
- Telegram bootstrap and auth flow
- Ranked matchmaking via Redis queue
- Friendly invite codes
- Realtime Socket.IO match flow
- Elixir system and operation cost logic
- Timeout closest-distance resolution + draw handling
- Elo-like rating updates
- Match history and leaderboard APIs/UI
- Reconnect-ready runtime state join/resume
- Structured JSON logger + audit trail
- Docker + Nginx + CI + tests scaffolding

## API Endpoints
- `POST /auth/telegram`
- `GET /me`
- `GET /me/history`
- `GET /leaderboard`
- `POST /friend-matches`
- `POST /friend-matches/:code/join`
- `GET /matches/:id`
- `GET /health`

## Socket Events
Client -> Server:
- `matchmaking:join`
- `matchmaking:leave`
- `match:join`
- `match:operation`
- `match:ping`
- `match:surrender`
- `friendmatch:create`
- `friendmatch:join`

Server -> Client:
- `matchmaking:queued`
- `matchmaking:matched`
- `match:state`
- `match:event`
- `match:error`
- `match:finished`
- `system:notice`

## Local Development

### 1) Prerequisites
- Node.js 22+
- pnpm 10+
- Docker + Docker Compose

### 2) Install
```bash
pnpm install
```

### 3) Configure env files
```bash
cp apps/api/.env.development.example apps/api/.env
cp apps/web/.env.development.example apps/web/.env
```

### 4) Run services (Mongo/Redis/API/Web)
```bash
docker compose up --build
```

### 5) Access
- Web: `http://localhost:5173`
- API: `http://localhost:3000`
- Optional Nginx profile: `docker compose --profile with-nginx up --build`

## Mock Telegram mode (local)
For local browser testing (outside Telegram):
- Set `ALLOW_DEV_TELEGRAM_BYPASS=true` in API env.
- Set `VITE_DEV_INIT_DATA=dev:<telegramId>:<firstName>:<username>` in web env.
- Example: `dev:900000001:Local:local_user`

## Quality and Testing
- Lint: `pnpm lint`
- Unit tests: `pnpm test`
- API tests: `pnpm --filter @arena/api test`
- Web tests: `pnpm --filter @arena/web test`
- E2E smoke: `pnpm --filter @arena/web test:e2e`

## Deployment Notes
- Run API and web behind Nginx (WebSocket upgrade enabled).
- Terminate HTTPS at Nginx/load balancer.
- Keep Mongo/Redis on private network only.
- Enforce secret management via environment variables.
- Use rolling deployments with health checks (`/health`) and graceful shutdown.

## Security Notes
- Never trust user IDs from client payloads.
- Telegram `initData` verification is mandatory in prod.
- Input validation (class-validator + Zod) used for HTTP/socket payloads.
- Rate limiting for HTTP and socket operation bursts.
- Suspicious events can be persisted in `audit_events`.
