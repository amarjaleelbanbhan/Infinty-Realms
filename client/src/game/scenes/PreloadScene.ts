// ============================================================
// Preload Scene — generate procedural textures programmatically
// No external asset files required! All tiles are canvas-drawn.
// ============================================================

import Phaser from 'phaser';
import { BIOME_TILE_COLOR } from '@game/systems/WorldGenerator';
import type { BiomeType } from '@shared/types';

const TILE_SIZE = 32;

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    // Show a loading progress bar
    this.createLoadingBar();
  }

  create() {
    // Generate all tile textures programmatically using canvas
    this.generateTileTextures();
    this.generateEntityTextures();
    this.generateUITextures();

    this.scene.start('MainMenuScene');
  }

  private createLoadingBar() {
    const { width, height } = this.cameras.main;
    const bar = this.add.graphics();

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(0x1a1a3a, 1);
      bar.fillRect(width / 2 - 160, height / 2 - 4, 320, 8);
      bar.fillStyle(0x6c63ff, 1);
      bar.fillRect(width / 2 - 160, height / 2 - 4, 320 * value, 8);
    });

    this.load.on('complete', () => bar.destroy());
  }

  private generateTileTextures() {
    const biomes: BiomeType[] = ['ocean', 'beach', 'plains', 'forest', 'desert', 'snow', 'volcano', 'swamp', 'dungeon'];

    for (const biome of biomes) {
      this.generateBiomeTile(biome);
    }

    // Special tiles
    this.generateCityTile();
    this.generateDungeonEntrance();
    this.generateTreeTile();
    this.generateWaterTile();
  }

  private generateBiomeTile(biome: BiomeType) {
    const { base, accent } = BIOME_TILE_COLOR[biome];
    const graphics = this.make.graphics({ x: 0, y: 0 });

    // Base tile
    graphics.fillStyle(base, 1);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    // Texture details based on biome
    graphics.fillStyle(accent, 0.4);

    switch (biome) {
      case 'ocean':
        // Wave pattern
        for (let i = 0; i < 3; i++) {
          graphics.fillRect(4 + i * 10, 10 + i * 4, 8, 2);
        }
        break;
      case 'forest':
        // Tree dots
        for (let i = 0; i < 4; i++) {
          graphics.fillCircle(8 + (i % 2) * 16, 8 + Math.floor(i / 2) * 16, 5);
        }
        break;
      case 'desert':
        // Sand ripples
        graphics.fillRect(6, 12, 20, 1);
        graphics.fillRect(4, 18, 24, 1);
        graphics.fillRect(8, 24, 16, 1);
        break;
      case 'snow':
        // Snow sparkles
        graphics.fillStyle(0xffffff, 0.6);
        for (let i = 0; i < 5; i++) {
          const sx = 4 + Math.floor(i * 5.5);
          const sy = 4 + (i % 3) * 10;
          graphics.fillRect(sx, sy, 2, 2);
        }
        break;
      case 'swamp':
        // Murky patches
        graphics.fillStyle(0x1a3a1a, 0.5);
        graphics.fillCircle(10, 20, 6);
        graphics.fillCircle(22, 12, 5);
        break;
      case 'volcano':
        // Lava cracks
        graphics.fillStyle(0xff4400, 0.6);
        graphics.fillRect(4, 16, 2, 8);
        graphics.fillRect(16, 8, 2, 14);
        graphics.fillRect(24, 20, 2, 8);
        break;
      case 'plains':
        // Grass tufts
        graphics.fillStyle(0x6a9c40, 0.5);
        graphics.fillRect(8, 20, 3, 6);
        graphics.fillRect(18, 14, 3, 8);
        break;
      default:
        break;
    }

    // Subtle grid edge
    graphics.lineStyle(1, 0x000000, 0.08);
    graphics.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);

    graphics.generateTexture(`tile-${biome}`, TILE_SIZE, TILE_SIZE);
    graphics.destroy();
  }

  private generateCityTile() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x8a7060, 1); // Stone
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    // Building outlines
    g.fillStyle(0x6a5040, 1);
    g.fillRect(4, 12, 10, 16);
    g.fillRect(18, 8, 10, 20);
    g.fillStyle(0xcc8844, 1);
    g.fillRect(8, 4, 6, 8); // Roof left
    g.fillRect(20, 2, 8, 8); // Roof right
    g.fillStyle(0x2a1a0a, 1);
    g.fillRect(7, 20, 4, 6); // Door left
    g.fillRect(21, 18, 4, 8); // Door right
    g.generateTexture('tile-city', TILE_SIZE, TILE_SIZE);
    g.destroy();
  }

  private generateDungeonEntrance() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x1a1a2a, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    // Arch
    g.fillStyle(0x3a3a4a, 1);
    g.fillRect(6, 0, 20, 24);
    g.fillStyle(0x0a0a1a, 1);
    g.fillRect(10, 4, 12, 20); // Dark opening
    g.fillStyle(0x5a4a3a, 1);
    g.fillRect(4, 22, 24, 4); // Stone base
    // Rune glow
    g.fillStyle(0x6c63ff, 0.6);
    g.fillRect(14, 8, 4, 4);
    g.generateTexture('tile-dungeon-entrance', TILE_SIZE, TILE_SIZE);
    g.destroy();
  }

  private generateTreeTile() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x2d5a27, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(0x4a8c3a, 1);
    g.fillCircle(16, 12, 12);
    g.fillStyle(0x3a7a2a, 1);
    g.fillCircle(16, 10, 9);
    g.fillStyle(0x6a4a2a, 1);
    g.fillRect(13, 20, 6, 10); // Trunk
    g.generateTexture('tile-tree', TILE_SIZE, TILE_SIZE);
    g.destroy();
  }

  private generateWaterTile() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x1a4a8a, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(0x2a6aaa, 0.5);
    for (let i = 0; i < 4; i++) {
      g.fillRect(2 + i * 8, 8 + (i % 2) * 8, 14, 3);
    }
    g.generateTexture('tile-water', TILE_SIZE, TILE_SIZE);
    g.destroy();
  }

  private generateEntityTextures() {
    // Player sprite
    this.generatePlayerSprite();

    // Enemy sprites
    this.generateEnemySprite('goblin', 0x3a8a3a);
    this.generateEnemySprite('orc', 0x5a3a8a);
    this.generateEnemySprite('skeleton', 0xd4c8a0);
    this.generateEnemySprite('wolf', 0x7a6a5a);

    // NPC sprites
    this.generateNPCSprite('merchant', 0xc4902a);
    this.generateNPCSprite('quest_giver', 0x4a8aaa);
    this.generateNPCSprite('guard', 0x6a6aaa);
    this.generateNPCSprite('villager', 0x8a6a4a);
    this.generateNPCSprite('innkeeper', 0xaa6a2a);

    // Items
    this.generateItemSprite('sword', 0xc0c0c0);
    this.generateItemSprite('potion', 0xe85d5d);
    this.generateItemSprite('gold', 0xffd700);
    this.generateItemSprite('scroll', 0xd4b483);
    this.generateItemSprite('gem', 0x6c63ff);
  }

  private generatePlayerSprite() {
    const W = 24, H = 32;
    const g = this.make.graphics({ x: 0, y: 0 });

    // Shadow
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(12, 30, 16, 6);

    // Body
    g.fillStyle(0x2a4a8a, 1);
    g.fillRect(7, 16, 10, 12);

    // Head
    g.fillStyle(0xf4a460, 1);
    g.fillCircle(12, 10, 8);

    // Hair
    g.fillStyle(0x4a3a2a, 1);
    g.fillRect(5, 4, 14, 5);

    // Eyes
    g.fillStyle(0x1a1a2a, 1);
    g.fillRect(9, 9, 2, 2);
    g.fillRect(14, 9, 2, 2);

    // Sword
    g.fillStyle(0xc0c0c0, 1);
    g.fillRect(19, 10, 3, 14);
    g.fillStyle(0x8a6a2a, 1);
    g.fillRect(17, 18, 7, 3);

    // Legs
    g.fillStyle(0x3a2a4a, 1);
    g.fillRect(7, 26, 4, 6);
    g.fillRect(13, 26, 4, 6);

    g.generateTexture('player', W, H);
    g.destroy();
  }

  private generateEnemySprite(type: string, color: number) {
    const W = 24, H = 28;
    const g = this.make.graphics({ x: 0, y: 0 });

    // Shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(12, 27, 16, 5);

    // Body
    g.fillStyle(color, 1);
    g.fillRect(6, 12, 12, 12);

    // Head
    g.fillStyle(color, 1);
    g.fillCircle(12, 8, 7);

    // Eyes (red for enemies)
    g.fillStyle(0xff2222, 1);
    g.fillRect(8, 6, 3, 3);
    g.fillRect(14, 6, 3, 3);

    // Menacing eyebrows
    g.fillStyle(0x1a0a0a, 1);
    g.fillRect(7, 4, 5, 1);
    g.fillRect(13, 4, 5, 1);

    // Legs
    g.fillStyle(color, 0.8);
    g.fillRect(6, 22, 4, 6);
    g.fillRect(14, 22, 4, 6);

    g.generateTexture(`enemy-${type}`, W, H);
    g.destroy();
  }

  private generateNPCSprite(role: string, color: number) {
    const W = 24, H = 32;
    const g = this.make.graphics({ x: 0, y: 0 });

    // Shadow
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(12, 31, 14, 5);

    // Body
    g.fillStyle(color, 1);
    g.fillRect(7, 15, 10, 13);

    // Head
    g.fillStyle(0xf4c090, 1);
    g.fillCircle(12, 9, 8);

    // Eyes (friendly — slightly lower)
    g.fillStyle(0x2a1a0a, 1);
    g.fillRect(9, 10, 2, 2);
    g.fillRect(14, 10, 2, 2);

    // Smile
    g.fillStyle(0x2a1a0a, 1);
    g.fillRect(10, 14, 5, 1);

    // Role-specific details
    if (role === 'merchant') {
      g.fillStyle(0x8a6a2a, 1);
      g.fillRect(6, 14, 12, 3); // Belt/sash
    } else if (role === 'guard') {
      g.fillStyle(0x5a5a8a, 1);
      g.fillRect(5, 14, 14, 4); // Armor
    }

    g.generateTexture(`npc-${role}`, W, H);
    g.destroy();
  }

  private generateItemSprite(type: string, color: number) {
    const SIZE = 20;
    const g = this.make.graphics({ x: 0, y: 0 });

    switch (type) {
      case 'sword':
        g.fillStyle(color, 1);
        g.fillRect(8, 1, 4, 14);
        g.fillStyle(0x8a6a2a, 1);
        g.fillRect(4, 12, 12, 3);
        g.fillStyle(color, 0.6);
        g.fillRect(9, 14, 2, 5);
        break;
      case 'potion':
        g.fillStyle(0x8a8a8a, 1);
        g.fillRect(8, 2, 4, 4);
        g.fillStyle(color, 0.9);
        g.fillEllipse(10, 13, 14, 16);
        g.fillStyle(0xffffff, 0.3);
        g.fillEllipse(7, 10, 4, 6);
        break;
      case 'gold':
        g.fillStyle(color, 1);
        g.fillCircle(10, 10, 8);
        g.fillStyle(0xb8960a, 1);
        g.fillCircle(10, 10, 6);
        g.fillStyle(color, 1);
        g.fillRect(8, 6, 4, 8);
        break;
      case 'scroll':
        g.fillStyle(color, 1);
        g.fillRoundedRect(3, 4, 14, 14, 2);
        g.fillStyle(0xb89060, 0.6);
        g.fillRect(5, 7, 10, 1);
        g.fillRect(5, 10, 10, 1);
        g.fillRect(5, 13, 7, 1);
        break;
      case 'gem':
        g.fillStyle(color, 1);
        g.fillTriangle(10, 1, 18, 8, 10, 18);
        g.fillTriangle(10, 1, 2, 8, 10, 18);
        g.fillStyle(0xffffff, 0.3);
        g.fillTriangle(10, 2, 15, 7, 10, 7);
        break;
    }

    g.generateTexture(`item-${type}`, SIZE, SIZE);
    g.destroy();
  }

  private generateUITextures() {
    // Heart icon
    const h = this.make.graphics({ x: 0, y: 0 });
    h.fillStyle(0xe85d5d, 1);
    h.fillCircle(6, 6, 5);
    h.fillCircle(14, 6, 5);
    h.fillTriangle(0, 8, 20, 8, 10, 20);
    h.generateTexture('icon-heart', 20, 20);
    h.destroy();

    // Mana icon
    const m = this.make.graphics({ x: 0, y: 0 });
    m.fillStyle(0x5d8be8, 1);
    m.fillStar(10, 10, 5, 4, 8);
    m.generateTexture('icon-mana', 20, 20);
    m.destroy();

    // XP icon
    const x = this.make.graphics({ x: 0, y: 0 });
    x.fillStyle(0x5de88b, 1);
    x.fillStar(10, 10, 5, 4, 9);
    x.generateTexture('icon-xp', 20, 20);
    x.destroy();
  }
}
