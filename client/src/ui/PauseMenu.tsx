import { useUIStore } from '@stores/useUIStore';
import { useGameStore } from '@stores/useGameStore';
import { saveSystem } from '@game/systems/SaveSystem';
import { Play, Save, Settings, Home } from 'lucide-react';

export function PauseMenu() {
  const { currentScreen, togglePause, setScreen } = useUIStore();
  const { reset } = useGameStore();

  if (currentScreen !== 'pause') return null;

  const handleSave = () => {
    saveSystem.save();
    useUIStore.getState().addToast('Game saved!', 'success');
  };

  const handleQuitToMenu = () => {
    saveSystem.save();
    setScreen('menu');
    // Stop WorldScene, start MainMenuScene
    const game = (window as Window & { __phaserGame?: import('phaser').Game }).__phaserGame;
    if (game) {
      game.scene.stop('WorldScene');
      game.scene.start('MainMenuScene');
    }
  };

  return (
    <div className="modal-overlay z-50">
      <div className="modal-content glass p-8 w-full max-w-xs mx-4 text-center">
        <h2 className="font-game text-2xl text-white mb-2">Paused</h2>
        <p className="font-ui text-sm text-realm-text-muted mb-6">Your adventure awaits...</p>

        <div className="flex flex-col gap-3">
          <button className="btn-primary text-sm flex items-center justify-center gap-2" onClick={togglePause}>
            <Play className="w-4 h-4" /> Resume
          </button>
          <button className="btn-secondary text-sm flex items-center justify-center gap-2" onClick={handleSave}>
            <Save className="w-4 h-4" /> Save Game
          </button>
          <button className="btn-secondary text-sm flex items-center justify-center gap-2">
            <Settings className="w-4 h-4" /> Settings
          </button>
          <button
            className="btn-secondary text-sm text-realm-hp border-realm-hp/30 hover:bg-realm-hp/10 flex items-center justify-center gap-2"
            onClick={handleQuitToMenu}
          >
            <Home className="w-4 h-4" /> Quit to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
