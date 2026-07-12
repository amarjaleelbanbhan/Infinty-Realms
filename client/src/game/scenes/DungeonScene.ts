import Phaser from 'phaser';
import { dungeonGenerator } from '@game/systems/DungeonGenerator';
import { CombatSystem } from '@game/systems/CombatSystem';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';
import { useSkillStore } from '@game/systems/SkillSystem';

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

    // Collision setup
    this.physics.add.collider(this.player, this.wallLayer);

    // Camera
    const mapW = this.dungeonData.grid[0].length * TILE_SIZE;
    const mapH = this.dungeonData.grid.length * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.2);

    // PostFX / Lighting
    this.cameras.main.postFX.addVignette(0.5, 0.5, 0.8); // Darker vignette for dungeon
    this.cameras.main.postFX.addBloom(0xffffff, 1, 1, 0.8, 1.2);
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
    this.handlePlayerInput(dt);
    this.updateEnemies(dt);

    if (this.playerAttackCooldown > 0) {
      this.playerAttackCooldown = Math.max(0, this.playerAttackCooldown - delta);
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
    this.numberKeys = [
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
    ];
  }

  private handlePlayerInput(dt: number) {
    const gameStore = useGameStore.getState();
    const speed = gameStore.player?.stats?.speed ?? 150;

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

        if (enemy.enemyData.hp <= 0) {
          this.handleEnemyDeath(enemy);
        } else {
          enemy.enemyData.state = 'chase';
          const body = enemy.list[1] as Phaser.GameObjects.Image;
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
    if (!gameStore.player || !gameStore.player.stats) return;

    const hitbox = this.combatSystem.getMeleeHitbox(this.player.x, this.player.y, this.playerDirection as any, this.ATTACK_RANGE * 2.0);

    for (const enemy of this.enemies) {
      if (enemy.enemyData.state === 'dead') continue;
      if (hitbox.contains(enemy.x, enemy.y)) {
        const { damage, isCrit } = this.combatSystem.calculateDamage(
          gameStore.player.stats,
          { hp: enemy.enemyData.hp, maxHp: enemy.enemyData.maxHp, mana: 0, maxMana: 0, attack: enemy.enemyData.attack, defense: enemy.enemyData.defense, speed: enemy.enemyData.speed, luck: 5 },
          gameStore.player.stats.luck
        );

        const spellDamage = Math.round(damage * (1 + val / 100));
        enemy.enemyData.hp = Math.max(0, enemy.enemyData.hp - spellDamage);
        this.combatSystem.showDamageNumber(enemy.x, enemy.y - 12, spellDamage, isCrit);

        if (enemy.enemyData.hp <= 0) {
          this.handleEnemyDeath(enemy);
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
      hp: 300,
      maxHp: 300,
      speed: 60,
      attack: 30,
      defense: 25,
      state: 'idle',
    };

    this.enemies.push(container);
    this.entityLayer.add(container);
  }

  private updateEnemies(dt: number) {
    this.enemies.forEach((enemy) => {
      if (enemy.enemyData.state === 'dead') return;

      const body = enemy.body as Phaser.Physics.Arcade.Body;
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 180) {
        enemy.enemyData.state = 'chase';
        const vx = (dx / dist) * enemy.enemyData.speed;
        const vy = (dy / dist) * enemy.enemyData.speed;
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
    (enemy.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    (enemy.body as Phaser.Physics.Arcade.Body).enable = false;

    this.tweens.add({
      targets: enemy,
      alpha: 0,
      angle: 90,
      duration: 800,
      onComplete: () => {
        enemy.destroy();
        this.enemies = this.enemies.filter((e) => e !== enemy);
        
        if (enemy.enemyData.type === 'dragon') {
          this.dungeonData.bossAlive = false;
          useUIStore.getState().addToast('Dungeon Warden Defeated!', 'success');
        }
        
        this.broadcastDungeonState();
      },
    });

    const store = useGameStore.getState();
    store.addExperience(40);
    store.addGold(15);
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
}
