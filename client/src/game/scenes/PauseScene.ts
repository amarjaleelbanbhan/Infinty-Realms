import Phaser from 'phaser';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene', active: false });
  }

  create() {
    // Pause handled by React UI (PauseMenu component)
    // This scene just pauses WorldScene physics if needed
    const worldScene = this.scene.get('WorldScene');
    worldScene?.scene.pause();
  }

  resume() {
    const worldScene = this.scene.get('WorldScene');
    worldScene?.scene.resume();
    this.scene.stop();
  }
}
