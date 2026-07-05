// ============================================================
// Boot Scene — minimal pre-loading before PreloadScene
// ============================================================

import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Load only the loading bar assets here (tiny)
  }

  create() {
    this.scene.start('PreloadScene');
  }
}
