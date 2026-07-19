# Infinity Realms — Roadmap

> Supersedes the previous "Grand Master Plan" phase numbering in this file.
> That content (leyline automation, citadel sieges, pet taming, etc.) is
> preserved at the bottom as a **deferred backlog** — genuinely interesting
> ideas, not started, not to be worked on until Phases 0-2 below are real.
> See `GAME_DESIGN_BIBLE.md` for the full critique of why that backlog was
> cut from the near-term plan.

Status legend: **DONE** (implemented, tested, verified) · **PARTIAL**
(implemented with a stated known gap) · **PLANNED** (not started). No phase
starts before the previous one reaches at least PARTIAL with no boot-blocking
gaps.

---

## Phase 0 — Truth Pass
**Status: DONE**

Audited the actual codebase against README/PROGRESS.md claims. Found the
server never booted (build + DI errors), trading was 100% fake, movement/
combat had no server validation, zero automated tests existed. Full findings
in `GAME_DESIGN_BIBLE.md`, `TECH_DEBT.md`, `SECURITY.md`.

## Phase 1 — Foundation
**Status: DONE**

| Item | Status |
|---|---|
| Fix monorepo build paths so `npm run dev`/`npm run build` actually work | DONE |
| Fix NestJS DI errors preventing server boot | DONE |
| Server test infrastructure (jest) | DONE |
| Server-authoritative movement validation | DONE |
| Real (socket-relayed) P2P trading, server-authoritative completion | DONE |
| Server-authoritative combat | DONE — validated kill rewards (XP/gold) with spam/rate guards |
| Inventory validation | DONE — fully server-authoritative for equip/unequip/consume/shop/harvest |
| Real persistence-on-write (currently 60s client-trusted push) | DONE — write-through for combat/shop/inventory/guild actions; client cannot bypass via saveState |
| CI (typecheck + test on every push) | DONE — CI already ran typecheck+build; added the missing test step |
| Client-side test infrastructure | DONE (vitest) |
| Anti-cheat rejects (not silently drops) gold/XP violations | DONE |
| Real party invite consent + roster sync (leave/kick included) | DONE — not yet server-authoritative membership |
| Guild CRUD (create/join/leave/browse) backed by server | DONE — member roster not yet a separate table (stored in bankJson) |

## Phase 2 — Core Gameplay
**Status: DONE**

Biome-reactive magic grimoire (DONE), diagonal sliding movement feel (DONE), active dodge rolling & invincibility window (DONE), equipment stats & effective stats system (DONE), skill casting dispatch & scene damage integration (DONE), weighted loot tables & automatic inventory pickup (DONE), recipe-based crafting & material consumption (DONE), quest objective kill/collect progression tracking (DONE).

## Phase 3 — World
**Status: PLANNED**

Procedural generation is already the strongest existing subsystem (real
simplex-noise/biome/Poisson pipeline) — this phase deepens it: cities,
villages, weather, day/night, exploration, hidden locations, events.

## Phase 4 — AI
**Status: PLANNED**

Replace mock-by-default with real NPC memory, AI dialogue/quests/rumors/
books/merchants/companions, with an explicit offline fallback (not the
current "silently falls back to mock on any error" behavior). `AI_PROVIDER`
currently defaults to `mock` in both `.env` files — flip this only once a
real provider path is verified end-to-end, not before.

## Phase 5 — Multiplayer
**Status: PLANNED** (builds on Phase 1's trading/movement foundation)

Real trading is PARTIAL from Phase 1. This phase adds: guilds, party sync,
server reconciliation, chat moderation, cross-session persistence.

## Phase 6 — Living World
**Status: PLANNED**

NPC schedules, economy, relationships, factions, wars, ecosystems, dynamic
events, history, reputation. The ecosystem-cascade idea from the old
backlog belongs here — pick it as the *first* living-world system, finish
it, then move to the next one at a time (not all simultaneously).

## Phase 7 — Creator Platform
**Status: PLANNED**

Visual/quest/dungeon/NPC editors, plugin API, mod support, asset pipeline.
Do not start until Phases 1-2 have real, retained players — building a
creator platform before there are creators to use it is the most common way
small teams burn runway on unused infrastructure.

## Phase 8 — Infinite Game
**Status: PLANNED, aspirational**

Player-driven economy, politics, kingdoms, player cities, legendary events,
global history, seasonal content, AI world evolution. Long-horizon vision,
not a near-term commitment.

---

## Deferred Backlog (from the old roadmap — not started, not scheduled)

These are preserved because some are genuinely good ideas, not because
they're next in line. Each needs to be picked up **one at a time** inside
Phase 6, fully finished and server-validated, before the next is started.

- Leyline energy networks / golem logistics (Factorio-inspired automation) — cut from near-term plan; see GAME_DESIGN_BIBLE.md §3 for why
- Guild citadels & siege defenses — cut; this is a separate game bolted onto an unrelated RPG at current team scale
- Dynamic regional trade & scarcity pricing engine
- Ecosystem cascade (overhunting -> refugees -> quests) — **recommended first pick** for Phase 6, cheapest to prototype and most original
- Pet/mount taming, breeding, runic mutations — cut; full system on its own
- Legendary relic forging, custom spell grimoire
- Realm ascension trials, seasonal server-wide resets
- In-game AI quest/dungeon architect with creator revenue share — premature before Phase 7 has real creators
