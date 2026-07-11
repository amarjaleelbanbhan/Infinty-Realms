import { useDungeonStore } from '@stores/useDungeonStore';
import { useGameStore } from '@stores/useGameStore';
import { X, Swords, Shield, Skull } from 'lucide-react';
import Phaser from 'phaser';

export function DungeonEntryUI() {
  const { isEntryModalOpen, dungeonSeed, biome, recommendedLevel, closeEntryModal } = useDungeonStore();
  const { player } = useGameStore();

  if (!isEntryModalOpen || !dungeonSeed) return null;

  const handleEnter = () => {
    // Assuming we have a global event bus or we can dispatch an event to the current scene
    const game = (window as any).__PHASER_GAME__ as Phaser.Game;
    if (game) {
      const worldScene = game.scene.getScene('WorldScene');
      if (worldScene) {
        // Send player to dungeon
        worldScene.scene.start('DungeonScene', {
          seed: dungeonSeed,
          returnX: player?.x || 0,
          returnY: player?.y || 0,
        });
      }
    }
    closeEntryModal();
  };

  const isUnderleveled = (player?.level || 1) < recommendedLevel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Skull className="w-5 h-5 text-red-500" />
            Dungeon Entrance
          </h2>
          <button
            onClick={closeEntryModal}
            className="p-1 hover:bg-slate-700 rounded-md transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500 capitalize">
              {biome} Catacombs
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              A treacherous domain filled with dangerous foes and rare treasures.
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 flex justify-around border border-slate-700/50">
            <div className="flex flex-col items-center gap-1">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Rec. Level</span>
              <span className={`text-xl font-bold ${isUnderleveled ? 'text-red-400' : 'text-green-400'}`}>
                {recommendedLevel}
              </span>
            </div>
            <div className="w-px bg-slate-700"></div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Party</span>
              <span className="text-xl font-bold text-white">1/4</span>
            </div>
          </div>

          {isUnderleveled && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 flex items-start gap-3">
              <Shield className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">
                Warning: Your level is below the recommended level for this dungeon. Proceed with caution.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
          <button
            onClick={closeEntryModal}
            className="px-4 py-2 rounded-lg font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleEnter}
            className="px-6 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-900/50 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <Swords className="w-4 h-4" />
            Enter Dungeon
          </button>
        </div>
      </div>
    </div>
  );
}
