# DESIGN.md - Infinity Realms

Based on my analysis of the codebase, here is the Phase 1 Design Document adapted for your current project. I have updated the stack to match your actual architecture (Phaser + React) rather than Three.js.

## Game Info
**GAME:** Infinity Realms — A never-ending browser RPG with procedural worlds, AI NPCs, and infinite replayability.
**STACK:** Phaser 3 (WebGL 2D) + React (UI) + Node.js/Socket.io (Server) + TypeScript.
**REPO:** `d:\IR` (main branch)

---

## 1. Core Loop
- **Win/Lose Conditions:** Endless progression. Players level up, gather gold/resources, and upgrade gear. "Lose" condition is dying, which respawns the player at a safe zone or resets current progress.
- **Controls:** Point-and-click or WASD movement (handled by Phaser), with React-based UI overlays for actions (Inventory, Skills, Shop, Guild, etc.).
- **Camera Type:** Top-down 2D orthographic view (Phaser camera following the player).

## 2. Game Mechanics
- **Procedural Generation:** 
  - *Trigger:* Starting the game / changing zones.
  - *Effect:* Generates a unique world seed using simplex-noise.
- **Combat & Skills:**
  - *Trigger:* Engaging an enemy or pressing hotbar keys (1-5).
  - *Effect:* Casts spells (e.g., Attack, Heal, Block) using mana, reducing enemy HP. Awards XP/Gold on kill.
- **Economy & Trading (Auction House / Merchant):**
  - *Trigger:* Opening Merchant UI or Auction House.
  - *Effect:* Buy/sell items, equipment, and resources for Gold.
- **Housing & Guilds:**
  - *Trigger:* Interacting with specific NPCs or UI buttons.
  - *Effect:* Allows players to customize personal spaces or join alliances.

## 3. Screens/UI States (React Overlay)
- **Start / Main Menu:** "New Adventure", "Continue", "Multiplayer", Class Selection.
- **Playing (HUD):** Top-left player stats (HP, MP, XP, Gold), bottom-center Hotbar, bottom-left Chat, right-side Event Banner/Leyline.
- **Modals (In-Game):** Inventory, Quest Log, Dialogue, Merchant, Auction House, Crafting, Skill Tree, Guild, Housing.
- **Pause/Settings:** Audio, Graphics, Keybinds.

## 4. UI Wireframe (Playing State)
```text
+--------------------------------------------------+
| [Portrait/Stats]                                 |
| HP: ||||||||||      [Event Banner/Notifications] |
| MP: ||||||||||                                   |
| XP: ||||||||||                                   |
| Gold: 150                                        |
|                                                  |
|                                        [Action   |
|                                         Menu]    |
|                                                  |
| [Chat / Console]    [ 1 | 2 | 3 | 4 | 5 ]        |
+--------------------------------------------------+
```

## 5. Scene Setup
- **Environment:** 2D Tilemap rendered via Phaser. Base layers for ground/water, collision layers for walls/trees, and foreground layers for overhead elements.
- **Lighting:** Ambient tinting based on time-of-day (if implemented), or basic flat 2D lighting.
- **Camera Rig:** `this.cameras.main.startFollow(player, true, 0.05, 0.05)`.

## 6. Entities List
- **Player:**
  - *Properties:* HP, MP, Speed, Level, Class (Warrior/Mage/Rogue/Ranger), Inventory.
  - *Sprite:* 2D character sprite sheet with walking/attacking animations.
- **Enemies:**
  - *Properties:* Aggro radius, HP, Damage, Loot table.
  - *Sprite:* Monster sprites (e.g., slimes, goblins, dragons).
- **NPCs:**
  - *Properties:* Dialogue trees, Shop inventory, Quest markers.
  - *Sprite:* Static or idle-animated humanoid sprites.
- **Items:**
  - *Properties:* Rarity, Stat bonuses, Type (Consumable, Equipment).

## 7. Asset List
- **Images:** Tilemaps (`tiles.png`), Character sprites (`hero.png`), Enemy sprites, UI Icons (lucide-react).
- **Audio:** BGM for Main Menu, Overworld, Combat. SFX for attacks, UI clicks, leveling up.

## 8. File/Module Architecture
- `client/src/App.tsx`: Root React component, Modal Manager.
- `client/src/ui/`: React components for all UI (HUD, Menus, Inventory).
- `client/src/game/`: Phaser game logic.
  - `PhaserGame.ts`: Game initialization.
  - `scenes/`: MainScene, Preloader.
  - `systems/`: Movement, Combat, EventSystem, SaveSystem.
- `client/src/stores/`: Zustand state management (UI, Game, Player state).
- `server/`: Node.js backend for multiplayer/sync.
- `shared/`: Types and interfaces shared between client/server.

## 9. Feature Breakdown (Next Implementation Tasks)
*Since the core scaffolding is done, here are the next logical tasks to build out the game based on current architecture:*

1. **Task 1: Implement World Interaction System** - Allow player to click on specific tiles/objects to trigger events (e.g., harvesting nodes).
2. **Task 2: Integrate Multiplayer Sync** - Connect the client movement to the Node.js server via socket.io to see other players.
3. **Task 3: Implement Combat Engine** - Hook up the React hotbar buttons (1-5) to actual Phaser combat events and animations.
4. **Task 4: AI NPC Integration** - Connect the `ai` workspace to dynamically generate dialogue for NPCs when interacted with.
9. **Task 5: Save/Load Polish** - Ensure all inventory and world state persists flawlessly across sessions.

---

## 10. Milestone 4: Dungeons & Bosses - Procedural Dungeons

**Mechanics:**
- Dungeons are instanced zones separate from the main overworld.
- A dungeon consists of interconnected rooms (Entrance, Hallways, Enemy Rooms, Boss Room, Treasure Room).
- *Trigger*: Player clicks on a "Dungeon Entrance" tile or NPC in the overworld.
- *Effect*: Transitions the Phaser scene to a `DungeonScene`. The server generates a dungeon seed and room layout.
- The player navigates through rooms, clearing enemies. The doors to the next room unlock only when all enemies in the current room are defeated.
- The final room contains a Boss entity and high-tier loot.

**Data Model:**
- Expand the existing `DungeonState` in `shared/types`.
- Rooms have: `x`, `y`, `width`, `height`, `type` ('entrance', 'combat', 'boss', 'treasure'), `cleared: boolean`, `doors: string[]` (North, South, East, West).
- The Server keeps track of the dungeon instance and handles multiplayer synchronization if the player is in a party.

**UI:**
- **Dungeon Entry Modal:** Shows recommended level, party members, and an "Enter Dungeon" button.
- **Dungeon HUD:** Overlays a mini-map showing visited rooms and the current room.
- **Victory/Defeat Screen:** Shows summary of loot and XP upon clearing the boss, or prompts a respawn if the player dies.
 
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

## 12. Milestone 4: Dungeons & Bosses - Task 3: Party System

**Mechanics:**
- Players can invite other players to a Party.
- Max party size: 4.
- Party members share experience points (EXP) and gold drops if they are in the same map/dungeon.
- Party members can enter the same instanced dungeon together.
- Party chat channel for communication.

**Data Model:**
- Server-side `PartyService` tracking `Party` objects (`id`, `leaderId`, `members: string[]`).
- Client-side `usePartyStore` state containing current party details.

**UI:**
- **Party Frame UI:** Displays member names, HP/MP bars, and level on the side of the screen.
- **Party Context Menu:** Right-click a player to "Invite to Party".
- **Party Management Modal:** Shows current members, allow leader to kick, or members to leave.
## 13. Milestone 5: Player Housing & Life Skills - Task 1: Farming & Agriculture

**Mechanics:**
- Players can plant crops on specific "dirt" tiles in the world or in their personal housing instance.
- **Planting:** Selecting a 'seed' item from the inventory/hotbar and clicking a valid dirt tile plants the seed.
- **Growth Cycle:** Crops grow over real-time (accelerated for testing) through 3 stages: `seed` -> `growing` -> `mature`.
- **Harvesting:** Clicking on a `mature` crop harvests it, yielding crop items and occasionally seeds, then returning the plot to `empty`.

**Data Model:**
- Create `useFarmStore` to track farm plots.
- `FarmPlot` interface: `{ id, x, y, seedItemId, plantedAt, state: 'empty' | 'seed' | 'growing' | 'mature' }`.

**UI & Visuals:**
- **Tile Highlight:** Hovering over a valid dirt tile with a seed selected shows a green placement highlight.
- **Crop Sprites:** The `WorldScene` renders crop sprites on top of the soil, updating their visual frame based on the crop's state (seed sprout, growing plant, fully grown).

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

## 15. Milestone 5: Economy & Guilds - Task 3: Marketplace UI and Trading

**Mechanics:**
- The world economy is driven by a Marketplace where players can buy and sell items for Gold.
- Interacting with specific Merchant NPCs (or a global market hotkey) opens the Marketplace.
- **Buying:** Players can spend Gold to purchase items (weapons, armor, seeds).
- **Selling:** Players can sell items from their inventory to gain Gold.

**Data Model:**
- Create `useMarketStore.ts` to manage market state (`isOpen`, `marketItems`, `openMarket()`, `closeMarket()`).
- Implement `buyItem(itemId, price)` and `sellItem(itemId, price, quantity)`.

**UI & Visuals:**
- **Marketplace UI:** A React modal (`MarketplaceUI.tsx`) featuring a split-pane layout:
  - Left Pane: Items available for purchase (with icons and prices).
  - Right Pane: Player's current inventory available to sell.
- Use the existing `premium-glass` styles.
- Add an 'M' keybind or a button in the HUD/Dialogue to open the market.
