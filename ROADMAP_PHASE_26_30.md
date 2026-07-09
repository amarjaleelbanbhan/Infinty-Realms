### ⚖️ Phase 26: Global Economy & Auction House
- **Mechanic**: Players can list items for sale on a global auction house.
- **Implementation**:
  - Add a new `AuctionItem` model in the database.
  - Create REST endpoints to list, buy, and search auctions.
  - Build an Auction House UI in the client where players can browse items using gold.

### ⚔️ Phase 27: Faction Wars & PvP Battlegrounds
- **Mechanic**: Opt-in PvP areas where players fight for faction dominance.
- **Implementation**:
  - Add PvP flagging logic in `WorldScene.ts`.
  - Introduce Faction reputation and capture points in the world.

### 💬 Phase 28: Guild Perks & Social Systems
- **Mechanic**: Deeper social integration.
- **Implementation**:
  - Add an in-game friend list and whisper chat system.
  - Guild leveling system where accumulated guild essence unlocks global buffs for all members.

### 🔨 Phase 29: Advanced Crafting & Professions
- **Mechanic**: Dedicated crafting minigames for gear and potions.
- **Implementation**:
  - Introduce Blacksmithing, Alchemy, and Enchanting skill trees.
  - Add recipe discovery and crafting UI with success/fail rates.

### 🐉 Phase 30: World Boss Events & Server-Wide Raids
- **Mechanic**: Massive bosses that require dozens of players to defeat.
- **Implementation**:
  - Add synchronized server-wide boss spawn events (e.g. The Void Dragon).
  - Implement damage contribution leaderboards for raid loot distribution.
