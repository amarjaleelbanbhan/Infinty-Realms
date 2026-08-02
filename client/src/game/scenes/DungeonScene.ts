import Phaser from 'phaser';
import { dungeonGenerator } from '@game/systems/DungeonGenerator';
import { CombatSystem } from '@game/systems/CombatSystem';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';
import { useSkillStore } from '@game/systems/SkillSystem';
import { useSettingsStore } from '@stores/useSettingsStore';
import { claimKillReward } from '@game/systems/combatApi';
import { soundSystem } from '@game/systems/SoundSystem';
import { getEffectiveStats } from '@game/systems/StatsHelper';
import { rollLoot } from '@game/systems/LootTable';
import { useQuestStore } from '@stores/useQuestStore';
import { useCodexStore } from '@stores/useCodexStore';
import { questSystem } from '@game/systems/QuestSystem';

const TILE_SIZE = 32;

interface EnemySprite extends Phaser.GameObjects.Container {
  enemyData: {
    id: string;
    type: string;
    name: string;
    hp: number;
    maxHp: number;
    speed: number;
    attack: number;
    defense: number;
    state: 'idle' | 'patrol' | 'chase' | 'attack' | 'dead';
    hpBar?: Phaser.GameObjects.Graphics;
    
    // Boss specific
    isBoss?: boolean;
    phase?: number;
    abilityCooldowns?: Record<string, number>;
    
    // Status effects
    stunTimer?: number;
    slowTimer?: number;
    burnTimer?: number;
    poisonTimer?: number;
    dotTickTimer?: number;
    burnDamage?: number;
    poisonDamage?: number;
  };
}

export class DungeonScene extends Phaser.Scene {
  private dungeonSeed!: string;
  private returnX = 0;
  private returnY = 0;

  private player!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.GameObjects.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: Record<string, Phaser.Input.Keyboard.Key>;
  private numberKeys!: Phaser.Input.Keyboard.Key[];
  private spaceKey!: Phaser.Input.Keyboard.Key;
  
  private isDashing = false;
  private dashTimeRemaining = 0;
  private dashCooldownRemaining = 0;
  private dashVelocity = { x: 0, y: 0 };
  public isPlayerInvulnerable = false;
  private shiftKey!: Phaser.Input.Keyboard.Key;

  private dungeonData: any;
  private wallLayer!: Phaser.Physics.Arcade.StaticGroup;
  private entityLayer!: Phaser.GameObjects.Container;

  private enemies: EnemySprite[] = [];
  private chests: Phaser.Physics.Arcade.Sprite[] = [];
  private keys: Phaser.Physics.Arcade.Sprite[] = [];
  private doors: Phaser.Physics.Arcade.Sprite[] = [];
  private exitPortal?: Phaser.Physics.Arcade.Sprite;

  private hasRedKey = false;
  private playerDirection = 'down';
  private playerAttackCooldown = 0;
  private ATTACK_RANGE = 24;

  private combatSystem!: CombatSystem;

  constructor() {
    super({ key: 'DungeonScene' });
  }

  init(data: { seed: string; returnX: number; returnY: number }) {
    this.dungeonSeed = data.seed ?? `dungeon-${Date.now()}`;
    this.returnX = data.returnX;
    this.returnY = data.returnY;
    this.enemies = [];
    this.chests = [];
    this.keys = [];
    this.doors = [];
    this.hasRedKey = false;
  }

  create() {
    this.combatSystem = new CombatSystem(this);
    this.entityLayer = this.add.container(0, 0);
    this.wallLayer = this.physics.add.staticGroup();

    // Create dynamic textures
    this.createDungeonTextures();

    // Generate Layout
    const gameStore = useGameStore.getState();
    const biome = gameStore.player?.worldSeed ? 'dungeon' : 'swamp';
    this.dungeonData = dungeonGenerator.generate(this.dungeonSeed, biome);

    this.drawDungeonTiles();
    this.setupInput();

    // Touch/mobile controls hook
    (window as Window & { __mobileDash?: () => void }).__mobileDash = () => {
      this.triggerDodgeRoll();
    };
    window.addEventListener('ir:trigger_dash', this.handleTriggerDash);
    window.addEventListener('ir:skill_cast', this.handleSkillCast);

    // Cleanup on scene shutdown/destroy
    this.events.on('shutdown', () => {
      window.removeEventListener('ir:trigger_dash', this.handleTriggerDash);
      window.removeEventListener('ir:skill_cast', this.handleSkillCast);
      delete (window as any).__mobileDash;
    });

    // Collision setup
    this.physics.add.collider(this.player, this.wallLayer);

    // Camera
    const mapW = this.dungeonData.grid[0].length * TILE_SIZE;
    const mapH = this.dungeonData.grid.length * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.2);

    // PostFX / Lighting
    const settings = useSettingsStore.getState();
    if (settings.postProcessing) {
      this.cameras.main.postFX.addVignette(0.5, 0.5, 0.85);
      this.cameras.main.postFX.addBloom(0xffffff, 1, 1, 0.8, 1.2);
    }
    // Overlaps
    this.physics.add.overlap(this.player, this.keys, this.collectKey as any, undefined, this);
    this.physics.add.overlap(this.player, this.chests, this.interactChest as any, undefined, this);
    this.physics.add.collider(this.player, this.doors, this.interactDoor as any, undefined, this);

    if (this.exitPortal) {
      this.physics.add.overlap(this.player, this.exitPortal, this.exitDungeon as any, undefined, this);
    }
    
    this.broadcastDungeonState();
  }
  
  private broadcastDungeonState() {
    window.dispatchEvent(new CustomEvent('dungeon-update', { detail: this.dungeonData }));
  }

  update(time: number, delta: number) {
    if (useUIStore.getState().currentScreen !== 'game') return;

    const dt = delta / 1000;

    // Process dodge roll state
    if (this.isDashing) {
      this.dashTimeRemaining -= delta;
      if (this.dashTimeRemaining <= 0) {
        this.isDashing = false;
        this.isPlayerInvulnerable = false;
        this.playerBody.setAngle(0);
        this.playerBody.setScale(1.0);
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
      } else {
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(this.dashVelocity.x, this.dashVelocity.y);

        if (Math.random() < 0.3) {
          this.spawnDashParticle(this.player.x, this.player.y);
        }
      }
    }

    this.handlePlayerInput(dt);
    this.updateEnemies(dt);

    if (this.playerAttackCooldown > 0) {
      this.playerAttackCooldown = Math.max(0, this.playerAttackCooldown - delta);
    }
    if (this.dashCooldownRemaining > 0) {
      this.dashCooldownRemaining = Math.max(0, this.dashCooldownRemaining - delta);
    }
  }

  private createDungeonTextures() {
    if (!this.textures.exists('tile-dungeon-wall')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x1a1a24, 1);
      g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      g.fillStyle(0x3a3a4a, 1);
      g.fillRect(2, 2, 28, 28);
      g.fillStyle(0x111118, 1);
      g.fillRect(6, 6, 20, 2);
      g.fillRect(6, 16, 20, 2);
      g.generateTexture('tile-dungeon-wall', TILE_SIZE, TILE_SIZE);
      g.destroy();
    }

    if (!this.textures.exists('tile-chest')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x8b5a2b, 1);
      g.fillRect(4, 6, 24, 20);
      g.fillStyle(0xd2b48c, 1);
      g.fillRect(6, 8, 20, 4);
      g.fillStyle(0xffd700, 1);
      g.fillRect(14, 14, 4, 4);
      g.generateTexture('tile-chest', TILE_SIZE, TILE_SIZE);
      g.destroy();
    }

    if (!this.textures.exists('tile-door')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x4a2e00, 1);
      g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      g.fillStyle(0xffd700, 1);
      g.fillRect(14, 12, 4, 8);
      g.generateTexture('tile-door', TILE_SIZE, TILE_SIZE);
      g.destroy();
    }

    if (!this.textures.exists('item-key')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xffd700, 1);
      g.fillRect(12, 4, 8, 8);
      g.fillStyle(0x000000, 1);
      g.fillRect(14, 6, 4, 4);
      g.fillStyle(0xffd700, 1);
      g.fillRect(15, 12, 2, 12);
      g.fillRect(15, 18, 4, 2);
      g.fillRect(15, 20, 4, 2);
      g.generateTexture('item-key', TILE_SIZE, TILE_SIZE);
      g.destroy();
    }

    if (!this.textures.exists('tile-portal')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x6c63ff, 0.4);
      g.fillCircle(16, 16, 14);
      g.fillStyle(0xff00ff, 0.7);
      g.fillCircle(16, 16, 8);
      g.generateTexture('tile-portal', TILE_SIZE, TILE_SIZE);
      g.destroy();
    }
  }

  private drawDungeonTiles() {
    const grid = this.dungeonData.grid;
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const val = grid[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        // Draw Floor by default
        const floor = this.add.image(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 'tile-dungeon');
        this.add.existing(floor);

        if (val === 1) {
          // Wall
          const wall = this.wallLayer.create(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 'tile-dungeon-wall');
          this.physics.add.existing(wall);
        } else if (val === 2) {
          // Locked Door
          const door = this.physics.add.sprite(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 'tile-door');
          door.setImmovable(true);
          this.physics.add.existing(door);
          this.doors.push(door);
        } else if (val === 3) {
          // Normal Door (just wall-collider that player can click)
          const door = this.physics.add.sprite(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 'tile-door');
          door.setImmovable(true);
          this.physics.add.existing(door);
          this.doors.push(door);
        } else if (val === 4) {
          // Key
          const key = this.physics.add.sprite(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 'item-key');
          this.physics.add.existing(key);
          this.keys.push(key);
        } else if (val === 5) {
          // Chest
          const chest = this.physics.add.sprite(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 'tile-chest');
          chest.setImmovable(true);
          this.physics.add.existing(chest);
          this.chests.push(chest);
        } else if (val === 6) {
          // Portal
          this.exitPortal = this.physics.add.sprite(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 'tile-portal');
          this.physics.add.existing(this.exitPortal);
        } else if (val === 7) {
          // Boss Spawn
          this.spawnBoss(px + TILE_SIZE / 2, py + TILE_SIZE / 2);
        } else if (val === 8) {
          // Spawn Player Container
          const body = this.add.image(0, 0, 'player');
          const shadow = this.add.ellipse(0, 12, 16, 6, 0x000000, 0.3);
          this.player = this.add.container(px + TILE_SIZE / 2, py + TILE_SIZE / 2, [shadow, body]);
          this.player.setDepth(20);
          this.physics.add.existing(this.player);
          (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
          this.playerBody = body;
          this.entityLayer.add(this.player);
        }
      }
    }
  }

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = this.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<string, Phaser.Input.Keyboard.Key>;

    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.numberKeys = [
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
    ];
  }

  private handlePlayerInput(dt: number) {
    if (this.isDashing) return;

    const playerStats = getEffectiveStats();
    const speed = playerStats.speed ?? 150;

    // Dash / Dodge Roll Trigger
    if (Phaser.Input.Keyboard.JustDown(this.shiftKey)) {
      this.triggerDodgeRoll();
      return;
    }

    let vx = 0, vy = 0;
    if (this.cursors.left.isDown || this.wasdKeys.left.isDown) {
      vx = -speed;
      this.playerDirection = 'left';
    } else if (this.cursors.right.isDown || this.wasdKeys.right.isDown) {
      vx = speed;
      this.playerDirection = 'right';
    }

    if (this.cursors.up.isDown || this.wasdKeys.up.isDown) {
      vy = -speed;
      this.playerDirection = 'up';
    } else if (this.cursors.down.isDown || this.wasdKeys.down.isDown) {
      vy = speed;
      this.playerDirection = 'down';
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(vx, vy);

    if (vx !== 0 || vy !== 0) {
      this.playerBody.setFlipX(vx < 0);
    }

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.playerAttack();
    }

    // Spells / Skills (Keys 1-4)
    this.numberKeys.forEach((key, idx) => {
      if (Phaser.Input.Keyboard.JustDown(key)) {
        const skillStore = useSkillStore.getState();
        const skill = skillStore.equippedSkills[idx];
        if (skill && skillStore.castSkill(skill.id)) {
          this.tweens.add({
            targets: this.playerBody,
            tint: { from: 0xffffff, to: 0xff4444 },
            duration: 150,
            yoyo: true,
          });

          if (skill.type === 'damage') {
            this.castDamageSpell(skill.value);
          }
        }
      }
    });
  }

  private playerAttack() {
    if (this.playerAttackCooldown > 0) return;
    this.playerAttackCooldown = 600;

    const gameStore = useGameStore.getState();
    if (!gameStore.player || !gameStore.player.stats) return;

    this.tweens.add({
      targets: this.playerBody,
      tint: { from: 0xffffff, to: 0xff4444 },
      duration: 100,
      yoyo: true,
    });

    const hitbox = this.combatSystem.getMeleeHitbox(this.player.x, this.player.y, this.playerDirection as any, this.ATTACK_RANGE);

    for (const enemy of this.enemies) {
      if (enemy.enemyData.state === 'dead') continue;
      if (hitbox.contains(enemy.x, enemy.y)) {
        const { damage, isCrit } = this.combatSystem.calculateDamage(
          gameStore.player.stats,
          { hp: enemy.enemyData.hp, maxHp: enemy.enemyData.maxHp, mana: 0, maxMana: 0, attack: enemy.enemyData.attack, defense: enemy.enemyData.defense, speed: enemy.enemyData.speed, luck: 5 },
          gameStore.player.stats.luck
        );

        enemy.enemyData.hp = Math.max(0, enemy.enemyData.hp - damage);
        this.combatSystem.showDamageNumber(enemy.x, enemy.y - 12, damage, isCrit);

        this.combatSystem.showHitEffect(enemy.x, enemy.y, 0xff0000);

        if (enemy.enemyData.hp <= 0) {
          this.handleEnemyDeath(enemy);
        } else {
          enemy.enemyData.state = 'chase';
          const body = enemy.list[1] as Phaser.GameObjects.Image;
          body.setTintFill(0xffffff);
          this.time.delayedCall(80, () => body.clearTint());
          this.tweens.add({
            targets: body,
            x: { from: 2, to: 0 },
            duration: 50,
            yoyo: true,
          });
        }
      }
    }
  }

  private castDamageSpell(val: number) {
    const gameStore = useGameStore.getState();
    const playerStats = gameStore.player?.stats;
    if (!playerStats || !gameStore.player) return;

    const biome = this.dungeonData?.biome ?? 'dungeon';

    // Define colors & sound based on biome
    let particleColor = 0xff00ff; // default purple
    if (biome === 'plains') {
      particleColor = 0x88ffff; // cyan
      soundSystem.playWind();
    } else if (biome === 'forest') {
      particleColor = 0x44ff44; // green
      soundSystem.playNature();
    } else if (biome === 'desert') {
      particleColor = 0xeedda8; // sand yellow
      soundSystem.playSand();
    } else if (biome === 'volcano') {
      particleColor = 0xff4400; // orange/red
      soundSystem.playFire();
    } else if (biome === 'snow') {
      particleColor = 0xddf0ff; // icy ice blue
      soundSystem.playIce();
    } else if (biome === 'swamp') {
      particleColor = 0x9932cc; // dark orchid purple/poison
      soundSystem.playPoison();
    } else { // default or dungeon
      particleColor = 0x4b0082; // indigo void
      soundSystem.playSpell();
    }

    // Spell particle explosion effect
    const particles = this.add.particles(this.player.x, this.player.y, 'fx-pixel', {
      speed: { min: 60, max: 220 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      tint: particleColor,
      blendMode: 'ADD',
      lifespan: 500,
      quantity: 20,
      emitting: false
    });
    particles.setDepth(99);
    particles.explode();

    // Clean up temporary particle emitters
    this.time.delayedCall(600, () => particles.destroy());

    const hitbox = this.combatSystem.getMeleeHitbox(this.player.x, this.player.y, this.playerDirection as any, this.ATTACK_RANGE * 2.0);

    for (const enemy of this.enemies) {
      if (enemy.enemyData.state === 'dead') continue;
      if (hitbox.contains(enemy.x, enemy.y)) {
        // Void/dungeon gets 25% crit chance boost
        const critMultiplier = biome === 'dungeon' ? 1.25 : 1.0;
        const luckValue = playerStats.luck * critMultiplier;
        const { damage, isCrit } = this.combatSystem.calculateDamage(
          playerStats,
          { hp: enemy.enemyData.hp, maxHp: enemy.enemyData.maxHp, mana: 0, maxMana: 0, attack: enemy.enemyData.attack, defense: enemy.enemyData.defense, speed: enemy.enemyData.speed, luck: 5 },
          luckValue
        );

        const spellDamage = Math.round(damage * (1 + val / 100));
        enemy.enemyData.hp = Math.max(0, enemy.enemyData.hp - spellDamage);
        this.combatSystem.showDamageNumber(enemy.x, enemy.y - 12, spellDamage, isCrit);

        const bodyImg = enemy.list[1] as Phaser.GameObjects.Image;
        this.tweens.add({
          targets: bodyImg,
          tint: { from: particleColor, to: 0xffffff },
          duration: 120,
          yoyo: true,
        });

        // Apply biome-reactive status effects
        if (biome === 'plains') {
          // Wind/Kinetic: Knockback enemy by 40px away from the player
          const dx = enemy.x - this.player.x;
          const dy = enemy.y - this.player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            const pushX = (dx / dist) * 40;
            const pushY = (dy / dist) * 40;
            this.tweens.add({
              targets: enemy,
              x: enemy.x + pushX,
              y: enemy.y + pushY,
              duration: 150,
              ease: 'Quad.easeOut'
            });
          }
        } else if (biome === 'forest') {
          // Forest: Entangling/Leech (heal player for 25% of damage dealt)
          const healAmount = Math.round(spellDamage * 0.25);
          if (healAmount > 0) {
            this.combatSystem.healPlayer(healAmount);
            this.combatSystem.showDamageNumber(this.player.x, this.player.y, healAmount, false, true);
          }
        } else if (biome === 'desert') {
          // Desert: Quicksand/Slow 50% for 3 seconds
          enemy.enemyData.slowTimer = 3.0;
        } else if (biome === 'volcano') {
          // Volcano: 4-sec Burn DOT (10% of spell damage per second)
          enemy.enemyData.burnTimer = 4.0;
          enemy.enemyData.burnDamage = Math.round(spellDamage * 0.10);
          enemy.enemyData.dotTickTimer = 0;
        } else if (biome === 'snow') {
          // Snow: 2-sec freezing Stun
          enemy.enemyData.stunTimer = 2.0;
        } else if (biome === 'swamp') {
          // Swamp: 5-sec Poison DOT (15% of spell damage per second)
          enemy.enemyData.poisonTimer = 5.0;
          enemy.enemyData.poisonDamage = Math.round(spellDamage * 0.15);
          enemy.enemyData.dotTickTimer = 0;
        }

        if (enemy.enemyData.hp <= 0) {
          this.handleEnemyDeath(enemy);
        } else {
          enemy.enemyData.state = 'chase';
        }
      }
    }
  }

  private spawnBoss(x: number, y: number) {
    const body = this.add.image(0, 0, 'enemy-dragon');
    body.setScale(1.5);
    body.setTint(0xff8888);

    const shadow = this.add.ellipse(0, 20, 24, 8, 0x000000, 0.4);

    const label = this.add.text(0, -32, 'Dungeon Warden', {
      fontFamily: 'Cinzel, serif',
      fontSize: '10px',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    const container = this.add.container(x, y, [shadow, body, label]) as EnemySprite;
    container.setDepth(20);
    this.physics.add.existing(container);
    (container.body as Phaser.Physics.Arcade.Body).setImmovable(true);

    container.enemyData = {
      id: `boss-${Date.now()}`,
      type: 'dragon',
      name: 'Dungeon Warden',
      hp: 500, // Boosted for phases
      maxHp: 500,
      speed: 60,
      attack: 30,
      defense: 25,
      state: 'idle',
      isBoss: true,
      phase: 1,
      abilityCooldowns: { aoe: 0, summon: 0 },
    };

    this.enemies.push(container);
    this.entityLayer.add(container);
  }

  private updateEnemies(dt: number) {
    this.enemies.forEach((enemy) => {
      if (enemy.enemyData.state === 'dead') return;

      const ed = enemy.enemyData;

      // Update status effect timers
      if (ed.stunTimer && ed.stunTimer > 0) ed.stunTimer = Math.max(0, ed.stunTimer - dt);
      if (ed.slowTimer && ed.slowTimer > 0) ed.slowTimer = Math.max(0, ed.slowTimer - dt);
      if (ed.burnTimer && ed.burnTimer > 0) ed.burnTimer = Math.max(0, ed.burnTimer - dt);
      if (ed.poisonTimer && ed.poisonTimer > 0) ed.poisonTimer = Math.max(0, ed.poisonTimer - dt);

      // Handle sprite tinting
      const bodyImage = enemy.list[1] as Phaser.GameObjects.Image;
      if (ed.stunTimer && ed.stunTimer > 0) {
        bodyImage.setTint(0x88ccff); // Icy blue for frozen/stunned
      } else if (ed.poisonTimer && ed.poisonTimer > 0) {
        bodyImage.setTint(0x32cd32); // Green for poison
      } else if (ed.burnTimer && ed.burnTimer > 0) {
        bodyImage.setTint(0xff8800); // Orange for burn
      } else if (ed.slowTimer && ed.slowTimer > 0) {
        bodyImage.setTint(0xd2b48c); // Brown for slow
      } else if (!ed.isBoss) {
        bodyImage.clearTint();
      } else {
        // Keep the boss tint based on phase
        bodyImage.setTint(ed.phase === 3 ? 0xff0000 : (ed.phase === 2 ? 0xff4444 : 0xff8888));
      }

      // Handle Damage-Over-Time (DOT) ticks
      if ((ed.burnTimer && ed.burnTimer > 0) || (ed.poisonTimer && ed.poisonTimer > 0)) {
        if (ed.dotTickTimer === undefined) ed.dotTickTimer = 0;
        ed.dotTickTimer += dt;
        if (ed.dotTickTimer >= 1.0) {
          ed.dotTickTimer -= 1.0;
          let tickDamage = 0;
          if (ed.burnTimer && ed.burnTimer > 0 && ed.burnDamage) {
            tickDamage += ed.burnDamage;
          }
          if (ed.poisonTimer && ed.poisonTimer > 0 && ed.poisonDamage) {
            tickDamage += ed.poisonDamage;
          }
          if (tickDamage > 0) {
            ed.hp = Math.max(0, ed.hp - tickDamage);
            this.combatSystem.showDamageNumber(enemy.x, enemy.y - 12, tickDamage, false);

            if (ed.hp <= 0) {
              this.handleEnemyDeath(enemy);
              return;
            }
          }
        }
      }

      const body = enemy.body as Phaser.Physics.Arcade.Body;
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 240) { // Increased aggro range slightly for boss rooms
        enemy.enemyData.state = 'chase';
        
        // Boss Mechanics
        if (enemy.enemyData.isBoss) {
          const hpPercent = enemy.enemyData.hp / enemy.enemyData.maxHp;
          let currentPhase = 1;
          if (hpPercent <= 0.3) currentPhase = 3;
          else if (hpPercent <= 0.6) currentPhase = 2;

          if (currentPhase !== enemy.enemyData.phase) {
            enemy.enemyData.phase = currentPhase;
            // Visual feedback for phase transition
            const image = enemy.list[1] as Phaser.GameObjects.Image;
            image.setTint(currentPhase === 3 ? 0xff0000 : (currentPhase === 2 ? 0xff4444 : 0xff8888));
            enemy.enemyData.speed = currentPhase === 3 ? 90 : (currentPhase === 2 ? 75 : 60);
          }

          // Phase 2+ AoE Attacks
          if (currentPhase >= 2 && enemy.enemyData.abilityCooldowns) {
            enemy.enemyData.abilityCooldowns.aoe -= dt;
            if (enemy.enemyData.abilityCooldowns.aoe <= 0) {
              enemy.enemyData.abilityCooldowns.aoe = 4.0; // 4 second cooldown
              this.castBossAoE(enemy);
            }
          }

          // Phase 3 Summoning
          if (currentPhase === 3 && enemy.enemyData.abilityCooldowns) {
            enemy.enemyData.abilityCooldowns.summon -= dt;
            if (enemy.enemyData.abilityCooldowns.summon <= 0) {
              enemy.enemyData.abilityCooldowns.summon = 8.0;
              this.summonMinions(enemy);
            }
          }
        }

        if (ed.stunTimer && ed.stunTimer > 0) {
          // Stunned! Skip movement and attacks
          body.setVelocity(0, 0);
          return;
        }

        let speedMult = 1.0;
        if (ed.slowTimer && ed.slowTimer > 0) {
          speedMult = 0.5; // 50% slow
        }

        const vx = (dx / dist) * enemy.enemyData.speed * speedMult;
        const vy = (dy / dist) * enemy.enemyData.speed * speedMult;
        body.setVelocity(vx, vy);
        (enemy.list[1] as Phaser.GameObjects.Image).setFlipX(vx < 0);

        if (dist < 26) {
          this.enemyAttack(enemy);
        }
      } else {
        body.setVelocity(0, 0);
      }
    });
  }

  private castBossAoE(boss: EnemySprite) {
    const tx = this.player.x;
    const ty = this.player.y;
    
    // Create telegraph graphic
    const telegraph = this.add.graphics();
    telegraph.lineStyle(2, 0xff0000, 0.8);
    telegraph.fillStyle(0xff0000, 0.2);
    telegraph.strokeCircle(tx, ty, 48);
    telegraph.fillCircle(tx, ty, 48);
    telegraph.setDepth(5);
    
    // Scale up tween to show impending doom
    this.tweens.add({
      targets: telegraph,
      alpha: 0.5,
      scale: 1.1,
      duration: 1500,
      onComplete: () => {
        // Explode
        telegraph.destroy();
        
        // Damage calculation if player is in range
        const dx = this.player.x - tx;
        const dy = this.player.y - ty;
        if (Math.sqrt(dx * dx + dy * dy) < 48) {
          this.combatSystem.damagePlayer(boss.enemyData.attack * 1.5);
          useUIStore.getState().addToast('Hit by AoE!', 'error');
        }
        
        // Explosion visual
        const explosion = this.add.circle(tx, ty, 48, 0xff0000, 0.8);
        this.tweens.add({
          targets: explosion,
          alpha: 0,
          scale: 1.5,
          duration: 300,
          onComplete: () => explosion.destroy()
        });
      }
    });
  }

  private summonMinions(boss: EnemySprite) {
    for (let i = 0; i < 2; i++) {
      const offsetX = (Math.random() - 0.5) * 100;
      const offsetY = (Math.random() - 0.5) * 100;
      
      const body = this.add.image(0, 0, 'enemy-orc');
      body.setTint(0xff8888);
      const shadow = this.add.ellipse(0, 16, 20, 6, 0x000000, 0.4);
      
      const container = this.add.container(boss.x + offsetX, boss.y + offsetY, [shadow, body]) as EnemySprite;
      container.setDepth(20);
      this.physics.add.existing(container);
      
      container.enemyData = {
        id: `minion-${Date.now()}-${i}`,
        type: 'orc',
        name: 'Warden Minion',
        hp: 50,
        maxHp: 50,
        speed: 80,
        attack: 10,
        defense: 5,
        state: 'chase'
      };
      
      this.enemies.push(container);
      this.entityLayer.add(container);
    }
  }

  private enemyAttack(enemy: EnemySprite) {
    const gameStore = useGameStore.getState();
    if (!gameStore.player) return;

    this.combatSystem.damagePlayer(enemy.enemyData.attack);
    this.tweens.add({
      targets: enemy.list[1],
      scaleX: { from: 1.8, to: 1.5 },
      scaleY: { from: 1.8, to: 1.5 },
      duration: 100,
      yoyo: true,
    });
  }

  private handleEnemyDeath(enemy: EnemySprite) {
    enemy.enemyData.state = 'dead';
    this.combatSystem.showDeathEffect(enemy.x, enemy.y);

    claimKillReward(enemy.enemyData.type ?? 'dungeon_mob', (enemy.enemyData as any).level ?? 1);
    useCodexStore.getState().recordEnemyKill(enemy.enemyData.type ?? 'dungeon_mob');

    // Roll loot
    const lootItem = rollLoot(useGameStore.getState().player?.level ?? 1);
    if (lootItem) {
      useGameStore.getState().addToInventory(lootItem, 1);
      useUIStore.getState().addToast(`Looted: ${lootItem.icon} ${lootItem.name}`, 'success');
    }

    // Progress active kill quests
    const activeQuests = useQuestStore.getState().quests.filter(q => q.status === 'active');
    for (const quest of activeQuests) {
      quest.objectives.forEach((obj, i) => {
        if (obj.targetType === 'enemy' && obj.current < obj.quantity) {
          questSystem.progressObjective(quest.id, i, 1);
        }
      });
    }
  }

  private collectKey(player: any, key: Phaser.Physics.Arcade.Sprite) {
    key.destroy();
    this.keys = this.keys.filter((k) => k !== key);
    this.hasRedKey = true;

    // Show banner alert
    const banner = this.add.text(this.player.x, this.player.y - 48, 'Red Key Collected!', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: banner,
      y: banner.y - 20,
      alpha: 0,
      duration: 1500,
      onComplete: () => banner.destroy(),
    });
  }

  private interactChest(player: any, chest: Phaser.Physics.Arcade.Sprite) {
    chest.destroy();
    this.chests = this.chests.filter((c) => c !== chest);

    const store = useGameStore.getState();
    const goldDrop = 25 + Math.floor(Math.random() * 50);
    store.addGold(goldDrop);

    const banner = this.add.text(this.player.x, this.player.y - 48, `+${goldDrop} Gold!`, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: banner,
      y: banner.y - 20,
      alpha: 0,
      duration: 1500,
      onComplete: () => banner.destroy(),
    });
  }

  private interactDoor(player: any, door: Phaser.Physics.Arcade.Sprite) {
    // Check if there are enemies nearby (within 300 pixels = roughly 1 room size)
    const enemiesNearby = this.enemies.some(e => {
      const dx = e.x - door.x;
      const dy = e.y - door.y;
      return (dx * dx + dy * dy) < 300 * 300;
    });

    if (enemiesNearby) {
      // Bounce player back
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(-body.velocity.x * 0.5, -body.velocity.y * 0.5);

      const banner = this.add.text(this.player.x, this.player.y - 48, 'Locked by dark energy!', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        color: '#a855f7',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5);

      this.tweens.add({
        targets: banner,
        y: banner.y - 15,
        alpha: 0,
        duration: 1200,
        onComplete: () => banner.destroy(),
      });
    } else {
      // Unlock door
      door.destroy();
      this.doors = this.doors.filter((d) => d !== door);
    }
  }

  private exitDungeon() {
    this.scene.stop('DungeonScene');
    this.scene.start('WorldScene', { returnFromDungeon: true, rx: this.returnX, ry: this.returnY });
  }

  private handleTriggerDash = (() => {
    this.triggerDodgeRoll();
  }).bind(this);

  private handleSkillCast = ((e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail.type === 'damage' || detail.type === 'utility') {
      const dmg = detail.damage || detail.value || 30;
      const spellRange = this.ATTACK_RANGE * 2.0;
      for (const enemy of this.enemies) {
        if (enemy.enemyData.state === 'dead') continue;
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        if (Math.sqrt(dx * dx + dy * dy) < spellRange) {
          enemy.enemyData.hp -= dmg;
          this.combatSystem.showDamageNumber(enemy.x, enemy.y - 12, dmg, false);
          if (enemy.enemyData.hp <= 0) {
            this.handleEnemyDeath(enemy);
          } else {
            enemy.enemyData.state = 'chase';
          }
        }
      }
    }
  }).bind(this);

  private triggerDodgeRoll() {
    if (this.isDashing || this.dashCooldownRemaining > 0) {
      return;
    }

    const gameStore = useGameStore.getState();
    if (!gameStore.player || gameStore.isDead) return;

    // Determine direction
    let dx = 0;
    let dy = 0;

    if (this.cursors.left.isDown  || this.wasdKeys.left.isDown)  dx = -1;
    if (this.cursors.right.isDown || this.wasdKeys.right.isDown) dx = 1;
    if (this.cursors.up.isDown    || this.wasdKeys.up.isDown)    dy = -1;
    if (this.cursors.down.isDown  || this.wasdKeys.down.isDown)  dy = 1;

    if (dx === 0 && dy === 0) {
      switch (this.playerDirection) {
        case 'up':    dy = -1; break;
        case 'down':  dy = 1; break;
        case 'left':  dx = -1; break;
        case 'right': dx = 1; break;
      }
    }

    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
    }

    this.isDashing = true;
    this.isPlayerInvulnerable = true;
    this.dashTimeRemaining = 250;
    this.dashCooldownRemaining = 1200;

    const baseSpeed = gameStore.player?.stats?.speed ?? 150;
    const dashSpeed = baseSpeed * 2.5;
    this.dashVelocity = { x: dx * dashSpeed, y: dy * dashSpeed };

    soundSystem.playDash();

    // Dispatch event to HUD for cooldown rendering
    window.dispatchEvent(new CustomEvent('ir:dash_cast', { detail: { cooldown: 1200 } }));

    this.tweens.add({
      targets: this.playerBody,
      angle: dx >= 0 ? 360 : -360,
      scaleX: { from: 1.2, to: 1.0 },
      scaleY: { from: 0.8, to: 1.0 },
      duration: 250,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.playerBody.setAngle(0);
        this.playerBody.setScale(1.0);
      }
    });

    this.spawnDashBurst(this.player.x, this.player.y);
  }

  private spawnDashBurst(x: number, y: number) {
    if (!this.textures.exists('fx-pixel')) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 4, 4);
      g.generateTexture('fx-pixel', 4, 4);
    }

    const particles = this.add.particles(x, y, 'fx-pixel', {
      color: [0xdddddd, 0xaaaaaa, 0x777777],
      lifespan: 400,
      angle: { min: 0, max: 360 },
      speed: { min: 40, max: 100 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      emitting: false,
    });
    particles.explode(10);
    this.time.delayedCall(450, () => particles.destroy());
  }

  private spawnDashParticle(x: number, y: number) {
    if (!this.textures.exists('fx-pixel')) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 4, 4);
      g.generateTexture('fx-pixel', 4, 4);
    }

    const particle = this.add.image(x, y, 'fx-pixel');
    particle.setTint(0xbbbbbb);
    particle.setAlpha(0.5);
    particle.setScale(1.2);
    this.tweens.add({
      targets: particle,
      alpha: 0,
      scale: 0,
      duration: 300,
      onComplete: () => particle.destroy()
    });
  }
}
