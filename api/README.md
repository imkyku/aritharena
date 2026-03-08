# API App (`apps/api`)

NestJS API for Arithmetic Arena:
- Telegram auth bootstrap and init-data validation
- Matchmaking and friend invites
- Authoritative runtime match processing (Socket.IO)
- MongoDB persistence and rating updates

## Run

```bash
pnpm --filter @arena/api start:dev
```

## Seed data

```bash
pnpm --filter @arena/api seed
```
