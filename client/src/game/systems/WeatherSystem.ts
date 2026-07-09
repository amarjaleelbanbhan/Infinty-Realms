// ============================================================
// Weather System — Dynamic weather that affects gameplay
// ============================================================

import Phaser from 'phaser';
import type { WeatherType } from '@shared/types';

export const WEATHER_EFFECTS: Record<WeatherType, { label: string; particleColor: number; particleCount: number; overlay: number; overlayAlpha: number }> = {
  clear:    { label: '☀️ Clear',    particleColor: 0xffff88, particleCount: 0,   overlay: 0x000000, overlayAlpha: 0 },
  cloudy:   { label: '☁️ Cloudy',   particleColor: 0x888888, particleCount: 0,   overlay: 0x334455, overlayAlpha: 0.15 },
  rain:     { label: '🌧️ Rain',     particleColor: 0x4488cc, particleCount: 80,  overlay: 0x001122, overlayAlpha: 0.25 },
  storm:    { label: '⛈️ Storm',    particleColor: 0x2266aa, particleCount: 150, overlay: 0x000511, overlayAlpha: 0.4 },
  snow:     { label: '❄️ Snow',     particleColor: 0xeeeeff, particleCount: 60,  overlay: 0xaabbcc, overlayAlpha: 0.1 },
  fog:      { label: '🌫️ Fog',      particleColor: 0xbbbbbb, particleCount: 0,   overlay: 0x888888, overlayAlpha: 0.3 },
  heat:     { label: '🌡️ Heat',     particleColor: 0xff8800, particleCount: 20,  overlay: 0xff4400, overlayAlpha: 0.05 },
  blizzard: { label: '🌨️ Blizzard', particleColor: 0xddddff, particleCount: 200, overlay: 0xaabbdd, overlayAlpha: 0.35 },
};

export const WEATHER_MODIFIERS: Record<WeatherType, { description: string; statBonus: string }> = {
  clear:    { description: 'Optimal visibility and balanced essence flow.', statBonus: 'Standard Stats' },
  cloudy:   { description: 'Cool breeze reduces stamina drain.', statBonus: '+5 Speed' },
  rain:     { description: 'Rain dampens flames but empowers lightning magic.', statBonus: '+30% Lightning Damage' },
  storm:    { description: 'Violent winds boost arcane spell velocity.', statBonus: '+20% Critical Chance' },
  snow:     { description: 'Chilly air empowers frost spells.', statBonus: '+30% Frost Damage' },
  fog:      { description: 'Thick fog conceals movements from enemies.', statBonus: '+15 Stealth & Dodge' },
  heat:     { description: 'Sweltering heat increases attack power.', statBonus: '+15% Physical Attack' },
  blizzard: { description: 'Freezing gale slows movement speed.', statBonus: '-10% Speed, +40% Frost' },
};

export class WeatherSystem {
  private scene: Phaser.Scene;
  private particles: Phaser.GameObjects.Graphics[] = [];
  private particleEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private overlay: Phaser.GameObjects.Rectangle | null = null;
  private currentWeather: WeatherType = 'clear';
  private weatherTimer = 0;
  private weatherDuration = 300; // seconds

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setWeather(type: WeatherType) {
    this.currentWeather = type;
    this.updateOverlay(type);
    console.log(`[Weather] Changed to ${type}`);
  }

  getRandomWeather(biome: string): WeatherType {
    const rng = Math.random();
    if (biome === 'snow' || biome === 'volcano') {
      return rng < 0.4 ? 'snow' : rng < 0.7 ? 'clear' : 'blizzard';
    }
    if (biome === 'desert') {
      return rng < 0.6 ? 'clear' : rng < 0.8 ? 'heat' : 'storm';
    }
    if (rng < 0.4) return 'clear';
    if (rng < 0.6) return 'cloudy';
    if (rng < 0.75) return 'rain';
    if (rng < 0.85) return 'storm';
    return 'fog';
  }

  private updateOverlay(type: WeatherType) {
    const effect = WEATHER_EFFECTS[type];
    
    if (this.overlay) {
      this.scene.tweens.add({
        targets: this.overlay,
        fillAlpha: effect.overlayAlpha,
        duration: 3000,
        ease: 'Linear',
      });
    }

    if (this.particleEmitter) {
      this.particleEmitter.stop();
      this.particleEmitter.destroy();
      this.particleEmitter = null;
    }

    if (effect.particleCount > 0) {
      const isSnow = type === 'snow' || type === 'blizzard';
      this.particleEmitter = this.scene.add.particles(0, 0, 'particle', {
        x: { min: 0, max: this.scene.cameras.main.width },
        y: -50,
        lifespan: isSnow ? 4000 : 2000,
        speedY: isSnow ? { min: 50, max: 150 } : { min: 400, max: 600 },
        speedX: isSnow ? { min: -50, max: 50 } : { min: -20, max: 20 },
        scale: { start: isSnow ? 1.5 : 1, end: isSnow ? 0.5 : 1 },
        quantity: isSnow ? 2 : 5, // Per frame emission rate
        tint: effect.particleColor,
        blendMode: 'ADD',
      });
      this.particleEmitter.setScrollFactor(0); // Attach to camera visually
      this.particleEmitter.setDepth(49);
    }
  }

  createOverlay(width: number, height: number) {
    this.overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(50);
  }

  getCurrentWeather(): WeatherType {
    return this.currentWeather;
  }

  getWeatherLabel(): string {
    return WEATHER_EFFECTS[this.currentWeather].label;
  }
}
