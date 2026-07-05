// ============================================================
// Combat System — hitbox-based melee combat
// ============================================================

import Phaser from 'phaser';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';
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
      useUIStore.getState().addToast('You have fallen!', 'error');
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
      alpha: 1,
    }).setDepth(100);

    this.scene.tweens.add({
      targets: dmgText,
      y: y - 60,
      alpha: 0,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => dmgText.destroy(),
    });
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
