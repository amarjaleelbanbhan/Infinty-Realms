// UIScene runs parallel to WorldScene, handles Phaser-level HUD
// Most UI is React-based; this scene handles Phaser-native overlays

import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene', active: false });
  }

  create() {
    // Phaser UI elements handled here
    // Most HUD is React (see src/ui/HUD.tsx)
  }
}
