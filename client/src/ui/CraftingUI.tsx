import { useState } from 'react';
import { useUIStore } from '@stores/useUIStore';
import { useGameStore } from '@stores/useGameStore';
import { X, Hammer, Check, AlertCircle } from 'lucide-react';
import { RECIPES, canCraft, type CraftingRecipe } from '@game/systems/CraftingRecipes';

export function CraftingUI() {
  const { isCraftingOpen, closeCrafting, addToast } = useUIStore();
  const { player, addToInventory, removeFromInventory, addExperience } = useGameStore();
  const [craftingId, setCraftingId] = useState<string | null>(null);

  if (!isCraftingOpen) return null;

  const inventory = player?.inventory || [];

  const handleCraft = (recipe: CraftingRecipe) => {
    if (!canCraft(recipe, inventory)) {
      addToast('Missing required materials!', 'error');
      return;
    }

    setCraftingId(recipe.id);

    setTimeout(() => {
      // Consume materials
      recipe.ingredients.forEach(ing => {
        removeFromInventory(ing.itemId, ing.quantity);
      });

      // Add result item
      addToInventory(recipe.result, recipe.resultQuantity);
      addExperience(50);
      addToast(`Crafted ${recipe.resultQuantity}x ${recipe.result.name}!`, 'success');
      setCraftingId(null);
    }, 1000);
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
          <Hammer className="w-6 h-6 text-[#ffb347]" /> Blacksmith Workshop
        </h2>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {RECIPES.map((recipe) => {
            const ready = canCraft(recipe, inventory);
            const isCrafting = craftingId === recipe.id;

            return (
              <div
                key={recipe.id}
                className="bg-[#0f0f15] border border-white/10 rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <span>{recipe.result.icon}</span>
                    {recipe.name}
                  </h3>
                  <div className="text-xs text-white/60 mt-1 flex flex-wrap gap-2">
                    {recipe.ingredients.map((ing) => {
                      const slot = inventory.find((s) => s.item.id === ing.itemId);
                      const current = slot?.quantity || 0;
                      const hasEnough = current >= ing.quantity;
                      return (
                        <span
                          key={ing.itemId}
                          className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
                            hasEnough ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40' : 'bg-red-950/80 text-red-300 border border-red-800/40'
                          }`}
                        >
                          {ing.name}: {current}/{ing.quantity}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => handleCraft(recipe)}
                  disabled={!ready || craftingId !== null}
                  className={`px-4 py-2 text-white font-semibold rounded shadow-md transition-all flex items-center gap-1.5 min-w-[100px] justify-center ${
                    ready
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 cursor-pointer'
                      : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/5'
                  }`}
                >
                  {isCrafting ? (
                    'Crafting...'
                  ) : ready ? (
                    <>
                      <Check className="w-4 h-4" /> Craft
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" /> Need Items
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
