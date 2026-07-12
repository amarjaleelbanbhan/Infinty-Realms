# Changelog

Format loosely follows [Keep a Changelog](https://keepachangelog.com/).
Entries before 2026-07-12 were not tracked in this file (see `PROGRESS.md`
for the older, unverified cycle-log history).

## [Unreleased]

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
