// ============================================================
// Combat System — hitbox-based melee combat
// ============================================================

import Phaser from 'phaser';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';
import { useSettingsStore } from '@stores/useSettingsStore';
import { soundSystem } from '@game/systems/SoundSystem';
import type { PlayerStats } from '@shared/types';

export interface CombatEntity {
  id: string;
  name: string;
  x: number;
  y: number;
  stats: PlayerStats;
  team: 'player' | 'enemy';
  onDeath?: () => void;
}

export interface DamageEvent {
  attacker: CombatEntity;
  defender: CombatEntity;
  damage: number;
  isCrit: boolean;
}

export class CombatSystem {
  private scene: Phaser.Scene;
  private damageTextPool: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Calculate damage with variance and critical hits */
  calculateDamage(attacker: PlayerStats, defender: PlayerStats, luck = 5): { damage: number; isCrit: boolean } {
    const variance = 0.8 + Math.random() * 0.4; // 80–120% variance
    const rawDamage = Math.max(1, attacker.attack * variance - defender.defense * 0.5);
    const critChance = Math.min(0.4, 0.05 + luck * 0.01);
    const isCrit = Math.random() < critChance;
    const damage = Math.round(isCrit ? rawDamage * 1.8 : rawDamage);
    return { damage, isCrit };
  }

  /** Apply damage to player */
  damagePlayer(damage: number, isCrit = false) {
    const gameStore = useGameStore.getState();
    const stats = gameStore.player?.stats;
    if (!stats) return;

    const newHp = Math.max(0, stats.hp - damage);
    gameStore.updatePlayerStats({ hp: newHp });

    if (newHp <= 0) {
      soundSystem.playHit(); // fallback for death sound
      gameStore.die();
    }
  }

  /** Heal player */
  healPlayer(amount: number) {
    const gameStore = useGameStore.getState();
    const stats = gameStore.player?.stats;
    if (!stats) return;

    const newHp = Math.min(stats.maxHp, stats.hp + amount);
    gameStore.updatePlayerStats({ hp: newHp });
    useUIStore.getState().addToast(`+${amount} HP`, 'success');
  }

  /** Show floating damage number */
  showDamageNumber(x: number, y: number, damage: number, isCrit: boolean, isHeal = false) {
    const color = isHeal ? '#5de88b' : isCrit ? '#ffd700' : '#e85d5d';
    const size = isCrit ? '20px' : '16px';
    const text = isHeal ? `+${damage}` : isCrit ? `${damage}!` : `${damage}`;

    const dmgText = this.scene.add.text(x, y - 20, text, {
      fontSize: size,
      fontFamily: 'Cinzel, serif',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setDepth(100);

    this.scene.tweens.add({
      targets: dmgText,
      y: y - 60,
      alpha: 0,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => dmgText.destroy(),
    });

    if (isCrit && !isHeal) {
      this.shakeCamera(150, 0.015);
      this.hitStop(50);
    }
  }

  /** Shake camera for juicy impact */
  shakeCamera(duration = 100, intensity = 0.01) {
    const settings = useSettingsStore.getState();
    if (settings.screenShake) {
      this.scene.cameras.main.shake(duration, intensity);
    }
  }

  /** Brief time slow/pause for hit impact */
  hitStop(duration = 50) {
    // A simple hit stop by setting timeScale
    this.scene.time.timeScale = 0.1;
    if (this.scene.physics && this.scene.physics.world) {
      this.scene.physics.world.isPaused = true;
    }
    this.scene.time.delayedCall(duration * 0.1, () => {
      this.scene.time.timeScale = 1.0;
      if (this.scene.physics && this.scene.physics.world) {
        this.scene.physics.world.isPaused = false;
      }
    });
  }

  showHitEffect(x: number, y: number, color: number = 0xff0000) {
    const particles = this.scene.add.particles(x, y, 'hit-particle', {
      color: [color, 0xffffff],
      colorEase: 'quad.out',
      lifespan: 300,
      angle: { min: 0, max: 360 },
      speed: { min: 50, max: 150 },
      scale: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      emitting: false,
    });
    
    // We don't have a 'hit-particle' texture, so we can draw one or use a rectangle texture.
    // Let's create a small white rectangle texture dynamically if it doesn't exist
    if (!this.scene.textures.exists('fx-pixel')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 4, 4);
      g.generateTexture('fx-pixel', 4, 4);
    }
    
    particles.setTexture('fx-pixel');
    particles.explode(8); // emit 8 particles
  }

  showDeathEffect(x: number, y: number) {
    if (!this.scene.textures.exists('fx-pixel')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 4, 4);
      g.generateTexture('fx-pixel', 4, 4);
    }

    const particles = this.scene.add.particles(x, y, 'fx-pixel', {
      color: [0x8a2be2, 0x4b0082, 0x000000], // Purple death effect
      colorEase: 'quad.out',
      lifespan: 800,
      angle: { min: 0, max: 360 },
      speed: { min: 50, max: 250 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: 'SCREEN',
      emitting: false,
    });

    particles.explode(30);
  }

  /** Check if two rectangles overlap (attack hitbox check) */
  hitboxCheck(
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number
  ): boolean {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  /** Melee attack in a direction */
  getMeleeHitbox(playerX: number, playerY: number, direction: 'up' | 'down' | 'left' | 'right', reach = 48): Phaser.Geom.Rectangle {
    const size = 40;
    switch (direction) {
      case 'up':    return new Phaser.Geom.Rectangle(playerX - size/2, playerY - reach, size, reach);
      case 'down':  return new Phaser.Geom.Rectangle(playerX - size/2, playerY,        size, reach);
      case 'left':  return new Phaser.Geom.Rectangle(playerX - reach,  playerY - size/2, reach, size);
      case 'right': return new Phaser.Geom.Rectangle(playerX,          playerY - size/2, reach, size);
    }
  }
}
