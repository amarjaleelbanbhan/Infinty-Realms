# Security Report

Generated from the Phase 0 Truth Pass (2026-07-12). This is an internal
engineering security assessment, not a responsible-disclosure policy
document. See `TECH_DEBT.md` for non-security debt and `GAME_DESIGN_BIBLE.md`
for the full critique.

## Fixed this pass

- **Movement/speedhacking**: `GameGateway.handleMove` previously
  re-broadcast any client-claimed position with zero validation — trivially
  exploitable via devtools for teleport or speed hacks, and other players
  would see the falsified position too. `RoomService.validateMovement` now
  tracks each player's last known-good position server-side and rejects
  updates implying an impossible speed (19 tests cover this).
- **Fake trading was itself a trust problem**: the previous "trading"
  system wasn't actually multiplayer at all (auto-accepted fake requests,
  a fabricated fake partner), so it wasn't exploitable in the traditional
  sense, but it also meant nothing about the trade UI could be trusted to
  reflect real player-to-player state. Now real socket-relayed.
- **Client-authoritative trade completion (was High severity)**: each
  client used to apply its own gold/inventory deltas locally once both
  sides reported "locked." `TradeService` now executes the trade itself in
  a single Prisma transaction once both sides lock, validating each side's
  *persisted* gold/inventory actually covers what they offered before
  mutating anything, and pushes the authoritative result back to both
  clients (10 tests cover valid trades, insufficient gold/items, and
  replay-after-completion).
- **Weak gold/XP anti-cheat (was Medium severity)**: `players.service.ts`'s
  rate-of-change heuristic used to only log a warning and silently drop the
  offending field, still returning success — no signal to the client, no
  record kept. `saveState` now throws (HTTP 403) and rejects the whole save
  on a violation, and tracks a per-player violation count so repeat
  offenders are distinguishable from a one-off legitimate spike (7 tests).

## Known vulnerabilities (not fixed this pass)

| Issue | Severity | Detail |
|---|---|---|
| No server-side combat authority | High | Damage/HP is computed entirely client-side against client-only enemies. A modified client can claim arbitrary kills/loot/XP with nothing to check it. |
| Client-trusted persistence | Medium | `SaveSystem` treats localStorage as the source of truth and pushes to the server every 60s. Between pushes, the server has no ground truth at all. |
| Party invites still fully fake | Medium | No socket round-trip, no consent — the same trust-model gap trading had before this pass, not yet fixed for parties. |
| Single in-memory process, no horizontal scaling | Low (today) | Not exploitable per se, but means there's no redundancy — a crash loses all room/socket-registry state instantly. Becomes a real availability concern only at higher player counts. |

## Configuration / secrets hygiene

- `JWT_SECRET` in `.env`/`.env.example` is a placeholder
  (`"change-me-in-production-use-a-long-random-string"`) — confirm this is
  actually rotated before any real deployment; it is **not** rotated as of
  this pass.
- `AI_PROVIDER=mock` by default is not a security issue, but note it here
  since "AI-generated" marketing claims are currently false in the shipped
  configuration — a reputational/legal concern more than a security one
  (see `GAME_DESIGN_BIBLE.md` risk analysis).

## Recommended next steps (priority order)

1. Server-side combat/enemy simulation (bigger effort — needs design first)
2. Real party invite consent flow (same pattern as the trade-request fix)
3. Rotate `JWT_SECRET` and confirm it's excluded from version control in
   any real deployment (currently only `.env` itself is gitignored, not
   `.env.example` — confirm `.env.example` never contains a real secret)
4. Persist violation counts (currently in-memory, resets on restart) if
   repeat-offender tracking needs to survive a deploy
