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
- Anti-cheat gold/XP heuristic in `players.service.ts` used to silently
  drop the offending field and still return success. Now rejects the whole
  save (HTTP 403) and tracks a per-player violation count — see `SECURITY.md`.
- Party invites were 100% fake (auto-accepted locally, no other player
  involved). Now real request/accept/decline relay plus a roster sync —
  see `SECURITY.md`. Leave/kick were also fake (comments said as much
  directly in the old code) and are fixed the same way. Party membership
  is still not server-authoritative — see below.

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
  mid-session loses anything not yet flushed. The anti-cheat check on that
  endpoint now rejects bad deltas outright (see above), but the underlying
  60s-delayed, client-computed save cadence itself is unchanged.
- **Party membership is not server-authoritative.** Invite consent and
  roster sync are now real (see "Fixed this pass"), but there is no
  server-side `PartyService` validating who's actually in which party —
  the roster is composed client-side by whichever client just processed
  an accept/leave/kick and pushed via `partySync`. A modified client could
  still push a fabricated roster to others. Lower risk than the trade/
  combat gaps since party membership isn't directly a currency, but worth
  closing if parties gain gameplay stakes (shared loot rules, instance
  access, etc).

### Known-fake features not yet addressed
- Guilds: CRUD now server-backed (create/join/leave/browse via Prisma + REST). Member roster stored in `bankJson` as a temporary workaround — needs a proper `GuildMember` join table for integrity and querying.
- Guild Wars (`GuildWarService`) exist server-side but have no real client gameplay loop — still PARTIAL.
- Citadel sieges, leyline automation, NPC memory (`memoryJson` column exists, nothing reads/writes it), ecosystem cascade, and most of `IDEAS.md`/old `ROADMAP.md` content remain PLANNED with no corresponding code.

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
- The build-path fix earlier in this pass made `server/tsconfig.json`
  resolve `@infinity-realms/shared/*` against `shared/dist` (compiled
  output) instead of `shared` source, to avoid the outDir-mirroring bug.
  Side effect: editing `shared/types/index.ts` and immediately running the
  server's typecheck/tests sees stale types until `npm run build
  --workspace=shared` is re-run. Hit this directly this pass. Worth a
  `pretypecheck`/`pretest` script in `server/package.json` that rebuilds
  shared automatically, or a `postinstall`/watch-mode setup, if this
  friction recurs often.
