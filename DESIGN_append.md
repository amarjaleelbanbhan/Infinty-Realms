
## 11. Milestone 4: Dungeons & Bosses - Task 2: Boss Mechanics

**Mechanics:**
- The Boss is a powerful entity at the end of the dungeon (e.g., Dungeon Warden).
- Boss fights feature a multi-phase system based on HP thresholds.
  - **Phase 1 (100% - 60% HP):** Normal melee pursuit and basic attacks.
  - **Phase 2 (60% - 30% HP):** Enrage. Increased attack speed and casts AoE (Area of Effect) ground attacks. Red telegraph circles appear on the floor and explode after a short delay (1.5s), dealing massive damage to the player if they don't dodge.
  - **Phase 3 (30% - 0% HP):** Desperation. Spawns minions (adds) to distract the player, while continuing AoE attacks.
- Bosses are immune to knockback.

**Data Model:**
- Expand `EnemyData` to include `isBoss: boolean`, `phase: number`, and `abilityCooldowns: Record<string, number>`.
- Add `AoEAttack` entities to the Phaser scene which handle telegraphing and damage resolution.

**UI:**
- **Boss Health Bar:** A large, prominent health bar at the top of the screen that appears when the player engages the boss. It shows the Boss name, current Phase, and HP percentage. (Added to `DungeonHUD`).
