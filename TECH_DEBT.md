# Technical Debt Report

Generated from the Phase 0 Truth Pass (2026-07-12). Reflects actual code
state, not documentation claims. See `SECURITY.md` for security-specific
items and `GAME_DESIGN_BIBLE.md` for the full critical review.

## Fixed this pass

- Monorepo build paths (`ai`/`server` never produced runnable `dist` output)
- NestJS circular-dependency and missing-`PrismaModule` DI errors (server
  never actually booted before this)
- No test infrastructure for server (jest referenced but not installed)
- No server-side movement validation (now: `RoomService.validateMovement`)
- Trading was 100% client-fabricated (now: real socket relay, and trade
  *completion* is now a server-authoritative Prisma transaction via
  `TradeService`, not client-applied — see `SECURITY.md`)
- CI ran typecheck+build but never tests (`.github/workflows/ci.yml`
  existed, this was a genuine gap, corrected — the earlier version of this
  report incorrectly said "no CI" existed at all; it did, just without a
  test step). Added client test infrastructure (vitest, since none existed
  for the client workspace at all before this).

## Outstanding

### Foundation-blocking (Phase 1)
- **Combat has zero server authority.** `CombatSystem.ts` computes damage
  entirely client-side against client-only Enemy sprites; there is no
  shared server-side enemy state at all. Making this real requires
  inventing server-side enemy simulation, not just adding a validation
  check — a materially bigger effort than the movement-validation fix, not
  attempted this pass.
- **Persistence is client-trusted and delayed.** `SaveSystem` writes to
  localStorage as the source of truth and pushes to the server every 60s
  with the client's full computed player object. Server restart or crash
  mid-session loses anything not yet flushed. The one server-side check
  (gold/XP-rate heuristic in `players.service.ts`) only logs a warning and
  silently drops the field — it doesn't reject the request or flag the
  account.

### Known-fake features not yet addressed
- **Party invites are still fake** (`PartyContextMenu.tsx` `handleInvite`)
  — the inviter's client fabricates party membership locally with no
  socket round-trip and no consent from the invitee. Same category of bug
  as the trading system was before this pass; not fixed yet.
- Guilds, citadel sieges, leyline automation, NPC memory, ecosystem
  cascade, and most of `IDEAS.md`/old `ROADMAP.md` content exist only as
  documentation — no corresponding code was found anywhere in the repo.

### Architecture
- Single in-memory NestJS process — `RoomService` uses plain `Map`s, no
  Redis, no horizontal scaling. Fine for the current player count (likely
  zero in production), a real constraint once/if that changes.
- `AI_PROVIDER=mock` is the shipped default in both `.env` files; every
  non-mock provider path also silently falls back to mock on any error, so
  "AI-generated" content is 100% template-based in the default
  configuration.

### Minor / cosmetic
- `server/src/main.ts`'s startup log prints the wrong port under some
  environments where an ambient `PORT` env var is set for a different
  process (observed in this session's preview harness; may or may not
  reproduce for a normal `npm run dev` on a developer machine with no
  ambient `PORT` set — not confirmed as a real deployment-time bug, flagged
  for awareness).
- `shared/package.json`'s `main`/`types` fields point at `dist/index.js`,
  which doesn't exist (only `dist/types/index.js` does, since `shared/`'s
  `include` only covers `types/**/*.ts`). Harmless today because nothing
  imports the bare `@infinity-realms/shared` specifier, but a latent trap
  for future code that does.
