import Phaser from 'phaser';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';

const TILE_SIZE = 32;

export class HousingScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: any;
  private exitZone!: Phaser.GameObjects.Zone;

  constructor() {
    super('HousingScene');
  }

  preload() {
    // Assets inherited from WorldScene preload, or load specifics here
  }

  create() {
    useUIStore.getState().setScreen('game');

    // Simple wood floor
    const bg = this.add.graphics();
    bg.fillStyle(0x5c4033, 1);
    bg.fillRect(0, 0, 800, 600);

    // Grid
    bg.lineStyle(1, 0x3e2723, 0.5);
    for (let x = 0; x <= 800; x += TILE_SIZE) bg.lineBetween(x, 0, x, 600);
    for (let y = 0; y <= 600; y += TILE_SIZE) bg.lineBetween(0, y, 800, y);

    // Player
    this.player = this.add.sprite(400, 300, 'player-down');
    
    // Exit zone (door)
    this.exitZone = this.add.zone(400, 580, 100, 40);
    this.physics.world.enable(this.exitZone);
    const doorGraphics = this.add.graphics();
    doorGraphics.fillStyle(0x000000, 0.5);
    doorGraphics.fillRect(350, 560, 100, 40);

    // Input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }

    const houseName = this.add.text(400, 50, "Player's Cozy Shack", {
      fontFamily: 'Cinzel, serif',
      fontSize: '24px',
      color: '#ffd700',
    }).setOrigin(0.5);
  }

  update(time: number, delta: number) {
    if (!this.player || !this.cursors) return;
    const dt = delta / 1000;
    const speed = 150;

    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -speed;
    if (this.cursors.right.isDown || this.wasd.right.isDown) vx = speed;
    if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -speed;
    if (this.cursors.down.isDown || this.wasd.down.isDown) vy = speed;

    this.player.x += vx * dt;
    this.player.y += vy * dt;

    // Check exit
    if (this.player.y > 570 && Math.abs(this.player.x - 400) < 50) {
      this.scene.start('WorldScene');
    }
  }
}
