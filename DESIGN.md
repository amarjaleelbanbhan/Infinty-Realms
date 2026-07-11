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
