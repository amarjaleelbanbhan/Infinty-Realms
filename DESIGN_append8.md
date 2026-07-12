
## 19. Milestone 7: Final V1 Polish - Task 1: Player Death & Respawn

**Mechanics:**
- When the player's HP drops to 0, they do not crash or become invulnerable, but instead trigger a death sequence.
- **Death Penalty:** Lose 10% of current gold.
- **Respawn:** Player is teleported back to the starting spawn coordinates (0, 0) and restored to 50% Max HP.
- **Visuals:** A red "YOU DIED" text overlay flashes, and the screen fades to black before fading back in at the spawn point.

**Implementation:**
- In `CombatSystem.ts`, update `takeDamage` (or where damage is applied to the player) to check if `hp <= 0`.
- If dead, trigger a `die()` method in `WorldScene.ts` (and `DungeonScene.ts` if applicable) that pauses input, shows the UI text, handles the penalty in `useGameStore`, and respawns the player.
