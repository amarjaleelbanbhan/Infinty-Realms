# TODO

Prioritized task board. Reflects `ROADMAP.md` Phase 1 (Foundation) state as
of 2026-07-12. Nothing here is scheduled beyond Phase 1 until Phase 1 is
fully DONE — see the "Foundation-blocking" rule in `ROADMAP.md`.

## Must Have (finishes Phase 1)
- [x] Server-authoritative trade completion (DB transaction via `TradeService`)
- [ ] Server-side combat/enemy authority (needs a design pass first — no
      shared server-side enemy state exists at all today)
- [ ] Inventory validation server-side
- [ ] From-the-UI two-browser trade verification (console-harness result
      was inconclusive this pass, see `PROGRESS.md` 2026-07-12 20:45 entry)
- [x] CI: run typecheck + test on every push (CI already existed for
      typecheck+build; added the missing test step)
- [x] Client-side test infrastructure (vitest, paired with existing Vite config)
- [ ] Real persistence-on-write, not a 60s client-trusted push
- [x] Reject (not just warn-and-log) anti-cheat violations in `players.service.ts`

## Should Have (Phase 1 hardening / early Phase 5)
- [ ] Real party invite consent flow (same pattern as the trade-request fix)
- [ ] Rotate `JWT_SECRET` before any real deployment
- [ ] Confirm no real secrets ever land in `.env.example`

## Nice to Have (Phase 6, pick ONE at a time — do not start until Phase 1-2 are DONE)
- [ ] Ecosystem cascade (overhunting -> refugees -> quests) — recommended
      first pick, cheapest to prototype, most original idea in the backlog
- [ ] Seasonal world events
- [ ] Player housing polish

## Future Expansion (Phase 7-8, do not build yet)
- [ ] Creator/modding marketplace
- [ ] Guild citadel sieges
- [ ] Pet taming/breeding
- [ ] AI-authored quest marketplace with revenue share

## Remove / already cut (do not re-add without re-justifying from first principles)
- [ ] Any GTA6/RDR2/Cyberpunk competitive framing in marketing docs
- [ ] Golem/Factorio-style automation as previously scoped
- [ ] README "✅" claims for anything not actually verified (audit the rest
      of the README against Phase 0 findings — not yet fully done)
