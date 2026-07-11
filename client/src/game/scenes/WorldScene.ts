// ============================================================
// World Scene — Main game world with tilemap, entities, camera
// ============================================================

import Phaser from 'phaser';
import { generateWorld, BIOME_TILE_COLOR, type GeneratedWorld } from '@game/systems/WorldGenerator';
import { CombatSystem } from '@game/systems/CombatSystem';
import { WeatherSystem } from '@game/systems/WeatherSystem';
import { saveSystem } from '@game/systems/SaveSystem';
import { questSystem } from '@game/systems/QuestSystem';
import { soundSystem } from '@game/systems/SoundSystem';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';
import { useSkillStore } from '@game/systems/SkillSystem';
import { socketManager } from '@game/systems/SocketManager';
import { leylineSystem } from '@game/systems/LeylineSystem';
import { farmingSystem } from '@game/systems/FarmingSystem';
import { citadelSystem } from '@game/systems/CitadelSystem';
import { MountSystem } from '@game/systems/MountSystem';
import type { BiomeType, FarmPlot, CitadelStructureType } from '@shared/types';

const TILE_SIZE = 32;

interface EnemySprite extends Phaser.GameObjects.Container {
  enemyData: {
    id: string;
    type: string;
    hp: number;
    maxHp: number;
    speed: number;
    attack: number;
    defense: number;
    experienceReward: number;
    goldReward: number;
    state: 'idle' | 'patrol' | 'chase' | 'attack' | 'dead';
    patrolOriginX: number;
    patrolOriginY: number;
    patrolTimer: number;
    aggroRange: number;
    attackRange: number;
    attackCooldown: number;
    hpBar?: Phaser.GameObjects.Graphics;
  };
}

interface NPCSprite extends Phaser.GameObjects.Container {
  npcData: {
    id: string;
    name: string;
    role: string;
    personality: string;
    dialogue: string[];
    biome?: string;
  };
}

export class WorldScene extends Phaser.Scene {
  private world!: GeneratedWorld;
  private player!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.GameObjects.Image;
  private playerAttackCooldown = 0;
  private playerDirection: 'up' | 'down' | 'left' | 'right' = 'down';
  private playerInvincible = false;
  private playerMountSprite?: Phaser.GameObjects.Text;

  private enemies: EnemySprite[] = [];
  private npcs: NPCSprite[] = [];
  private items: Phaser.GameObjects.Container[] = [];

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { up: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; };
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private eKey!: Phaser.Input.Keyboard.Key;
  private cKey!: Phaser.Input.Keyboard.Key;
  private iKey!: Phaser.Input.Keyboard.Key;
  private qKey!: Phaser.Input.Keyboard.Key;
  private mKey!: Phaser.Input.Keyboard.Key;  // World map
  private fKey!: Phaser.Input.Keyboard.Key;  // Sprint toggle
  private escKey!: Phaser.Input.Keyboard.Key;

  private isSprinting = false;
  private numberKeys!: Phaser.Input.Keyboard.Key[];
  private remotePlayers = new Map<string, Phaser.GameObjects.Container>();
  private lastSentPos = { x: 0, y: 0 };
  private leylineGraphics!: Phaser.GameObjects.Graphics;
  private nodeSprites = new Map<string, Phaser.GameObjects.Container>();
  private golemCaravans = new Map<string, Phaser.GameObjects.Container>();
  private farmPlotSprites = new Map<string, Phaser.GameObjects.Container>();
  private citadelSprites = new Map<string, Phaser.GameObjects.Container>();
  
  private buildModeActive = false;
  private buildModeType: CitadelStructureType = 'wall';
  private buildModeGuildId = '';
  private handleJoinedBound = this.handleRemotePlayerJoined.bind(this);
  private handleMovedBound = this.handleRemotePlayerMoved.bind(this);
  private handleAttackedBound = this.handleRemotePlayerAttacked.bind(this);
  private handleLeftBound = this.handleRemotePlayerLeft.bind(this);

  private minimap!: Phaser.GameObjects.Graphics;
  private minimapData: Uint32Array = new Uint32Array(0);

  private combatSystem!: CombatSystem;
  private weatherSystem!: WeatherSystem;

  private tileGraphics!: Phaser.GameObjects.Graphics;
  private structureLayer!: Phaser.GameObjects.Container;
  private entityLayer!: Phaser.GameObjects.Container;

  // Mobile joystick state
  private joystickVector = { x: 0, y: 0 };
  private joystickPointer: Phaser.Input.Pointer | null = null;
  private joystickOrigin = { x: 0, y: 0 };

  // Interaction range
  private readonly INTERACT_RANGE = 64;
  private readonly ATTACK_RANGE = 80;
  private returnFromDungeon = false;
  private returnRx = 0;
  private returnRy = 0;

  constructor() {
    super({ key: 'WorldScene' });
  }

  init(data: { seed?: string; returnFromDungeon?: boolean; rx?: number; ry?: number }) {
    const gameStore = useGameStore.getState();
    const seed = data.seed ?? gameStore.worldState?.seed ?? `realm-${Date.now()}`;

    console.log(`[WorldScene] Generating world with seed: ${seed}`);
    this.world = generateWorld(seed, 128, 128);

    this.returnFromDungeon = data.returnFromDungeon ?? false;
    this.returnRx = data.rx ?? 0;
    this.returnRy = data.ry ?? 0;

    this.enemies = [];
    this.npcs = [];
    this.items = [];

    // Expose world data for React UI (WorldMapUI reads this)
    (window as Window & { __worldData?: GeneratedWorld }).__worldData = this.world;
  }

  create() {
    const { width, height } = this.cameras.main;
    const worldPixelW = this.world.width * TILE_SIZE;
    const worldPixelH = this.world.height * TILE_SIZE;

    useUIStore.getState().setScreen('game');

    // ── Systems ──
    this.combatSystem = new CombatSystem(this);
    this.weatherSystem = new WeatherSystem(this);

    // ── Layers ──
    this.tileGraphics = this.add.graphics();
    this.leylineGraphics = this.add.graphics();
    this.structureLayer = this.add.container(0, 0);
    this.entityLayer = this.add.container(0, 0);
    this.nodeSprites.clear();
    this.golemCaravans.clear();

    // ── Draw world tiles ──
    this.drawWorldTiles();

    // ── Spawn player ──
    let spawnX = this.world.spawnX * TILE_SIZE + TILE_SIZE / 2;
    let spawnY = this.world.spawnY * TILE_SIZE + TILE_SIZE / 2;
    if (this.returnFromDungeon) {
      spawnX = this.returnRx;
      spawnY = this.returnRy;
    }
    this.spawnPlayer(spawnX, spawnY);

    // ── Spawn entities near player ──
    this.spawnNearbyEnemies(spawnX, spawnY);
    this.spawnNearbyNPCs(spawnX, spawnY);
    this.spawnNearbyItems(spawnX, spawnY);

    // ── Camera ──
    this.cameras.main.setBounds(0, 0, worldPixelW, worldPixelH);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.2);

    // ── PostFX / Lighting ──
    // Dark Fantasy atmosphere: strong dark vignette, glowing magical bloom
    this.cameras.main.postFX.addVignette(0.5, 0.5, 0.85); // Stronger vignette for mood
    this.cameras.main.postFX.addBloom(0xffffff, 1, 1, 1.2, 1.5); // Softer, more diffuse glow

    // ── Input ──
    this.setupInput();

    // ── Minimap ──
    this.setupMinimap();

    // ── Weather overlay ──
    const weather = this.weatherSystem.getRandomWeather('plains');
    this.weatherSystem.createOverlay(width, height);
    this.weatherSystem.setWeather(weather);

    leylineSystem.onOverload = () => {
      if (this.weatherSystem.getCurrentWeather() !== 'storm') {
        this.weatherSystem.setWeather('storm');
        useUIStore.getState().addToast('Arcane Storm! The Leylines are overloading!', 'error');
        
        // Spawn an empowered void monster near the player as a consequence
        const px = this.player.x;
        const py = this.player.y;
        const voidMonster = this.spawnEnemy({ type: 'orc', hp: 300, speed: 80, attack: 20, defense: 10, exp: 50, gold: 100 }, px + 100, py + 100);
        voidMonster.enemyData.maxHp *= 3;
        voidMonster.enemyData.hp = voidMonster.enemyData.maxHp;
        voidMonster.enemyData.attack *= 2;
        voidMonster.setScale(1.5);
        (voidMonster.list[1] as Phaser.GameObjects.Image).setTint(0x7c6bff); // Purple tint for void
      }
    };

    // ── Audio ──
    soundSystem.playAmbientDrone();

    // ── Auto-save ──
    saveSystem.startAutoSave();

    // ── World tick ──
    this.time.addEvent({
      delay: 60_000,
      loop: true,
      callback: () => {
        saveSystem.save();
      },
    });

    // ── Initial quest sync ──
    this.time.delayedCall(3000, () => {
      questSystem.syncQuests();
    });

    // ── Touch/mobile input ──
    if (useUIStore.getState().isMobile) {
      this.setupTouchInput();
    }

    // ── Multiplayer Setup ──
    this.setupMultiplayerSync();

    // ── Depth sort on update ──
    this.events.on('update', this.depthSort, this);

    // ── Citadel Build Mode ──
    window.addEventListener('ir:citadel_build_mode', this.handleBuildModeEvent);
    window.addEventListener('ir:siege_invasion', this.handleSiegeEvent);
    window.addEventListener('ir:god_intervention_cast', this.handleGodIntervention);

    console.log(`[WorldScene] World ready! Cities: ${this.world.cities.length}`);
  }

  private handleGodIntervention = ((e: CustomEvent) => {
    const { type, casterName } = e.detail;
    
    // Broadcast if in multiplayer, but for now apply locally:
    const cx = this.cameras.main.centerX + this.cameras.main.scrollX;
    const cy = this.cameras.main.centerY + this.cameras.main.scrollY;

    const effectText = this.add.text(cx, cy - 100, `${casterName} casts ${type.replace('_', ' ')}!`, {
      fontFamily: 'Cinzel, serif',
      fontSize: '24px',
      color: '#00ffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: effectText,
      y: cy - 150,
      alpha: 0,
      duration: 4000,
      onComplete: () => effectText.destroy()
    });

    if (type === 'healing_rain') {
      const stats = useGameStore.getState().player?.stats;
      if (stats) this.combatSystem.healPlayer(stats.maxHp);
      
      // Visual rain (simplified)
      for(let i=0; i<50; i++) {
        const drop = this.add.circle(cx + (Math.random()-0.5)*800, cy - 400 + Math.random()*200, 2, 0x00ffff, 0.8);
        drop.setDepth(99);
        this.tweens.add({
          targets: drop,
          y: drop.y + 600,
          duration: 1000 + Math.random()*500,
          onComplete: () => drop.destroy()
        });
      }
    } else if (type === 'gold_blessing') {
      useGameStore.getState().addGold(500);
      useUIStore.getState().addToast('+500 Gold from the Gods!', 'gold');
    } else if (type === 'exp_surge') {
      useGameStore.getState().addExperience(1000);
      useUIStore.getState().addToast('+1000 EXP from the Gods!', 'success');
    }

  }) as EventListener;

  private handleSiegeEvent = ((e: CustomEvent) => {
    const { x, y } = e.detail;
    // Spawn a horde of 10-15 enemies in a circle around the citadel
    const numEnemies = 10 + Math.floor(Math.random() * 6);
    const radius = 400; // Spawn outside the citadel

    for (let i = 0; i < numEnemies; i++) {
      const angle = (Math.PI * 2 * i) / numEnemies;
      const spawnX = x + Math.cos(angle) * radius;
      const spawnY = y + Math.sin(angle) * radius;
      
      const types = ['goblin', 'orc', 'demon', 'wolf'];
      const enemyType = types[Math.floor(Math.random() * types.length)];
      
      const conf = {
        type: enemyType,
        hp: 150,
        speed: 90,
        attack: 20,
        defense: 10,
        exp: 25,
        gold: 15
      };

      this.spawnEnemy(conf, spawnX, spawnY);
    }
  }) as EventListener;

  private handleBuildModeEvent = ((e: CustomEvent) => {
    this.buildModeActive = e.detail.active;
    if (e.detail.selectedType) this.buildModeType = e.detail.selectedType;
    if (e.detail.guildId) this.buildModeGuildId = e.detail.guildId;
  }) as EventListener;

  private drawWorldTiles() {
    const g = this.tileGraphics;

    for (let y = 0; y < this.world.height; y++) {
      for (let x = 0; x < this.world.width; x++) {
        const tile = this.world.tiles[y][x];
        const { base } = BIOME_TILE_COLOR[tile.biome];
        
        // Base tile
        g.fillStyle(base, 1);
        g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        
        // Darker grid lines for tactical/structured feel
        g.fillStyle(0x000000, 0.15);
        g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, 1);
        g.fillRect(x * TILE_SIZE, y * TILE_SIZE, 1, TILE_SIZE);

        // Texture variations (grass blades / dirt rocks)
        for (let i = 0; i < 3; i++) {
          if (Math.random() < 0.4) {
            g.fillStyle(0x000000, 0.1 + Math.random() * 0.1);
            const varX = x * TILE_SIZE + 4 + Math.random() * (TILE_SIZE - 8);
            const varY = y * TILE_SIZE + 4 + Math.random() * (TILE_SIZE - 8);
            g.fillRect(varX, varY, 2 + Math.random() * 4, 2 + Math.random() * 2);
          }
          if (Math.random() < 0.3) {
            g.fillStyle(0xffffff, 0.05 + Math.random() * 0.05); // Highlight
            const varX = x * TILE_SIZE + 4 + Math.random() * (TILE_SIZE - 8);
            const varY = y * TILE_SIZE + 4 + Math.random() * (TILE_SIZE - 8);
            g.fillRect(varX, varY, 2, 4 + Math.random() * 4);
          }
        }
      }
    }

    // Draw structures
    for (const city of this.world.cities) {
      const px = city.x * TILE_SIZE;
      const py = city.y * TILE_SIZE;

      // City marker — larger colored area
      g.fillStyle(0x8a7060, 1);
      g.fillRect(px - TILE_SIZE, py - TILE_SIZE, TILE_SIZE * 3, TILE_SIZE * 3);

      // Building blocks
      for (let by = 0; by < 3; by++) {
        for (let bx = 0; bx < 3; bx++) {
          if (Math.random() < 0.6) {
            g.fillStyle(0x6a5040, 1);
            const bpx = (city.x - 1 + bx) * TILE_SIZE + 4;
            const bpy = (city.y - 1 + by) * TILE_SIZE + 4;
            g.fillRect(bpx, bpy, TILE_SIZE - 8, TILE_SIZE - 8);
          }
        }
      }

      // City name label
      const label = this.add.text(px + TILE_SIZE / 2, py - TILE_SIZE * 1.5, city.name, {
        fontFamily: 'Cinzel, serif',
        fontSize: '10px',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(30);
      this.structureLayer.add(label);
    }

    // Dungeon entrances
    for (const dungeon of this.world.dungeonTiles) {
      const px = dungeon.x * TILE_SIZE;
      const py = dungeon.y * TILE_SIZE;
      g.fillStyle(0x1a1a2a, 1);
      g.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
      g.fillStyle(0x6c63ff, 0.7);
      g.fillCircle(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 6);
    }
  }

  private spawnPlayer(x: number, y: number) {
    const body = this.add.image(0, 0, 'player');

    const shadow = this.add.ellipse(0, 14, 20, 8, 0x000000, 0.4);
    // Add a glowing aura beneath the player for a premium look
    const aura = this.add.ellipse(0, 10, 30, 15, 0x6c63ff, 0.15);
    aura.setBlendMode(Phaser.BlendModes.ADD);

    this.playerMountSprite = this.add.text(0, 10, '', { fontSize: '24px' }).setOrigin(0.5);

    this.player = this.add.container(x, y, [aura, shadow, this.playerMountSprite, body]);
    this.player.setDepth(20);
    this.playerBody = body;
    this.entityLayer.add(this.player);
    this.updateMountVisual();
  }

  private updateMountVisual() {
    const playerStore = useGameStore.getState().player;
    if (!playerStore?.isMounted || !this.playerMountSprite) {
      if (this.playerMountSprite) this.playerMountSprite.setText('');
      this.playerBody.y = 0; // Reset player position
      return;
    }

    let mountIcon = '🐴';
    if (playerStore.mount === 'Wolf') mountIcon = '🐺';
    if (playerStore.mount === 'Drake') mountIcon = '🐉';
    if (playerStore.mount === 'VoidBeast') mountIcon = '🦇';

    this.playerMountSprite.setText(mountIcon);
    this.playerBody.y = -10; // Lift player onto mount
  }

  private spawnNearbyEnemies(cx: number, cy: number) {
    const tx = Math.floor(cx / TILE_SIZE);
    const ty = Math.floor(cy / TILE_SIZE);
    const biome = this.world.tiles[ty]?.[tx]?.biome ?? 'plains';
    
    const depletion = useGameStore.getState().worldState?.biomeDepletion?.[biome] ?? 100;
    if (depletion < 50) return; // Ecosystem too depleted for enemy spawns

    const enemyTypes = [
      { type: 'goblin', hp: 30, speed: 90, attack: 8, defense: 2, exp: 20, gold: 5 },
      { type: 'orc', hp: 60, speed: 60, attack: 15, defense: 5, exp: 40, gold: 10 },
      { type: 'skeleton', hp: 40, speed: 70, attack: 12, defense: 3, exp: 30, gold: 8 },
      { type: 'wolf', hp: 25, speed: 120, attack: 10, defense: 1, exp: 15, gold: 3 },
    ];

    const count = 8 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      const eType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      const angle = Math.random() * Math.PI * 2;
      const dist = 200 + Math.random() * 400;
      const ex = cx + Math.cos(angle) * dist;
      const ey = cy + Math.sin(angle) * dist;

      this.spawnEnemy(eType, ex, ey);
    }
  }

  private spawnEnemy(config: { type: string; hp: number; speed: number; attack: number; defense: number; exp: number; gold: number }, x: number, y: number) {
    const shadow = this.add.ellipse(0, 12, 16, 5, 0x000000, 0.25);
    const body = this.add.image(0, 0, `enemy-${config.type}`);

    // HP bar
    const hpBar = this.add.graphics();
    hpBar.setPosition(-12, -20);

    const container = this.add.container(x, y, [shadow, body, hpBar]) as EnemySprite;
    container.setDepth(20);
    container.enemyData = {
      id: `enemy-${Date.now()}-${Math.random()}`,
      type: config.type,
      hp: config.hp,
      maxHp: config.hp,
      speed: config.speed,
      attack: config.attack,
      defense: config.defense,
      experienceReward: config.exp,
      goldReward: config.gold,
      state: 'idle',
      patrolOriginX: x,
      patrolOriginY: y,
      patrolTimer: 0,
      aggroRange: 150,
      attackRange: 40,
      attackCooldown: 0,
      hpBar,
    };

    this.updateEnemyHPBar(container);
    this.enemies.push(container);
    this.entityLayer.add(container);
    
    return container;
  }

  private spawnNearbyNPCs(cx: number, cy: number) {
    const roles = ['merchant', 'quest_giver', 'guard', 'villager', 'innkeeper'] as const;
    const names = ['Aldric', 'Brinne', 'Caius', 'Darya', 'Elara', 'Faolan', 'Galla', 'Hedwin'];

    for (const city of this.world.cities.slice(0, 3)) {
      const npcsPerCity = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < npcsPerCity; i++) {
        const role = roles[Math.floor(Math.random() * roles.length)];
        const name = names[Math.floor(Math.random() * names.length)];
        const nx = (city.x + (Math.random() - 0.5) * 3) * TILE_SIZE;
        const ny = (city.y + (Math.random() - 0.5) * 3) * TILE_SIZE;

        this.spawnNPC(role, name, nx, ny);
      }
    }
  }

  private spawnNPC(role: string, name: string, x: number, y: number) {
    const dialogues: Record<string, string[]> = {
      merchant:    ['Fine wares for a discerning adventurer!', 'Everything has a price — even knowledge.'],
      quest_giver: ['I have a task for someone capable...', 'You look like trouble. Perfect.'],
      guard:       ['Keep moving, traveler.', 'The road is dangerous tonight.'],
      villager:    ['Strange times we live in...', 'Have you heard about the creatures to the east?'],
      innkeeper:   ['A room, a meal, and a story — all for one price.'],
    };

    const shadow = this.add.ellipse(0, 13, 14, 5, 0x000000, 0.2);
    const body = this.add.image(0, 0, `npc-${role}`);

    // Name label
    const label = this.add.text(0, -24, name, {
      fontFamily: 'Cinzel, serif',
      fontSize: '9px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Interaction indicator (!)
    const indicator = this.add.text(0, -36, '!', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      color: '#ffd700',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: indicator,
      alpha: { from: 0, to: 1 },
      y: { from: -36, to: -32 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const container = this.add.container(x, y, [shadow, body, label, indicator]) as NPCSprite;
    container.setDepth(20);
    container.npcData = {
      id: `npc-${Date.now()}-${Math.random()}`,
      name,
      role,
      personality: 'friendly',
      dialogue: dialogues[role] ?? ['...'],
      biome: this.world.tiles[Math.floor(y / TILE_SIZE)]?.[Math.floor(x / TILE_SIZE)]?.biome ?? 'plains',
    };

    this.npcs.push(container);
    this.entityLayer.add(container);

    // Gentle idle bob
    this.tweens.add({
      targets: body,
      y: { from: 0, to: -3 },
      duration: 1200 + Math.random() * 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private spawnNearbyItems(cx: number, cy: number) {
    const tx = Math.floor(cx / TILE_SIZE);
    const ty = Math.floor(cy / TILE_SIZE);
    const biome = this.world.tiles[ty]?.[tx]?.biome ?? 'plains';
    
    const depletion = useGameStore.getState().worldState?.biomeDepletion?.[biome] ?? 100;
    if (depletion < 20) return; // Soil erosion: no item or essence generation

    const itemTypes = ['gold', 'potion', 'gem', 'scroll'];
    let count = 5 + Math.floor(Math.random() * 8);
    if (depletion < 50) count = Math.max(1, Math.floor(count / 3)); // Scarcity

    for (let i = 0; i < count; i++) {
      const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
      const angle = Math.random() * Math.PI * 2;
      const dist = 100 + Math.random() * 300;
      const ix = cx + Math.cos(angle) * dist;
      const iy = cy + Math.sin(angle) * dist;

      const glow = this.add.graphics();
      glow.fillStyle(0xffd700, 0.2);
      glow.fillCircle(0, 0, 14);

      const icon = this.add.image(0, 0, `item-${type}`);

      const container = this.add.container(ix, iy, [glow, icon]);
      container.setDepth(15);
      container.setData('itemType', type);
      container.setData('collected', false);

      // Float animation
      this.tweens.add({
        targets: icon,
        y: { from: -3, to: 3 },
        duration: 1000 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.items.push(container);
      this.entityLayer.add(container);
    }
  }

  private setupInput() {
    if (!this.input.keyboard) return;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up:    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left:  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      down:  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.eKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.cKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    this.iKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.qKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.mKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.fKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.escKey   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.numberKeys = [
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
    ];

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Citadel Building
      if (this.buildModeActive && pointer.rightButtonDown()) {
        const worldX = this.cameras.main.scrollX + pointer.x;
        const worldY = this.cameras.main.scrollY + pointer.y;
        citadelSystem.placeBuilding(worldX, worldY, this.buildModeType, this.buildModeGuildId);
        return;
      }

      // World Interaction
      if (!this.buildModeActive && pointer.leftButtonDown()) {
        const worldX = this.cameras.main.scrollX + pointer.x;
        const worldY = this.cameras.main.scrollY + pointer.y;

        // Check NPCs
        const clickedNPC = this.npcs.find(npc => {
           return Phaser.Math.Distance.Between(worldX, worldY, npc.x, npc.y) < 32;
        });

        if (clickedNPC) {
           const pDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, clickedNPC.x, clickedNPC.y);
           if (pDist <= this.INTERACT_RANGE) {
               this.interactWithNPC(clickedNPC);
           } else {
               useUIStore.getState().addToast('Too far to interact.', 'warning');
           }
           return;
        }

        // Check Farm Plots
        const clickedPlot = farmingSystem.getPlots().find(plot => {
           return Phaser.Math.Distance.Between(worldX, worldY, plot.x, plot.y) < 32;
        });

        if (clickedPlot) {
           const pDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, clickedPlot.x, clickedPlot.y);
           if (pDist <= this.INTERACT_RANGE) {
               farmingSystem.harvestPlot(clickedPlot.id);
           } else {
               useUIStore.getState().addToast('Too far to harvest.', 'warning');
           }
           return;
        }

        // Check Leylines
        const clickedNode = leylineSystem.getNodes().find(node => {
           return Phaser.Math.Distance.Between(worldX, worldY, node.x, node.y) < 32;
        });

        if (clickedNode) {
           const pDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, clickedNode.x, clickedNode.y);
           if (pDist <= this.INTERACT_RANGE) {
               const tx = Math.floor(clickedNode.x / TILE_SIZE);
               const ty = Math.floor(clickedNode.y / TILE_SIZE);
               const biome = this.world.tiles[ty]?.[tx]?.biome ?? 'plains';
               farmingSystem.plantSeed(clickedNode.x + (Math.random() * 40 - 20), clickedNode.y + (Math.random() * 40 - 20), biome);
           } else {
               useUIStore.getState().addToast('Too far to interact with node.', 'warning');
           }
           return;
        }
      }
    });
  }

  private setupTouchInput() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Left half of screen = joystick
      if (pointer.x < this.cameras.main.width * 0.5) {
        this.joystickPointer = pointer;
        this.joystickOrigin = { x: pointer.x, y: pointer.y };
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointer?.id === pointer.id) {
        const dx = pointer.x - this.joystickOrigin.x;
        const dy = pointer.y - this.joystickOrigin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 50;
        const clamped = Math.min(dist, maxDist);
        this.joystickVector = {
          x: (dx / dist) * (clamped / maxDist),
          y: (dy / dist) * (clamped / maxDist),
        };
        // Tell React to update joystick visual
        (window as Window & { __joystickState?: { dx: number; dy: number; originX: number; originY: number } }).__joystickState = {
          dx: (dx / dist) * Math.min(clamped, 45),
          dy: (dy / dist) * Math.min(clamped, 45),
          originX: this.joystickOrigin.x,
          originY: this.joystickOrigin.y,
        };
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointer?.id === pointer.id) {
        this.joystickPointer = null;
        this.joystickVector = { x: 0, y: 0 };
        (window as Window & { __joystickState?: null }).__joystickState = null;
      }
    });

    // Wire up global action hooks for React UI
    (window as Window & { __mobileAttack?: () => void }).__mobileAttack = () => {
      this.playerAttack();
    };
    (window as Window & { __mobileInteract?: () => void }).__mobileInteract = () => {
      this.interactWithNearest();
    };
    (window as Window & { __spectatorMode?: () => void }).__spectatorMode = () => {
      this.cameras.main.stopFollow();
      this.tweens.add({
        targets: this.cameras.main,
        zoom: 0.5,
        duration: 2000,
        ease: 'Sine.easeInOut'
      });
      // Slowly pan across the map
      this.tweens.add({
        targets: this.cameras.main,
        scrollX: this.world.width * 32,
        scrollY: this.world.height * 32,
        duration: 60000,
        ease: 'Linear'
      });
      useUIStore.getState().setScreen('none'); // Hide UI
    };
  }

  private setupMinimap() {
    const mmSize = 80;
    this.minimap = this.add.graphics()
      .setScrollFactor(0)
      .setDepth(200)
      .setPosition(this.cameras.main.width - mmSize - 12, 12);

    // Pre-compute minimap colors
    this.minimapData = new Uint32Array(mmSize * mmSize);
    this.updateMinimap(mmSize);
  }

  private updateMinimap(mmSize: number) {
    const g = this.minimap;
    g.clear();

    // Background
    g.fillStyle(0x0a0a1a, 0.85);
    g.fillRoundedRect(0, 0, mmSize, mmSize, 4);
    g.lineStyle(1, 0x2a2a5a, 1);
    g.strokeRoundedRect(0, 0, mmSize, mmSize, 4);

    const scaleX = mmSize / this.world.width;
    const scaleY = mmSize / this.world.height;

    // Draw tiles (every 2nd tile for performance)
    for (let y = 0; y < this.world.height; y += 2) {
      for (let x = 0; x < this.world.width; x += 2) {
        const tile = this.world.tiles[y][x];
        const { base } = BIOME_TILE_COLOR[tile.biome];
        g.fillStyle(base, 1);
        g.fillRect(x * scaleX, y * scaleY, scaleX * 2 + 1, scaleY * 2 + 1);
      }
    }

    // Cities as gold dots
    for (const city of this.world.cities) {
      g.fillStyle(0xffd700, 1);
      g.fillCircle(city.x * scaleX, city.y * scaleY, 2.5);
    }

    // Player position
    if (this.player) {
      const px = (this.player.x / TILE_SIZE) * scaleX;
      const py = (this.player.y / TILE_SIZE) * scaleY;
      g.fillStyle(0xffffff, 1);
      g.fillCircle(px, py, 2.5);
    }
  }

  update(time: number, delta: number) {
    if (useUIStore.getState().currentScreen !== 'game') return;

    const dt = delta / 1000;
    this.handlePlayerInput(dt);
    this.updateEnemies(dt);
    this.checkItemPickup();
    this.checkNPCInteraction();
    this.checkDungeonEntry();
    this.updateLeylineRendering();
    this.updateFarmingRendering();
    this.updateCitadelRendering();
    this.updateCooldowns(delta);

    // Update minimap every 30 frames
    if (Math.floor(time / 500) !== Math.floor((time - delta) / 500)) {
      this.updateMinimap(80);
    }

    // Sync player position to store
    useGameStore.getState().updatePlayerPosition(this.player.x, this.player.y);

    const tx = Math.floor(this.player.x / TILE_SIZE);
    const ty = Math.floor(this.player.y / TILE_SIZE);
    const currentBiome = this.world.tiles[ty]?.[tx]?.biome ?? 'plains';
    if (useUIStore.getState().currentBiome !== currentBiome) {
      useUIStore.getState().setCurrentBiome(currentBiome);
    }

    // Broadcast position to server if active room is set and player has moved
    if (socketManager.getRoomCode()) {
      const distSq = Phaser.Math.Distance.Squared(this.lastSentPos.x, this.lastSentPos.y, this.player.x, this.player.y);
      if (distSq > 4) { // Only send if moved more than 2 pixels to reduce spam
        socketManager.sendMove({ x: this.player.x, y: this.player.y }, this.playerDirection);
        this.lastSentPos.x = this.player.x;
        this.lastSentPos.y = this.player.y;
      }
    }
  }

  private handlePlayerInput(dt: number) {
    const gameStore = useGameStore.getState();
    let speed = (gameStore.player?.stats?.speed ?? 150);
    
    if (gameStore.player?.isMounted) {
      speed *= MountSystem.getMountSpeedMultiplier(gameStore.player.mount);
    }

    let vx = 0, vy = 0;
    const sprintMult = this.isSprinting ? 1.7 : 1.0;

    // Keyboard
    if (this.cursors.left?.isDown  || this.wasd.left?.isDown)  { vx = -speed * sprintMult; this.playerDirection = 'left'; }
    if (this.cursors.right?.isDown || this.wasd.right?.isDown) { vx =  speed * sprintMult; this.playerDirection = 'right'; }
    if (this.cursors.up?.isDown    || this.wasd.up?.isDown)    { vy = -speed * sprintMult; this.playerDirection = 'up'; }
    if (this.cursors.down?.isDown  || this.wasd.down?.isDown)  { vy =  speed * sprintMult; this.playerDirection = 'down'; }

    // Mobile joystick
    if (this.joystickPointer && (Math.abs(this.joystickVector.x) > 0.1 || Math.abs(this.joystickVector.y) > 0.1)) {
      vx = this.joystickVector.x * speed;
      vy = this.joystickVector.y * speed;
      if (Math.abs(vx) > Math.abs(vy)) {
        this.playerDirection = vx > 0 ? 'right' : 'left';
      } else {
        this.playerDirection = vy > 0 ? 'down' : 'up';
      }
    }

    // Gamepad support
    const pad = this.input.gamepad?.pad1;
    if (pad && pad.axes.length >= 2) {
      const xAxis = pad.axes[0].getValue();
      const yAxis = pad.axes[1].getValue();
      
      if (Math.abs(xAxis) > 0.1 || Math.abs(yAxis) > 0.1) {
        vx = xAxis * speed * sprintMult;
        vy = yAxis * speed * sprintMult;
        if (Math.abs(vx) > Math.abs(vy)) {
          this.playerDirection = vx > 0 ? 'right' : 'left';
        } else {
          this.playerDirection = vy > 0 ? 'down' : 'up';
        }
      }
    }

    // Diagonal normalise
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    // Collision check against world bounds
    const newX = this.player.x + vx * dt;
    const newY = this.player.y + vy * dt;
    const tileX = Math.floor(newX / TILE_SIZE);
    const tileY = Math.floor(newY / TILE_SIZE);

    if (tileX >= 0 && tileX < this.world.width && tileY >= 0 && tileY < this.world.height) {
      const tile = this.world.tiles[tileY][tileX];
      if (tile.walkable) {
        this.player.setPosition(newX, newY);
      }
    }

    // Flip sprite based on direction
    if (vx < 0) this.playerBody.setFlipX(true);
    else if (vx > 0) this.playerBody.setFlipX(false);

    // Attack
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || (pad && pad.A)) {
      this.playerAttack();
    }

    // Interact
    if (Phaser.Input.Keyboard.JustDown(this.eKey) || (pad && pad.B)) {
      this.interactWithNearest();
    }

    // UI toggles
    if (Phaser.Input.Keyboard.JustDown(this.iKey)) {
      const ui = useUIStore.getState();
      ui.isInventoryOpen ? ui.closeInventory() : ui.openInventory();
    }
    if (Phaser.Input.Keyboard.JustDown(this.qKey)) {
      const ui = useUIStore.getState();
      ui.isQuestLogOpen ? ui.closeQuestLog() : ui.openQuestLog();
    }
    // C — Crafting
    if (Phaser.Input.Keyboard.JustDown(this.cKey)) {
      const ui = useUIStore.getState();
      ui.isCraftingOpen ? ui.closeCrafting() : ui.openCrafting();
    }
    // M — World map
    if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
      window.dispatchEvent(new CustomEvent('ir:togglemap'));
    }
    // F — Sprint toggle
    if (Phaser.Input.Keyboard.JustDown(this.fKey)) {
      this.isSprinting = !this.isSprinting;
      this.cameras.main.setZoom(this.isSprinting ? 1.0 : 1.2);
    }
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      useUIStore.getState().togglePause();
    }

    // Skill casts (keys 1-4)
    this.numberKeys.forEach((key, idx) => {
      if (Phaser.Input.Keyboard.JustDown(key)) {
        const skillStore = useSkillStore.getState();
        const skill = skillStore.equippedSkills[idx];
        if (skill) {
          const castSuccess = skillStore.castSkill(skill.id);
          if (castSuccess) {
            const colors: Record<string, number> = {
              damage: 0xff4444, // Red
              heal: 0x44ff44,   // Green
              shield: 0x4444ff, // Blue
              utility: 0xffff44 // Yellow
            };
            const flashColor = colors[skill.type] ?? 0xffffff;
            this.tweens.add({
              targets: this.playerBody,
              tint: { from: 0xffffff, to: flashColor },
              duration: 150,
              yoyo: true,
            });

            if (skill.type === 'damage') {
              this.castDamageSpell(skill.value);
            }

            if (socketManager.getRoomCode()) {
              socketManager.sendAttack(this.playerDirection);
            }
          }
        }
      }
    });
  }

  private playerAttack() {
    if (this.playerAttackCooldown > 0) return;

    this.playerAttackCooldown = 600; // ms

    const gameStore = useGameStore.getState();
    const playerStats = gameStore.player?.stats;
    if (!playerStats) return;

    // Visual attack flash
    this.tweens.add({
      targets: this.playerBody,
      tint: { from: 0xffffff, to: 0xff4444 },
      duration: 100,
      yoyo: true,
    });

    // Slash animation arc
    const slash = this.add.graphics();
    slash.lineStyle(4, 0xffffff, 1);
    slash.beginPath();
    slash.arc(0, 0, 30, -Math.PI / 4, Math.PI / 4);
    slash.strokePath();
    slash.setDepth(100);
    slash.setPosition(this.player.x, this.player.y);
    
    // Rotate slash based on direction
    const angles = { right: 0, down: Math.PI/2, left: Math.PI, up: -Math.PI/2 };
    slash.setRotation(angles[this.playerDirection]);

    this.tweens.add({
      targets: slash,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => slash.destroy()
    });
    
    soundSystem.playSlash();

    if (socketManager.getRoomCode()) {
      socketManager.sendAttack(this.playerDirection);
    }

    // Check enemies in attack range
    const hitbox = this.combatSystem.getMeleeHitbox(this.player.x, this.player.y, this.playerDirection, this.ATTACK_RANGE);

    for (const enemy of this.enemies) {
      if (enemy.enemyData.state === 'dead') continue;
      if (hitbox.contains(enemy.x, enemy.y)) {
        const { damage, isCrit } = this.combatSystem.calculateDamage(
          playerStats,
          { hp: enemy.enemyData.hp, maxHp: enemy.enemyData.maxHp, mana: 0, maxMana: 0, attack: enemy.enemyData.attack, defense: enemy.enemyData.defense, speed: enemy.enemyData.speed, luck: 5 },
          playerStats.luck
        );

        enemy.enemyData.hp -= damage;
        this.combatSystem.showDamageNumber(enemy.x, enemy.y, damage, isCrit);
        
        // Dynamic Camera Shake
        if (isCrit) {
          this.cameras.main.shake(200, 0.015);
        } else {
          this.cameras.main.shake(100, 0.005);
        }
        
        this.updateEnemyHPBar(enemy);
        soundSystem.playHit();

        // Hit flash
        const bodyImg = enemy.list[1] as Phaser.GameObjects.Image;
        bodyImg.setTintFill(0xffffff); // Flash solid white
        this.time.delayedCall(80, () => {
          bodyImg.clearTint();
        });

        if (enemy.enemyData.hp <= 0) {
          this.killEnemy(enemy);
        } else {
          enemy.enemyData.state = 'chase';
        }
      }
    }
  }

  private castDamageSpell(baseDamage: number) {
    const gameStore = useGameStore.getState();
    const playerStats = gameStore.player?.stats;
    if (!playerStats) return;

    const spellRange = this.ATTACK_RANGE * 1.5;
    
    // Spell particle effect
    const particles = this.add.particles(this.player.x, this.player.y, 'item-gem', {
      speed: { min: 50, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      tint: 0xff00ff,
      blendMode: 'ADD',
      lifespan: 400,
      quantity: 15,
      emitting: false
    });
    particles.setDepth(99);
    particles.explode();
    
    soundSystem.playSpell();

    const hitbox = this.combatSystem.getMeleeHitbox(this.player.x, this.player.y, this.playerDirection, spellRange);

    for (const enemy of this.enemies) {
      if (enemy.enemyData.state === 'dead') continue;
      if (hitbox.contains(enemy.x, enemy.y)) {
        const damage = Math.floor((playerStats.attack * 0.5 + baseDamage) * (0.9 + Math.random() * 0.2));
        const isCrit = Math.random() * 100 < playerStats.luck;
        const finalDamage = isCrit ? damage * 2 : damage;

        enemy.enemyData.hp -= finalDamage;
        this.combatSystem.showDamageNumber(enemy.x, enemy.y, finalDamage, isCrit);
        this.updateEnemyHPBar(enemy);

        const bodyImg = enemy.list[1] as Phaser.GameObjects.Image;
        this.tweens.add({
          targets: bodyImg,
          tint: { from: 0xff00ff, to: 0xffffff },
          duration: 100,
          yoyo: true,
        });

        if (enemy.enemyData.hp <= 0) {
          this.killEnemy(enemy);
        } else {
          enemy.enemyData.state = 'chase';
        }
      }
    }
  }

  private killEnemy(enemy: EnemySprite) {
    enemy.enemyData.state = 'dead';

    const tx = Math.floor(enemy.x / TILE_SIZE);
    const ty = Math.floor(enemy.y / TILE_SIZE);
    const biome = this.world.tiles[ty]?.[tx]?.biome ?? 'plains';
    useGameStore.getState().depleteEcosystem(biome, 1);

    // Death animation
    this.tweens.add({
      targets: enemy,
      alpha: 0,
      y: enemy.y - 20,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        const idx = this.enemies.indexOf(enemy);
        if (idx !== -1) this.enemies.splice(idx, 1);
        enemy.destroy();

        // Spawn loot
        if (Math.random() < 0.5) {
          const itemTypes = ['gold', 'potion', 'gem'];
          const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
          const icon = this.add.image(enemy.x, enemy.y, `item-${type}`);
          icon.setDepth(15);
          this.items.push(this.add.container(enemy.x, enemy.y, [icon]));
          icon.setData('itemType', type);
        }
      },
    });

    // Rewards
    const gameStore = useGameStore.getState();
    gameStore.addExperience(enemy.enemyData.experienceReward);
    gameStore.addGold(enemy.enemyData.goldReward);
    useUIStore.getState().addToast(`+${enemy.enemyData.goldReward} gold`, 'gold');
  }

  private updateEnemyHPBar(enemy: EnemySprite) {
    const hpBar = enemy.enemyData.hpBar;
    if (!hpBar) return;

    const ratio = enemy.enemyData.hp / enemy.enemyData.maxHp;
    const W = 24;

    hpBar.clear();
    hpBar.fillStyle(0x330000, 0.8);
    hpBar.fillRect(0, 0, W, 3);
    hpBar.fillStyle(ratio > 0.5 ? 0x22cc44 : ratio > 0.25 ? 0xffaa00 : 0xcc2222, 1);
    hpBar.fillRect(0, 0, Math.round(W * ratio), 3);
  }

  private updateEnemies(dt: number) {
    let px = this.player.x;
    let py = this.player.y;
    
    // Check Citadel Sieges
    const buildings = citadelSystem.getBuildings();

    for (const enemy of this.enemies) {
      if (enemy.enemyData.state === 'dead') continue;

      let targetX = px;
      let targetY = py;
      let targetBuilding: any = null;

      // Find closest building
      let closestDist = Infinity;
      for (const b of buildings) {
        const dsq = (b.x - enemy.x)**2 + (b.y - enemy.y)**2;
        if (dsq < closestDist) {
          closestDist = dsq;
          targetBuilding = b;
        }
      }

      // If building is closer than player (or if in a siege), attack building
      const distToPlayerSq = (px - enemy.x)**2 + (py - enemy.y)**2;
      if (targetBuilding && closestDist < distToPlayerSq && closestDist < 40000) { // 200px range
        targetX = targetBuilding.x;
        targetY = targetBuilding.y;
      }

      const ed = enemy.enemyData;
      const dx = targetX - enemy.x;
      const dy = targetY - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      ed.attackCooldown = Math.max(0, ed.attackCooldown - dt * 1000);

      switch (ed.state) {
        case 'idle':
          ed.patrolTimer -= dt;
          if (ed.patrolTimer <= 0) {
            ed.state = 'patrol';
            ed.patrolTimer = 2 + Math.random() * 3;
          }
          if (dist < ed.aggroRange) ed.state = 'chase';
          break;

        case 'patrol': {
          // Random wander around origin
          const targetX = ed.patrolOriginX + (Math.random() - 0.5) * 100;
          const targetY = ed.patrolOriginY + (Math.random() - 0.5) * 100;
          const pdx = targetX - enemy.x;
          const pdy = targetY - enemy.y;
          const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pdist > 5) {
            enemy.x += (pdx / pdist) * ed.speed * 0.4 * dt;
            enemy.y += (pdy / pdist) * ed.speed * 0.4 * dt;
          } else {
            ed.state = 'idle';
            ed.patrolTimer = 1 + Math.random() * 2;
          }
          if (dist < ed.aggroRange) ed.state = 'chase';
          break;
        }

        case 'chase':
          if (dist > ed.aggroRange * 1.5) {
            ed.state = 'idle';
          } else if (dist < ed.attackRange) {
            ed.state = 'attack';
          } else if (dist > 0) {
            enemy.x += (dx / dist) * ed.speed * dt;
            enemy.y += (dy / dist) * ed.speed * dt;
          }
          // Flip
          if (dx < 0) (enemy.list[1] as Phaser.GameObjects.Image).setFlipX(true);
          else (enemy.list[1] as Phaser.GameObjects.Image).setFlipX(false);
          break;

        case 'attack':
          if (dist > ed.attackRange * 1.2) {
            ed.state = 'chase';
          } else if (ed.attackCooldown <= 0) {
            // Attack player
            ed.attackCooldown = 1200;
            
            if (targetX !== px && targetBuilding) {
              // Attacking building
              citadelSystem.damageBuilding(targetBuilding.id, ed.attack);
              this.combatSystem.showDamageNumber(targetX, targetY, ed.attack, false);
            } else if (!this.playerInvincible) {
              // Attacking player
              const damage = Math.max(1, ed.attack - (useGameStore.getState().player?.stats?.defense ?? 0) * 0.5);
              this.combatSystem.damagePlayer(Math.round(damage));
              this.combatSystem.showDamageNumber(px, py, Math.round(damage), false);
              this.cameras.main.shake(150, 0.015); // Player hit shake

              // Brief invincibility
              this.playerInvincible = true;
              this.tweens.add({
                targets: this.player,
                alpha: { from: 1, to: 0.4 },
                duration: 100,
                yoyo: true,
                repeat: 3,
                onComplete: () => {
                  this.player.setAlpha(1);
                  this.playerInvincible = false;
                },
              });
            }
          }
          break;
      }
    }
  }

  private checkItemPickup() {
    const pickupRange = 30;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (item.getData('collected')) continue;

      const dx = this.player.x - item.x;
      const dy = this.player.y - item.y;
      if (Math.sqrt(dx * dx + dy * dy) < pickupRange) {
        item.setData('collected', true);
        const type = item.getData('itemType') as string;

        // Collect animation
        this.tweens.add({
          targets: item,
          y: item.y - 30,
          alpha: 0,
          duration: 400,
          ease: 'Power2',
          onComplete: () => {
            this.items.splice(i, 1);
            item.destroy();
          },
        });
        soundSystem.playCoin();

        // Apply effect
        switch (type) {
          case 'gold':
            useGameStore.getState().addGold(5 + Math.floor(Math.random() * 15));
            useUIStore.getState().addToast('+' + (5 + Math.floor(Math.random() * 15)) + ' gold', 'gold');
            break;
          case 'potion':
            this.combatSystem.healPlayer(20 + Math.floor(Math.random() * 20));
            break;
          case 'gem':
            useGameStore.getState().addExperience(15 + Math.floor(Math.random() * 25));
            useUIStore.getState().addToast('+XP gem collected!', 'success');
            break;
          case 'scroll':
            useUIStore.getState().addToast('Ancient scroll found!', 'info');
            break;
        }
      }
    }
  }

  private checkNPCInteraction() {
    for (const npc of this.npcs) {
      const dx = this.player.x - npc.x;
      const dy = this.player.y - npc.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const indicator = npc.list[3] as Phaser.GameObjects.Text;

      if (dist < this.INTERACT_RANGE * 1.5) {
        indicator?.setAlpha(1);
      } else {
        indicator?.setAlpha(0);
      }
    }
  }

  private async interactWithNearest() {
    let nearestNPC: NPCSprite | null = null;
    let nearestDist = Infinity;

    for (const npc of this.npcs) {
      const dx = this.player.x - npc.x;
      const dy = this.player.y - npc.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.INTERACT_RANGE && dist < nearestDist) {
        nearestDist = dist;
        nearestNPC = npc;
      }
    }

    if (nearestNPC) {
      this.interactWithNPC(nearestNPC);
      return;
    }


    // Check Farm Plots
    for (const plot of farmingSystem.getPlots()) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, plot.x, plot.y);
      if (dist < this.INTERACT_RANGE) {
        farmingSystem.harvestPlot(plot.id);
        return;
      }
    }

    // Check Leyline Nodes for Planting
    for (const node of leylineSystem.getNodes()) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, node.x, node.y);
      if (dist < this.INTERACT_RANGE) {
        const tx = Math.floor(node.x / TILE_SIZE);
        const ty = Math.floor(node.y / TILE_SIZE);
        const biome = this.world.tiles[ty]?.[tx]?.biome ?? 'plains';
        
        farmingSystem.plantSeed(node.x + (Math.random() * 40 - 20), node.y + (Math.random() * 40 - 20), biome);
        return;
      }
    }
  }

  private async interactWithNPC(npc: NPCSprite) {
    const ui = useUIStore.getState();
    const gameStore = useGameStore.getState();
    const token = gameStore.playerToken;

    const npcInfo = {
      id: npc.npcData.id,
      name: npc.npcData.name,
      role: npc.npcData.role as NPC['role'],
    };

    // Show temporary loading dialogue
    ui.openDialogue(npcInfo, 'Thinking...', []);

    let dialogue = npc.npcData.dialogue[Math.floor(Math.random() * npc.npcData.dialogue.length)];
    let options = [
      { text: 'Tell me about your quests', action: 'quest' },
      { text: 'Farewell', action: 'close' },
    ];

    if (npc.npcData.role === 'merchant') {
      options.unshift({ text: 'Show me your wares', action: 'shop' });
    }

    if (token && gameStore.player) {
      try {
        const res = await fetch('/api/npcs/interact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            npcId: npc.npcData.id,
            name: npc.npcData.name,
            role: npc.npcData.role,
            biome: npc.npcData.biome ?? 'plains',
            worldSeed: gameStore.player.worldSeed ?? 'default',
            playerLevel: gameStore.player.level ?? 1,
            playerName: gameStore.player.name ?? 'Hero',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          dialogue = data.dialogue;
          options = data.options ?? options;
        }
      } catch (err) {
        console.warn('[Dialogue] Failed to fetch NPC dialogue from server, falling back to local simulation:', err);
      }
    }

    ui.openDialogue(npcInfo, dialogue, options);
  }

  private updateCooldowns(delta: number) {
    if (this.playerAttackCooldown > 0) {
      this.playerAttackCooldown = Math.max(0, this.playerAttackCooldown - delta);
    }
  }

  private depthSort() {
    // Sort entities by Y position for correct overlap
    this.entityLayer.list.sort((a, b) => {
      const ay = (a as Phaser.GameObjects.Container).y ?? 0;
      const by2 = (b as Phaser.GameObjects.Container).y ?? 0;
      return ay - by2;
    });
  }

  setupMultiplayerSync() {
    // If a room is active, connect immediately
    if (socketManager.getRoomCode()) {
      socketManager.connect();
    }

    socketManager.on('remotePlayerJoined', this.handleJoinedBound);
    socketManager.on('remotePlayerMoved', this.handleMovedBound);
    socketManager.on('remotePlayerAttacked', this.handleAttackedBound);
    socketManager.on('remotePlayerLeft', this.handleLeftBound);
  }

  private handleRemotePlayerJoined(data: { playerId: string; name: string; pos?: { x: number; y: number }; level?: number }) {
    if (this.remotePlayers.has(data.playerId)) return;

    const x = data.pos?.x ?? this.world.spawnX * TILE_SIZE;
    const y = data.pos?.y ?? this.world.spawnY * TILE_SIZE;

    const body = this.add.image(0, 0, 'player');
    body.setTint(0xa0a0ff); // Light blue tint for remote players

    const shadow = this.add.ellipse(0, 12, 16, 6, 0x000000, 0.3);

    const label = this.add.text(0, -26, `${data.name} (Lv.${data.level ?? 1})`, {
      fontFamily: 'Cinzel, serif',
      fontSize: '9px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    const container = this.add.container(x, y, [shadow, body, label]);
    container.setDepth(20);

    this.entityLayer.add(container);
    this.remotePlayers.set(data.playerId, container);
  }

  private handleRemotePlayerMoved(data: { playerId: string; pos: { x: number; y: number }; direction: string }) {
    const remote = this.remotePlayers.get(data.playerId);
    if (!remote) {
      this.handleRemotePlayerJoined({ playerId: data.playerId, name: 'Remote Player', pos: data.pos });
      return;
    }

    this.tweens.add({
      targets: remote,
      x: data.pos.x,
      y: data.pos.y,
      duration: 100,
      ease: 'Linear',
    });

    const body = remote.list[1] as Phaser.GameObjects.Image;
    if (data.direction === 'left') {
      body.setFlipX(true);
    } else if (data.direction === 'right') {
      body.setFlipX(false);
    }
  }

  private handleRemotePlayerAttacked(data: { playerId: string; direction: string }) {
    const remote = this.remotePlayers.get(data.playerId);
    if (!remote) return;

    const body = remote.list[1] as Phaser.GameObjects.Image;
    this.tweens.add({
      targets: body,
      tint: { from: 0xa0a0ff, to: 0xff4444 },
      duration: 100,
      yoyo: true,
      onComplete: () => {
        body.setTint(0xa0a0ff);
      }
    });

    // PvP damage check
    if (!this.playerInvincible) {
      const dx = this.player.x - remote.x;
      const dy = this.player.y - remote.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.INTERACT_RANGE) {
        // Player takes PvP damage
        this.combatSystem.damagePlayer(10);
        this.combatSystem.showDamageNumber(this.player.x, this.player.y, 10, false);
        this.playerInvincible = true;
        this.tweens.add({
          targets: this.player,
          alpha: { from: 1, to: 0.4 },
          duration: 100,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            this.player.setAlpha(1);
            this.playerInvincible = false;
          },
        });
      }
    }
  }

  private handleRemotePlayerLeft(data: { playerId: string }) {
    const remote = this.remotePlayers.get(data.playerId);
    if (remote) {
      remote.destroy();
      this.remotePlayers.delete(data.playerId);
    }
  }

  private checkDungeonEntry() {
    if (!this.player) return;
    for (const dungeon of this.world.dungeonTiles) {
      const dx = this.player.x - (dungeon.x * TILE_SIZE + TILE_SIZE / 2);
      const dy = this.player.y - (dungeon.y * TILE_SIZE + TILE_SIZE / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < TILE_SIZE / 2) {
        this.scene.stop('WorldScene');
        this.scene.start('DungeonScene', {
          seed: `${this.world.seed}-dungeon-${dungeon.x}-${dungeon.y}`,
          returnX: this.player.x,
          returnY: this.player.y + TILE_SIZE,
        });
        break;
      }
    }
  }

  private updateLeylineRendering() {
    const nodes = leylineSystem.getNodes();

    // Register textures if they don't exist
    if (!this.textures.exists('tile-essence_collector')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x7c6bff, 1);
      g.fillCircle(16, 16, 10);
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(16, 16, 4);
      g.generateTexture('tile-essence_collector', 32, 32);
      g.destroy();
    }
    if (!this.textures.exists('tile-mana_relay')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x3fffa0, 1);
      g.fillCircle(16, 16, 8);
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(16, 16, 3);
      g.generateTexture('tile-mana_relay', 32, 32);
      g.destroy();
    }
    if (!this.textures.exists('tile-elemental_forge')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xffa03f, 1);
      g.fillRect(4, 4, 24, 24);
      g.fillStyle(0xffffff, 0.8);
      g.fillRect(10, 10, 12, 12);
      g.generateTexture('tile-elemental_forge', 32, 32);
      g.destroy();
    }

    // Spawn new nodes
    for (const node of nodes) {
      if (!this.nodeSprites.has(node.id)) {
        const body = this.add.image(0, 0, `tile-${node.type}`);
        const label = this.add.text(0, -18, node.type.replace('_', ' '), {
          fontFamily: 'Inter, sans-serif',
          fontSize: '8px',
          color: '#ffd700',
          stroke: '#000000',
          strokeThickness: 1,
        }).setOrigin(0.5);

        const container = this.add.container(node.x, node.y, [body, label]);
        container.setDepth(15);
        this.entityLayer.add(container);
        this.nodeSprites.set(node.id, container);
      }
    }

    // Draw links
    this.leylineGraphics.clear();
    this.leylineGraphics.lineStyle(2, 0x7c6bff, 0.5);
    for (const node of nodes) {
      if (node.connectedNodeIds) {
        for (const connId of node.connectedNodeIds) {
          const target = nodes.find((n) => n.id === connId);
          if (target) {
            this.leylineGraphics.lineBetween(node.x, node.y, target.x, target.y);

            // Spawn Golem Caravan if it doesn't exist
            const key = [node.id, target.id].sort().join('-');
            if (!this.golemCaravans.has(key)) {
              const body = this.add.image(0, 0, 'player');
              body.setTint(0x888888); // Stone color Golem
              body.setScale(0.5);

              const label = this.add.text(0, -14, 'Golem Caravan', {
                fontFamily: 'Inter, sans-serif',
                fontSize: '6px',
                color: '#ffffff',
              }).setOrigin(0.5);

              const caravan = this.add.container(node.x, node.y, [body, label]);
              caravan.setDepth(18);
              this.entityLayer.add(caravan);
              this.golemCaravans.set(key, caravan);

              this.tweens.add({
                targets: caravan,
                x: target.x,
                y: target.y,
                duration: 5000 + Math.random() * 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Linear',
              });
            }
          }
        }
      }
    }
  }

  private updateFarmingRendering() {
    const plots = farmingSystem.getPlots();

    // Remove deleted
    for (const [id, sprite] of this.farmPlotSprites.entries()) {
      if (!plots.find((p) => p.id === id)) {
        sprite.destroy();
        this.farmPlotSprites.delete(id);
      }
    }

    // Add / Update
    for (const plot of plots) {
      let container = this.farmPlotSprites.get(plot.id);
      if (!container) {
        const soil = this.add.ellipse(0, 8, 20, 10, 0x3d2817, 1);
        
        const cropIcon = plot.ready ? '🌱' : '🌿';
        const textIcon = this.add.text(0, 0, cropIcon, { fontSize: '16px' }).setOrigin(0.5);

        if (!plot.ready) {
          textIcon.setScale(0.5);
          textIcon.setAlpha(0.5);
          
          this.tweens.add({
            targets: textIcon,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 30_000,
            ease: 'Linear',
          });
        }

        container = this.add.container(plot.x, plot.y, [soil, textIcon]);
        container.setDepth(15);
        this.farmPlotSprites.set(plot.id, container);
        this.entityLayer.add(container);
      } else {
        const textIcon = container.list[1] as Phaser.GameObjects.Text;
        if (plot.ready && textIcon.text !== '✨') {
          textIcon.setText('✨'); // Ready indicator
          textIcon.setAlpha(1);
          textIcon.setScale(1);
          
          this.tweens.add({
            targets: textIcon,
            y: -5,
            duration: 1000,
            yoyo: true,
            repeat: -1
          });
        }
      }
    }
  }

  private updateCitadelRendering() {
    citadelSystem.updatePower(leylineSystem.getNodes());
    const buildings = citadelSystem.getBuildings();

    for (const [id, sprite] of this.citadelSprites.entries()) {
      if (!buildings.find((b) => b.id === id)) {
        sprite.destroy();
        this.citadelSprites.delete(id);
      }
    }

    for (const b of buildings) {
      let container = this.citadelSprites.get(b.id);
      if (!container) {
        let visual: Phaser.GameObjects.GameObject;
        const shadow = this.add.ellipse(0, 12, 24, 8, 0x000000, 0.4);

        if (b.type === 'wall') visual = this.add.rectangle(0, 0, 32, 32, 0x555555);
        else if (b.type === 'gate') visual = this.add.rectangle(0, 0, 32, 32, 0x664422);
        else if (b.type === 'turret') visual = this.add.triangle(0, 0, 0, 32, 16, 0, 32, 32, 0x777777);
        else if (b.type === 'energy_hub') visual = this.add.circle(0, 0, 16, 0xff00ff);
        else if (b.type === 'shield') visual = this.add.circle(0, 0, 32, 0x00ffff, 0.3);
        else visual = this.add.rectangle(0, 0, 32, 32, 0xff0000);

        container = this.add.container(b.x + 16, b.y + 16, [shadow, visual]);
        container.setDepth(15);
        this.citadelSprites.set(b.id, container);
        this.entityLayer.add(container);
      } else {
        // Update power state visuals if shield or turret
        if (b.type === 'shield') {
          const circle = container.list[1] as Phaser.GameObjects.Arc;
          circle.setFillStyle(0x00ffff, b.powered ? 0.6 : 0.1);
        } else if (b.type === 'turret') {
          const tri = container.list[1] as Phaser.GameObjects.Triangle;
          tri.setFillStyle(b.powered ? 0x00ffaa : 0x777777, 1);
        }
      }
    }
  }

  shutdown() {
    saveSystem.stopAutoSave();
    saveSystem.save();
    this.events.off('update', this.depthSort, this);

    // Unsubscribe from SocketManager events
    socketManager.off('remotePlayerJoined', this.handleJoinedBound);
    socketManager.off('remotePlayerMoved', this.handleMovedBound);
    socketManager.off('remotePlayerAttacked', this.handleAttackedBound);
    socketManager.off('remotePlayerLeft', this.handleLeftBound);

    // Destroy remote players
    for (const remote of this.remotePlayers.values()) {
      remote.destroy();
    }
    this.events.on('shutdown', () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('ir:mount_summoned', this.updateMountVisual.bind(this));
      window.removeEventListener('ir:mount_dismissed', this.updateMountVisual.bind(this));
    });

    window.addEventListener('ir:mount_summoned', this.updateMountVisual.bind(this));
    window.addEventListener('ir:mount_dismissed', this.updateMountVisual.bind(this));
    this.remotePlayers.clear();
    
    window.removeEventListener('ir:citadel_build_mode', this.handleBuildModeEvent);
    window.removeEventListener('ir:siege_invasion', this.handleSiegeEvent);
    window.removeEventListener('ir:god_intervention_cast', this.handleGodIntervention);
  }
}

// Fix TS import for NPC role
type NPC = import('@shared/types').NPC;
