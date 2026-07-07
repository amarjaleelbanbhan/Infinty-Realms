# 🌌 Infinity Realms — Grand Master Plan & Technical Roadmap

*A living, procedural sandbox RPG built for the web. Driven by player choice, dynamic ecosystems, magical automation, and the AI Dungeon Master.*

---

## 💡 The Design Philosophy: emergent & Sandbox Play
To create a award-winning RPG, we reject generic clones in favor of a **living simulation** that combines deep mechanical loops. The gameplay is built around **three pillars of emergence**:
1. **The Environment Reacts**: Magic changes behavior based on biomes; ecosystems shift based on player actions (e.g., overhunting).
2. **Magical Automation**: Players build networks to extract, route, and forge elemental materials, turning the wilderness into a production powerhouse.
3. **AI-Driven Storytelling**: The world is not filled with static quests. An AI Dungeon Master and persistent NPC memories shape a narrative unique to every seed.

---

## 🗺️ Step-by-Step Feature Implementation Roadmap

### 📦 Phase 3: Seeded Sandbox Mechanics & Automation (Current focus)

#### 3.1 Procedural Crypts & Dungeons
- **Mechanic**: Convert dungeon entrances into loading triggers for underground maps.
- **Generator**: Use cellular automata to carve organic caves and binary space partitioning (BSP) to build grid-based stone crypts.
- **Gameplay**:
  - Implement locked doors requiring colored keys (Red, Blue, Gold) found on enemies or chests.
  - Spawn unique Biome Bosses guarding regional artifacts.
  - Implement dungeon chests with randomized loot tables.

#### 3.2 Leyline Energy Networks & Golem Logistics
- **Mechanic**: Allow placed Leyline Nodes (collectors, relays, forges) to connect together.
- **Energy Grid**: Relays route magical current back to cities or player Guild Halls.
- **Golem Caravans**: Players construct automated Golems that walk between nodes to transport essence, carrying inventory that must be protected from bandit raids.
- **Arcane Refining**: Build an upgrade shop interface at Arcane Forges allowing players to refine raw essence into legendary gear.

#### 3.3 Dynamic Regional Trade & Scarcity
- **Mechanic**: Prices at city merchants change based on regional supply and scarcity.
- **Pricing Engine**:
  - Iron is cheap in Mountain/Volcano towns but expensive in Desert/Swamp cities.
  - Herbals are cheap in Forests but highly priced in frozen Snow biomes.
  - Merchants keep track of inventory; selling 100 swords to a single merchant crashes the resale value locally, forcing players to run merchant caravans to distant cities.

---

### 🌋 Phase 4: AI Dungeon Master Catalyst & Shared Worlds

#### 4.1 AI Dungeon Master (Emergent Crises)
- **Mechanic**: A background service monitors player metrics (XP rate, clear speed, health safety).
- **Emergent Crises**:
  - **Bandit Seige**: A neighboring city is blockaded by bandits. Merchant prices soar, and quests change to defensive skirmishes.
  - **Abyssal Corruption**: A void rift opens in a forest biome, turning wild animals hostile and blocking leyline transmission until the rift is sealed.
  - **World Storms**: Biome-wide weather events (e.g. Acid Rain, Ice Storms) that modify player stats and spell casting values.

#### 4.2 Shared World Multiplayer Lobby
- **Mechanic**: Replace room-code typing with a public lobby search registry.
- **Multiplayer Hub**:
  - A persistent central town where players can meet, chat, group up, and trade items directly.
  - Group dungeons where monster difficulty scales with player counts.

---

### 🎨 Phase 5: Creator Tools & Modding API

#### 5.1 In-Game Quest & Item Architect
- **Mechanic**: Players can spend Guild Influence to author custom content.
- **AI-Assisted Builder**:
  - Prompt the AI in-game: *"Create a quest about finding a lost sword in a volcanic dungeon guarded by a magma golem."*
  - The AI drafts the quest objectives, dialog, and custom item stats, posting it to the public board for other players in the realm to challenge.
  - Creator players take a percentage tax of gold spent by challengers.

---

## 📈 Award-Winning Quality Checklist
Before declaring a phase complete, verify it meets the following standards:
- [ ] **Aesthetics**: Sleek void theme colors, custom glassmorphic styling, and glowing particle effects on casts.
- [ ] **Controls**: responsive keyboard input (WASD, hotkeys, map shortcuts) and seamless mobile virtual joysticks.
- [ ] **Performance**: 60 FPS rendering in the browser, minimal garbage collection pauses, and low bandwidth usage for socket packets.
- [ ] **Emergence**: The system interacts with other systems (e.g., weather affects combat, combat affects economy).
