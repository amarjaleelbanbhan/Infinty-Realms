import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { WorldScene } from './scenes/WorldScene';
import { DungeonScene } from './scenes/DungeonScene';
import { UIScene } from './scenes/UIScene';
import { PauseScene } from './scenes/PauseScene';
import { HousingScene } from './scenes/HousingScene';

export function createPhaserGame(parent: HTMLElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#0a0a1a',
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    scene: [BootScene, PreloadScene, MainMenuScene, WorldScene, DungeonScene, UIScene, PauseScene, HousingScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    audio: {
      disableWebAudio: false,
    },
    input: {
      activePointers: 3, // Support multi-touch
    },
  };

  const game = new Phaser.Game(config);

  // Expose game instance globally for React components to call
  (window as Window & { __phaserGame?: Phaser.Game }).__phaserGame = game;

  return game;
}

/** Start the world scene with a given seed */
export function startWorld(seed: string) {
  const game = (window as Window & { __phaserGame?: Phaser.Game }).__phaserGame;
  if (!game) return;

  const mainMenu = game.scene.getScene('MainMenuScene');
  mainMenu?.scene.stop();

  game.scene.start('WorldScene', { seed });
}
