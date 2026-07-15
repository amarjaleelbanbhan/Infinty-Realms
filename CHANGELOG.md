# Changelog

Format loosely follows [Keep a Changelog](https://keepachangelog.com/).
Entries before 2026-07-12 were not tracked in this file (see `PROGRESS.md`
for the older, unverified cycle-log history).

## [Unreleased]

### Added
- Dodge rolling (dashing) mechanic in `WorldScene.ts` and `DungeonScene.ts` triggered by the **SHIFT** key on keyboards or a virtual touch button (🏃) on mobile overlays.
- Localized visual cooldown slice overlay on the dodge roll hotbar slot in `HUD.tsx` with top-to-bottom drain animation using CSS `clipPath` and `ir:dash_cast` CustomEvent hooks.
- Invincibility (damage immunity) window during dodge rolling in `CombatSystem.ts`.
- Synthesized custom triangle-wave whoosh sound effect (`soundSystem.playDash`) connecting to the master GainNode.
- Particle trail emission (burst on dash start, trailing dust puffs during dash) for visual juice.
- Dedicated unit tests for the dodge roll state machine (`movementDodge.test.ts`) covering states, speed boost, invincibility, cooldown, and mount dismount behaviour.
- Server-authoritative combat kills/rewards validation (`CombatService.claimKill`).
- Write-through persistence directly writing gold and experience rewards to the database on kill validation.
- Rate-limiting and interval checks (300ms min interval, 60 kills/min cap) to secure kill claims against client-side exploitation.
- Session resume capability in `useGameStore.startSession` that checks for valid player tokens, fetches profile data from `/api/players/me`, and updates the server DB with local progress if resuming on a fresh database.
- Server-side Guild endpoints (`create`, `join`, `leave`, `kick` in `GuildsController` and `GuildsService`) backed by Prisma.
- Client-side Browse Guilds feature, integrating `GuildUI` and `useGuildStore` with server endpoints instead of client-fabricated stubs.
- Unit tests for client-side `combatApi.ts` using Vitest.
- Unit tests for server-side `CombatService` using Jest.

### Fixed
- Diagonal movement feel: implemented sliding collisions in `WorldScene.ts` so the player slides smoothly along walls instead of locking up completely.
- Corrected root `README.md` status table and roadmap checklist to remove false claims and reflect actual progress.
- "Continue" button on Main Menu resetting player level and gold due to `startSession` creating a new guest token and resetting stats unconditionally.
- Removed dead and misleading comment block in `CombatSystem.calculateDamage()`.
- Verified and fixed TypeScript compilation errors in `WorldScene.ts` and `DungeonScene.ts`.

## [0.1.0] - 2026-07-12

### Fixed
- Monorepo build paths for `ai`/`server` workspaces — `npm run dev` and
  `npm run build` could never actually produce a runnable server before
  this (`MODULE_NOT_FOUND` on `dist/main`)
- NestJS circular-dependency and missing-`PrismaModule` errors that
  prevented the server from booting at all, even after the build-path fix
- Movement/speedhacking: server now validates position deltas instead of
  trusting client-claimed positions outright

### Added
- Server-authoritative movement validation (`RoomService.validateMovement`)
  with a `movementRejected` correction event
- Real, socket-relayed P2P trading (request/accept/offer/lock/cancel) —
  replaces a fully client-fabricated fake trading flow
- `TradeRequestPrompt` UI so the *target* of a trade request can actually
  see and accept/decline it
- Jest test infrastructure for the server workspace (previously referenced
  in `package.json` but not installed, `npm test` failed outright)
- `TECH_DEBT.md`, `SECURITY.md`, `TODO.md`, `GAME_DESIGN_BIBLE.md`

### Changed
- `PROGRESS.md` and `ROADMAP.md` rewritten to reflect verified DONE/
  PARTIAL/PLANNED status against actual code, replacing unverified
  self-reported "done" claims
