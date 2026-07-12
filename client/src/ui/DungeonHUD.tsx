import { useEffect, useState } from 'react';
import { useGameStore } from '@stores/useGameStore';
import { Shield, Skull } from 'lucide-react';
import { DungeonState } from '@shared/types';

export function DungeonHUD() {
  const { player } = useGameStore();
  const [dungeon, setDungeon] = useState<DungeonState | null>(null);

  useEffect(() => {
    // Listen for dungeon state updates from the scene
    const handleDungeonUpdate = (e: CustomEvent) => {
      setDungeon(e.detail);
    };

    window.addEventListener('dungeon-update' as any, handleDungeonUpdate);
    return () => {
      window.removeEventListener('dungeon-update' as any, handleDungeonUpdate);
    };
  }, []);

  if (!dungeon || !player) return null;

  return (
    <div className="absolute top-4 left-4 flex flex-col gap-2 z-40 animate-in fade-in">
      <div className="bg-slate-900/80 border border-slate-700 p-3 rounded-lg backdrop-blur-md w-64 shadow-xl">
        <h3 className="text-orange-400 font-bold text-sm tracking-wide uppercase mb-2 flex justify-between items-center">
          {dungeon.name}
          {!dungeon.bossAlive && <Shield className="w-4 h-4 text-green-400" />}
        </h3>
        
        {/* Simple text-based minimap for now, or just room stats */}
        <div className="flex flex-col gap-1 text-xs text-slate-300">
          <div className="flex justify-between">
            <span>Rooms Cleared:</span>
            <span className="font-mono text-white">
              {dungeon.rooms.filter(r => r.cleared).length} / {dungeon.rooms.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Boss Status:</span>
            <span className={`font-mono ${dungeon.bossAlive ? 'text-red-400' : 'text-green-400'}`}>
              {dungeon.bossAlive ? 'Alive' : 'Defeated'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Objective / Lockdown warning */}
      <div className="bg-slate-900/80 border border-slate-700 px-3 py-2 rounded-lg backdrop-blur-md w-64 shadow-xl">
        <div className="flex items-center gap-2">
           <Skull className="w-4 h-4 text-red-500" />
           <span className="text-xs text-red-200">Defeat all enemies in a room to unlock doors.</span>
        </div>
      </div>

      {/* Victory Overlay */}
      {!dungeon.bossAlive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto">
          <div className="bg-slate-900 border border-yellow-500/50 rounded-xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center text-center animate-in zoom-in duration-300">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 mb-2">
              VICTORY
            </h2>
            <p className="text-slate-300 mb-8">
              The Dungeon Warden has been defeated! The corrupted energies dissipate.
            </p>
            
            <button
              onClick={() => {
                const game = (window as any).__PHASER_GAME__;
                if (game) {
                  const scene = game.scene.getScene('DungeonScene');
                  if (scene) {
                    (scene as any).exitDungeon();
                  }
                }
              }}
              className="px-8 py-3 rounded-lg font-bold text-black bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 shadow-lg shadow-yellow-900/20 transition-all hover:scale-105"
            >
              Exit Dungeon
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
