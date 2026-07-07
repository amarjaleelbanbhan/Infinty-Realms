// ============================================================
// World Scene — Main game world with tilemap, entities, camera
// ============================================================

import Phaser from 'phaser';
import { generateWorld, BIOME_TILE_COLOR, type GeneratedWorld } from '@game/systems/WorldGenerator';
import { CombatSystem } from '@game/systems/CombatSystem';
import { WeatherSystem } from '@game/systems/WeatherSystem';
import { saveSystem } from '@game/systems/SaveSystem';
import { questSystem } from '@game/systems/QuestSystem';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';
import { useSkillStore } from '@game/systems/SkillSystem';
import { socketManager } from '@game/systems/SocketManager';
import type { BiomeType } from '@shared/types';

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

  private enemies: EnemySprite[] = [];
  private npcs: NPCSprite[] = [];
  private items: Phaser.GameObjects.Container[] = [];

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { up: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; };
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private eKey!: Phaser.Input.Keyboard.Key;
  private iKey!: Phaser.Input.Keyboard.Key;
  private qKey!: Phaser.Input.Keyboard.Key;
  private mKey!: Phaser.Input.Keyboard.Key;  // World map
  private fKey!: Phaser.Input.Keyboard.Key;  // Sprint toggle
  private escKey!: Phaser.Input.Keyboard.Key;

  private isSprinting = false;
  private numberKeys!: Phaser.Input.Keyboard.Key[];
  private remotePlayers = new Map<string, Phaser.GameObjects.Container>();
  private lastSentPos = { x: 0, y: 0 };
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

  constructor() {
    super({ key: 'WorldScene' });
  }

  init(data: { seed?: string }) {
    const gameStore = useGameStore.getState();
    const seed = data.seed ?? gameStore.worldState?.seed ?? `realm-${Date.now()}`;

    console.log(`[WorldScene] Generating world with seed: ${seed}`);
    this.world = generateWorld(seed, 128, 128);

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
    this.structureLayer = this.add.container(0, 0);
    this.entityLayer = this.add.container(0, 0);

    // ── Draw world tiles ──
    this.drawWorldTiles();

    // ── Spawn player ──
    const spawnX = this.world.spawnX * TILE_SIZE + TILE_SIZE / 2;
    const spawnY = this.world.spawnY * TILE_SIZE + TILE_SIZE / 2;
    this.spawnPlayer(spawnX, spawnY);

    // ── Spawn entities near player ──
    this.spawnNearbyEnemies(spawnX, spawnY);
    this.spawnNearbyNPCs(spawnX, spawnY);
    this.spawnNearbyItems(spawnX, spawnY);

    // ── Camera ──
    this.cameras.main.setBounds(0, 0, worldPixelW, worldPixelH);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.2);

    // ── Input ──
    this.setupInput();

    // ── Minimap ──
    this.setupMinimap();

    // ── Weather overlay ──
    const weather = this.weatherSystem.getRandomWeather('plains');
    this.weatherSystem.createOverlay(width, height);
    this.weatherSystem.setWeather(weather);

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

    // ── Initial quest ──
    this.time.delayedCall(3000, () => {
      questSystem.generateQuest();
    });

    // ── Touch/mobile input ──
    if (useUIStore.getState().isMobile) {
      this.setupTouchInput();
    }

    // ── Multiplayer Setup ──
    this.setupMultiplayerSync();

    // ── Depth sort on update ──
    this.events.on('update', this.depthSort, this);

    console.log(`[WorldScene] World ready! Cities: ${this.world.cities.length}`);
  }

  private drawWorldTiles() {
    const g = this.tileGraphics;

    for (let y = 0; y < this.world.height; y++) {
      for (let x = 0; x < this.world.width; x++) {
        const tile = this.world.tiles[y][x];
        const { base } = BIOME_TILE_COLOR[tile.biome];

        g.fillStyle(base, 1);
        g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        // Subtle variation
        if (Math.random() < 0.15) {
          g.fillStyle(base, 0.4);
          const varX = x * TILE_SIZE + Math.random() * 24;
          const varY = y * TILE_SIZE + Math.random() * 24;
          g.fillRect(varX, varY, 4 + Math.random() * 6, 2);
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

    const shadow = this.add.ellipse(0, 12, 16, 6, 0x000000, 0.3);

    this.player = this.add.container(x, y, [shadow, body]);
    this.player.setDepth(20);
    this.playerBody = body;
    this.entityLayer.add(this.player);
  }

  private spawnNearbyEnemies(cx: number, cy: number) {
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
    const itemTypes = ['gold', 'potion', 'gem', 'scroll'];
    const count = 5 + Math.floor(Math.random() * 8);

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
    this.updateCooldowns(delta);

    // Update minimap every 30 frames
    if (Math.floor(time / 500) !== Math.floor((time - delta) / 500)) {
      this.updateMinimap(80);
    }

    // Sync player position to store
    useGameStore.getState().updatePlayerPosition(this.player.x, this.player.y);

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
    const speed = (gameStore.player?.stats?.speed ?? 150);

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
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.playerAttack();
    }

    // Interact
    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
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
        this.updateEnemyHPBar(enemy);

        // Hit flash
        const bodyImg = enemy.list[1] as Phaser.GameObjects.Image;
        this.tweens.add({
          targets: bodyImg,
          tint: { from: 0xffffff, to: 0xffffff },
          duration: 80,
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

  private castDamageSpell(baseDamage: number) {
    const gameStore = useGameStore.getState();
    const playerStats = gameStore.player?.stats;
    if (!playerStats) return;

    const spellRange = this.ATTACK_RANGE * 1.5;
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
    const px = this.player.x;
    const py = this.player.y;

    for (const enemy of this.enemies) {
      if (enemy.enemyData.state === 'dead') continue;

      const ed = enemy.enemyData;
      const dx = px - enemy.x;
      const dy = py - enemy.y;
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
            if (!this.playerInvincible) {
              const damage = Math.max(1, ed.attack - (useGameStore.getState().player?.stats?.defense ?? 0) * 0.5);
              this.combatSystem.damagePlayer(Math.round(damage));
              this.combatSystem.showDamageNumber(px, py, Math.round(damage), false);

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
      const ui = useUIStore.getState();
      const gameStore = useGameStore.getState();
      const token = gameStore.playerToken;

      const npcInfo = {
        id: nearestNPC.npcData.id,
        name: nearestNPC.npcData.name,
        role: nearestNPC.npcData.role as NPC['role'],
      };

      // Show temporary loading dialogue
      ui.openDialogue(npcInfo, 'Thinking...', []);

      let dialogue = nearestNPC.npcData.dialogue[Math.floor(Math.random() * nearestNPC.npcData.dialogue.length)];
      let options = [
        { text: 'Tell me about your quests', action: 'quest' },
        { text: 'Farewell', action: 'close' },
      ];

      if (token && gameStore.player) {
        try {
          const res = await fetch('/api/npcs/interact', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              npcId: nearestNPC.npcData.id,
              name: nearestNPC.npcData.name,
              role: nearestNPC.npcData.role,
              biome: nearestNPC.npcData.biome ?? 'plains',
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
  }

  private handleRemotePlayerLeft(data: { playerId: string }) {
    const remote = this.remotePlayers.get(data.playerId);
    if (remote) {
      remote.destroy();
      this.remotePlayers.delete(data.playerId);
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
    this.remotePlayers.clear();
  }
}

// Fix TS import for NPC role
type NPC = import('@shared/types').NPC;
