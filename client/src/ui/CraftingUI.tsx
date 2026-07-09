import { useState } from 'react';
import { useUIStore } from '@stores/useUIStore';
import { useGameStore } from '@stores/useGameStore';
import { X, Hammer } from 'lucide-react';

export function CraftingUI() {
  const { isCraftingOpen, closeCrafting, addToast } = useUIStore();
  const { playerToken } = useGameStore();
  const [crafting, setCrafting] = useState(false);

  if (!isCraftingOpen) return null;

  const craftItem = async () => {
    setCrafting(true);
    // Simulate crafting process
    setTimeout(() => {
      setCrafting(false);
      addToast('Successfully crafted Steel Sword!', 'success');
      useGameStore.getState().addExperience(50);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a24] border border-[#ffb347]/30 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={closeCrafting}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-[#ffb347] to-[#ffcc33] mb-6 drop-shadow-md flex items-center gap-2">
          <Hammer className="w-6 h-6 text-[#ffb347]" /> Advanced Crafting
        </h2>

        <div className="space-y-4">
          <div className="bg-[#0f0f15] border border-white/10 rounded-lg p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-white">Steel Sword</h3>
              <p className="text-xs text-white/50">Requires 5 Iron, 2 Leather</p>
            </div>
            <button
              onClick={craftItem}
              disabled={crafting}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-semibold rounded shadow-md disabled:opacity-50"
            >
              {crafting ? 'Crafting...' : 'Craft'}
            </button>
          </div>

          <div className="bg-[#0f0f15] border border-white/10 rounded-lg p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-white">Health Potion</h3>
              <p className="text-xs text-white/50">Requires 3 Herbs, 1 Water</p>
            </div>
            <button
              onClick={craftItem}
              disabled={crafting}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-semibold rounded shadow-md disabled:opacity-50"
            >
              {crafting ? 'Crafting...' : 'Brew'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
