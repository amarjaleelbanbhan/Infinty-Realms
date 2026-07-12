
## 18. Milestone 6: Launch Readiness - Task 3: Anti-Cheat & Performance Monitor

**Mechanics:**
- Final launch polish with basic security and monitoring.
- **Anti-Cheat:** Basic client-side speedhack detection (mocking what a server would do). Validates player position delta over time and flags impossible movements.
- **Performance Monitor:** A HUD overlay displaying FPS, Ping, and Memory usage.

**Implementation:**
- Create `AntiCheatSystem.ts` to hook into `WorldScene.ts` update loop and validate `(dx, dy) / dt` against `player.stats.speed`.
- Create `PerformanceStats.tsx` component in the HUD overlay, pulling real FPS from `game.loop.actualFps`.
