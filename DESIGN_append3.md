
## 14. Milestone 5: Player Housing & Life Skills - Task 2: Player Housing (Instanced Zones)

**Mechanics:**
- Players have their own private instanced zone (`HouseScene`).
- They can teleport to their house at any time from the overworld using a "Return Home" action.
- The House instance features a safe zone where they can decorate (future task) and farm in peace.
- When they leave the house, they return to their previous location in the overworld.

**Data Model:**
- Create `HouseScene.ts` similar to `DungeonScene.ts` but generating a peaceful static map (a yard and a house sprite).
- Add `returnX` and `returnY` to the GameStore to track where to teleport back to.

**UI:**
- Add a "Home" button to the `HUD` (e.g., in the top right near the Minimap).
- Add an "Exit Home" button that appears when the player is inside the `HouseScene`.
