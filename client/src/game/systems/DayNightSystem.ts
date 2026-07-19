import Phaser from 'phaser';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export interface TimeState {
  hour: number;      // 0 - 23
  minute: number;    // 0 - 59
  timeOfDay: TimeOfDay;
  formattedTime: string;
}

export class DayNightSystem {
  private scene: Phaser.Scene;
  private overlay: Phaser.GameObjects.Rectangle | null = null;
  private totalGameSeconds = 360; // Start at 6:00 AM (Dawn)
  private timeScale = 12; // 1 real second = 12 game seconds (1 full day = 120s / 2 mins)

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  createOverlay(width: number, height: number) {
    this.overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(48);
  }

  update(deltaSeconds: number): TimeState {
    this.totalGameSeconds = (this.totalGameSeconds + deltaSeconds * this.timeScale) % (24 * 3600);

    const hour = Math.floor(this.totalGameSeconds / 3600);
    const minute = Math.floor((this.totalGameSeconds % 3600) / 60);

    let timeOfDay: TimeOfDay = 'day';
    let color = 0x000000;
    let alpha = 0;

    if (hour >= 5 && hour < 8) {
      timeOfDay = 'dawn';
      color = 0xff9944; // Golden orange
      alpha = 0.15;
    } else if (hour >= 8 && hour < 17) {
      timeOfDay = 'day';
      color = 0x000000;
      alpha = 0;
    } else if (hour >= 17 && hour < 20) {
      timeOfDay = 'dusk';
      color = 0x884488; // Soft purple/dusk
      alpha = 0.2;
    } else {
      timeOfDay = 'night';
      color = 0x050a25; // Dark navy blue
      alpha = 0.45;
    }

    if (this.overlay) {
      this.overlay.setFillStyle(color, alpha);
    }

    const hh = hour.toString().padStart(2, '0');
    const mm = minute.toString().padStart(2, '0');

    return {
      hour,
      minute,
      timeOfDay,
      formattedTime: `${hh}:${mm}`,
    };
  }

  getTimeOfDay(): TimeOfDay {
    const hour = Math.floor(this.totalGameSeconds / 3600);
    if (hour >= 5 && hour < 8) return 'dawn';
    if (hour >= 8 && hour < 17) return 'day';
    if (hour >= 17 && hour < 20) return 'dusk';
    return 'night';
  }
}
