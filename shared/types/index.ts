// ============================================================
// Infinity Realms — Shared TypeScript Types
// Used by both client (Phaser/React) and server (NestJS)
// ============================================================

// ─── Primitives ───────────────────────────────────────────────

export type Vec2 = { x: number; y: number };

export type UUID = string;

// ─── Biomes ───────────────────────────────────────────────────

export type BiomeType =
  | 'ocean'
  | 'beach'
  | 'plains'
  | 'forest'
  | 'desert'
  | 'snow'
  | 'volcano'
  | 'swamp'
  | 'dungeon';

export interface BiomeConfig {
  type: BiomeType;
  color: number;       // Phaser hex color for procedural tiles
  enemies: string[];   // Enemy types that spawn here
  items: string[];     // Item types that spawn here
  ambient: string;     // Ambient sound key
}

// ─── World ────────────────────────────────────────────────────

export interface WorldTile {
  x: number;
  y: number;
  biome: BiomeType;
  elevation: number;   // 0–1
  moisture: number;    // 0–1
  walkable: boolean;
  structure?: StructureType;
}

export type StructureType = 'city' | 'dungeon' | 'ruin' | 'shrine' | 'cave';

export interface City {
  id: UUID;
  name: string;
  x: number;
  y: number;
  biome: BiomeType;
  population: number;
  prosperity: number;  // 0–100
  destroyed: boolean;
}

export interface WorldState {
  seed: string;
  width: number;
  height: number;
  cities: City[];
  season: Season;
  dayTime: number;     // 0–24
  worldAge: number;    // days elapsed
  biomeDepletion: Record<BiomeType, number>; // 0 (barren) to 100 (healthy)
  farmPlots?: FarmPlot[];
  leylineNodes?: LeylineNode[];
  citadelBuildings?: CitadelBuilding[];
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

// ─── Player ───────────────────────────────────────────────────

export interface PlayerStats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  attack: number;
  defense: number;
  speed: number;
  luck: number;
}

export interface Player {
  id: UUID;
  name: string;
  x: number;
  y: number;
  stats: PlayerStats;
  level: number;
  experience: number;
  gold: number;
  inventory: InventorySlot[];
  equipment: Equipment;
  skills: string[];
  reputation: Record<string, number>;  // cityId → -100..100
  questIds: UUID[];
  titles: string[];
  playtime: number;    // seconds
  worldSeed: string;
  guildId?: UUID;
  ascensions: number;
  godPerks: string[];
  subclass?: SubclassType;
  mount?: MountType;
  isMounted?: boolean;
}

export type SubclassType = 'Necromancer' | 'Paladin' | 'Elementalist' | 'Berserker' | 'Assassin';
export type MountType = 'Horse' | 'Drake' | 'VoidBeast' | 'Wolf';

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  tier: number;
  cost: number; // Skill points required
  prerequisites: string[]; // IDs of required nodes
  icon: string;
}

export interface InventorySlot {
  item: Item;
  quantity: number;
}

export interface Equipment {
  weapon?: Item;
  armor?: Item;
  helmet?: Item;
  accessory?: Item;
}

// ─── Items ────────────────────────────────────────────────────

export type ItemType = 'weapon' | 'armor' | 'helmet' | 'accessory' | 'consumable' | 'quest' | 'material' | 'seed' | 'crop';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Item {
  id: UUID;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  icon: string;        // sprite key
  value: number;       // gold
  stats?: Partial<PlayerStats>;
  effect?: string;     // consumable effect key
  questId?: UUID;
  cropBiome?: BiomeType; // For seeds and crops
}

// ─── Agriculture ──────────────────────────────────────────────

export interface FarmPlot {
  id: UUID;
  x: number;
  y: number;
  plantedAt: number;   // Timestamp
  biome: BiomeType;
  cropType: string;
  ready: boolean;
}

// ─── NPCs ─────────────────────────────────────────────────────

export type NPCPersonality =
  | 'friendly'
  | 'grumpy'
  | 'mysterious'
  | 'cheerful'
  | 'cowardly'
  | 'brave'
  | 'greedy'
  | 'wise';

export type NPCRole =
  | 'merchant'
  | 'quest_giver'
  | 'guard'
  | 'villager'
  | 'innkeeper'
  | 'blacksmith'
  | 'mage'
  | 'healer'
  | 'thief'
  | 'lorebook'
  | 'moderator'
  | 'narrator';

export interface NPC {
  id: UUID;
  name: string;
  role: NPCRole;
  personality: NPCPersonality;
  x: number;
  y: number;
  cityId?: UUID;
  biome: BiomeType;
  mood: number;            // -100 (hostile) to 100 (adoring)
  memory: NPCMemory[];
  dialogueKeys: string[];  // AI-generated dialogue pool
  questIds: UUID[];
  shopInventory?: InventorySlot[];
}

export interface NPCMemory {
  event: string;
  playerId: UUID;
  timestamp: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

// ─── Leyline Automation System (Factorio Twist) ─────────────

export type LeylineNodeType = 'essence_collector' | 'mana_relay' | 'elemental_forge';

export interface LeylineNode {
  id: UUID;
  ownerPlayerId: UUID;
  x: number;
  y: number;
  type: LeylineNodeType;
  biome: BiomeType;
  ratePerMin: number;
  accumulatedEssence: number;
  lastHarvestAt: number;
  connectedNodeIds?: UUID[];
}

// ─── Citadel & Sieges (Phase 7) ───────────────────────────────

export type CitadelStructureType = 'wall' | 'gate' | 'turret' | 'energy_hub' | 'shield';

export interface CitadelBuilding {
  id: UUID;
  guildId: UUID;
  type: CitadelStructureType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  powered: boolean;
}

// ─── Offline & Async PVP (Phase 8) ────────────────────────────

export interface OfflineReport {
  timeOfflineMs: number;
  goldEarned: number;
  expEarned: number;
  essenceEarned: number;
  itemsGathered: { id: string, name: string, quantity: number }[];
}

export interface GhostDuelResult {
  winnerId: UUID;
  log: string[];
  goldWon: number;
  expWon: number;
}

// ─── Godhood (Phase 9) ────────────────────────────────────────

export type GodInterventionType = 'healing_rain' | 'gold_blessing' | 'exp_surge';

export const GOD_PERKS = [
  { id: 'golem_speed', name: 'Alacrity of Stone', desc: 'Golems move 20% faster.' },
  { id: 'offline_double', name: 'Eternal Vigil', desc: 'Offline rewards are doubled.' },
  { id: 'leyline_power', name: 'Arcane Conduit', desc: 'Leyline nodes generate 50% more power.' },
  { id: 'combat_god', name: 'Ares Blessing', desc: 'Base attack +50%.' },
];

// ─── Enemies ──────────────────────────────────────────────────

export type EnemyType =
  | 'goblin'
  | 'orc'
  | 'skeleton'
  | 'wolf'
  | 'dragon'
  | 'bandit'
  | 'ghost'
  | 'golem'
  | 'slime'
  | 'demon';

export type EnemyState = 'idle' | 'patrol' | 'chase' | 'attack' | 'flee' | 'dead';

export interface Enemy {
  id: UUID;
  type: EnemyType;
  name: string;
  x: number;
  y: number;
  stats: PlayerStats;
  state: EnemyState;
  dropTable: DropEntry[];
  experienceReward: number;
  goldReward: number;
  isBoss: boolean;
}

export interface DropEntry {
  item: Partial<Item>;
  chance: number;   // 0–1
}

// ─── Guild System (Phase 3) ───────────────────────────────────

export interface Guild {
  id: UUID;
  name: string;
  tag: string;         // e.g. [LEY]
  leaderId: UUID;
  members: GuildMember[];
  vaultGold: number;
  level: number;
  perks: string[];
}

export interface GuildMember {
  playerId: UUID;
  name: string;
  role: 'leader' | 'officer' | 'member';
  joinedAt: number;
}

// ─── Dungeon System (Phase 3) ─────────────────────────────────

export interface DungeonRoom {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'entrance' | 'hall' | 'boss' | 'treasure';
  cleared: boolean;
}

export interface DungeonState {
  id: UUID;
  seed: string;
  name: string;
  biome: BiomeType;
  rooms: DungeonRoom[];
  bossAlive: boolean;
  grid?: number[][];
}

// ─── Marketplace System (Phase 4) ─────────────────────────────

export interface MarketListing {
  id: UUID;
  sellerId: UUID;
  sellerName: string;
  item: Item;
  quantity: number;
  pricePerUnit: number;
  createdAt: number;
}

// ─── Settings & Accessibility (Phase 5) ───────────────────────

export interface GameSettings {
  colorblindMode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
  lowEndMode: boolean;
  musicVolume: number;
  sfxVolume: number;
  showMinimap: boolean;
}

// ─── Quests ───────────────────────────────────────────────────

export type QuestType = 'kill' | 'collect' | 'escort' | 'explore' | 'deliver' | 'mystery' | 'boss';

export type QuestStatus = 'available' | 'active' | 'completed' | 'failed' | 'expired';

export interface QuestObjective {
  description: string;
  targetType: 'enemy' | 'item' | 'location' | 'npc';
  targetId: string;
  quantity: number;
  current: number;
}

export interface Quest {
  id: UUID;
  title: string;
  description: string;
  type: QuestType;
  giverNpcId?: UUID;
  objectives: QuestObjective[];
  rewards: QuestReward;
  status: QuestStatus;
  expiresAt?: number;
  worldEvent?: WorldEvent;
  lore: string;         // AI-generated backstory
  aiGenerated: boolean;
}

export interface QuestReward {
  experience: number;
  gold: number;
  items: Partial<Item>[];
  reputationChanges?: Record<string, number>;
  worldChange?: string;
}

// ─── World Events ─────────────────────────────────────────────

export type WorldEventType =
  | 'meteor_strike'
  | 'dragon_attack'
  | 'lost_civilization'
  | 'portal_opens'
  | 'time_anomaly'
  | 'black_market'
  | 'treasure_convoy'
  | 'plague'
  | 'festival'
  | 'war'
  | 'arcane_aurora';

export interface WorldEvent {
  id: UUID;
  type: WorldEventType;
  title: string;
  description: string;
  x?: number;
  y?: number;
  radius?: number;
  startsAt?: number;
  endsAt?: number;
  startTime: number;
  duration: number;
  effects: string;
  rewards: string;
  active?: boolean;
  participants?: UUID[];
}

// ─── Weather ──────────────────────────────────────────────────

export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog' | 'heat' | 'blizzard';

export interface Weather {
  type: WeatherType;
  intensity: number;   // 0–1
  duration: number;    // seconds
  effects: WeatherEffect[];
}

export interface WeatherEffect {
  stat: keyof PlayerStats;
  modifier: number;    // multiplier
}

// ─── Multiplayer (Phase 2) ────────────────────────────────────

export interface GameRoom {
  id: string;          // 4+4 code e.g. "ABCD-93KF"
  hostPlayerId: UUID;
  playerIds: UUID[];
  maxPlayers: number;
  isPublic: boolean;
  worldSeed: string;
  createdAt: number;
}

// ─── Socket Events (Phase 2) ──────────────────────────────────

export type ServerToClientEvents = {
  playerJoined: (player: Partial<Player>) => void;
  playerLeft: (playerId: UUID) => void;
  playerMoved: (data: { id: UUID; x: number; y: number }) => void;
  worldEvent: (event: WorldEvent) => void;
  chatMessage: (msg: ChatMessage) => void;
};

export type ClientToServerEvents = {
  move: (pos: Vec2) => void;
  attack: (targetId: UUID) => void;
  interact: (npcId: UUID) => void;
  chat: (message: string) => void;
  joinRoom: (roomCode: string) => void;
  createRoom: () => void;
};

export interface ChatMessage {
  playerId: UUID;
  playerName: string;
  message: string;
  timestamp: number;
  channel: 'world' | 'local' | 'party';
}

// ─── AI Generation Requests ───────────────────────────────────

export interface QuestGenerationRequest {
  worldSeed: string;
  biome: BiomeType;
  season: Season;
  playerLevel: number;
  nearbyNpcName?: string;
  recentEvents?: string[];
  prompt?: string;
}

export interface ItemGenerationRequest {
  prompt: string;
  creatorLevel: number;
}

export interface NPCGenerationRequest {
  role: NPCRole;
  biome: BiomeType;
  cityName?: string;
  worldAge: number;
}

export interface EventGenerationRequest {
  worldSeed: string;
  season: Season;
  worldAge: number;
  currentPlayerCount: number;
}

export interface DialogueGenerationRequest {
  npcName: string;
  npcRole: NPCRole;
  personality: string;
  playerMessage: string;
  memory: string[];
}

// ─── Save State ───────────────────────────────────────────────

export interface SaveState {
  version: string;
  savedAt: number;
  player: Player;
  world: WorldState;
  activeQuests: Quest[];
  discoveredCities: UUID[];
  defeatedBosses: UUID[];
  playtime: number;
}
