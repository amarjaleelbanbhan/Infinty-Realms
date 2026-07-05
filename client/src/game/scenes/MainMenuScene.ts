// ============================================================
// Main Menu Scene — Animated title screen
// ============================================================

import Phaser from 'phaser';
import { useUIStore } from '@stores/useUIStore';
import { useGameStore } from '@stores/useGameStore';

export class MainMenuScene extends Phaser.Scene {
  private stars: Phaser.GameObjects.Graphics[] = [];
  private title!: Phaser.GameObjects.Text;
  private subtitle!: Phaser.GameObjects.Text;
  private floatingParticles: Array<{ g: Phaser.GameObjects.Graphics; vy: number; vx: number; alpha: number }> = [];
  private bgGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Notify React that Phaser is ready
    useUIStore.getState().setScreen('menu');

    // ── Background gradient ──
    this.bgGraphics = this.add.graphics();
    this.drawBackground(width, height);

    // ── Star field ──
    this.createStars(width, height);

    // ── Floating realm particles ──
    this.createAmbientParticles(width, height);

    // ── Title ──
    this.title = this.add.text(width / 2, height * 0.35, 'INFINITY REALMS', {
      fontFamily: 'Cinzel, serif',
      fontSize: Math.min(64, width * 0.09) + 'px',
      color: '#ffffff',
      stroke: '#6c63ff',
      strokeThickness: 2,
      shadow: { offsetX: 0, offsetY: 0, color: '#6c63ff', blur: 30, fill: true },
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: this.title,
      alpha: 1,
      y: height * 0.32,
      duration: 1500,
      ease: 'Power2',
    });

    // ── Subtitle (lore tagline) ──
    this.subtitle = this.add.text(width / 2, height * 0.44, 'You are a Leyline Seeker — shape the world or let it consume you.', {
      fontFamily: 'Cinzel, serif',
      fontSize: Math.min(15, width * 0.022) + 'px',
      color: '#a89fff',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: this.subtitle,
      alpha: 1,
      duration: 1200,
      delay: 600,
      ease: 'Power2',
    });

    // ── Lore hook ──
    const loreText = this.add.text(
      width / 2,
      height * 0.50,
      'A living world breathes around you.\nEvery seed. Every choice. Every leyline node you claim echoes across the realm.',
      {
        fontFamily: 'Inter, sans-serif',
        fontSize: Math.min(13, width * 0.018) + 'px',
        color: '#5a6480',
        align: 'center',
      }
    ).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: loreText,
      alpha: 1,
      duration: 1000,
      delay: 900,
      ease: 'Power2',
    });

    // ── Version tag ──
    this.add.text(width - 12, height - 12, 'v0.1.0 Alpha', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      color: '#4a4a6a',
    }).setOrigin(1, 1);

    // ── Open source tag ──
    this.add.text(12, height - 12, '⭐ Open Source', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      color: '#6c63ff',
    }).setOrigin(0, 1);

    // ── Hide native loading screen ──
    setTimeout(() => {
      (window as Window & { __hideLoading?: () => void }).__hideLoading?.();
    }, 100);

    // ── Animated background loop ──
    this.time.addEvent({
      delay: 3000,
      loop: true,
      callback: () => this.spawnParticle(width, height),
    });
  }

  private drawBackground(width: number, height: number) {
    this.bgGraphics.fillGradientStyle(0x0a0a1a, 0x1a0a2e, 0x0a1a2e, 0x0a0a1a, 1);
    this.bgGraphics.fillRect(0, 0, width, height);
  }

  private createStars(width: number, height: number) {
    const count = Math.floor((width * height) / 4000);
    for (let i = 0; i < count; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height * 0.8;
      const size = Math.random() * 2 + 0.5;
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 0.3 + Math.random() * 0.7);
      g.fillCircle(x, y, size);
      this.stars.push(g);

      this.tweens.add({
        targets: g,
        alpha: { from: g.alpha, to: Math.random() * 0.4 + 0.1 },
        duration: 1500 + Math.random() * 3000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private createAmbientParticles(width: number, height: number) {
    for (let i = 0; i < 8; i++) {
      this.spawnParticle(width, height);
    }
  }

  private spawnParticle(width: number, height: number) {
    const colors = [0x6c63ff, 0x8b83ff, 0x4040cc, 0xffd700, 0x5de88b];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const g = this.add.graphics();
    g.fillStyle(color, 0.6);
    g.fillCircle(0, 0, 2 + Math.random() * 3);

    const x = Math.random() * width;
    const y = height + 20;
    g.setPosition(x, y);

    this.tweens.add({
      targets: g,
      y: -20,
      x: x + (Math.random() - 0.5) * 200,
      alpha: 0,
      duration: 8000 + Math.random() * 8000,
      ease: 'Linear',
      onComplete: () => g.destroy(),
    });
  }

  update() {
    // Parallax twinkling — handled by tweens
  }
}
