import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';
import type { InventorySlot, ItemRarity } from '@shared/types';

export function Inventory() {
  const { isInventoryOpen, closeInventory } = useUIStore();
  const { player } = useGameStore();

  if (!isInventoryOpen) return null;

  const inventory = player?.inventory ?? [];
  const SLOTS = 25;
  const filledSlots: (InventorySlot | null)[] = [
    ...inventory,
    ...Array(Math.max(0, SLOTS - inventory.length)).fill(null),
  ];

  const rarityBorder: Record<ItemRarity, string> = {
    common: 'border-gray-500',
    uncommon: 'border-green-500',
    rare: 'border-blue-500',
    epic: 'border-purple-500',
    legendary: 'border-orange-500',
  };

  return (
    <div className="modal-overlay" onClick={closeInventory}>
      <div
        className="modal-content glass w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-realm-border">
          <h2 className="font-game text-xl text-white">🎒 Inventory</h2>
          <div className="flex items-center gap-4">
            <span className="font-mono text-sm text-realm-gold">💰 {player?.gold ?? 0}</span>
            <button onClick={closeInventory} className="text-realm-text-muted hover:text-white">✕</button>
          </div>
        </div>

        {/* Equipment slots */}
        <div className="p-4 border-b border-realm-border">
          <h3 className="font-game text-xs text-realm-text-muted uppercase tracking-wider mb-3">Equipment</h3>
          <div className="flex gap-3">
            {['weapon', 'armor', 'helmet', 'accessory'].map((slot) => {
              const equipped = (player?.equipment as Record<string, import('@shared/types').Item | undefined>)?.[slot];
              return (
                <div
                  key={slot}
                  className="flex-1 aspect-square rounded-lg border border-dashed border-realm-border bg-realm-bg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-realm-accent transition-colors"
                >
                  <span className="text-xl">
                    {slot === 'weapon' ? '⚔️' : slot === 'armor' ? '🛡️' : slot === 'helmet' ? '⛑️' : '💍'}
                  </span>
                  <span className="text-xs text-realm-text-muted capitalize">{slot}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inventory grid */}
        <div className="p-4">
          <h3 className="font-game text-xs text-realm-text-muted uppercase tracking-wider mb-3">
            Items ({inventory.length}/{SLOTS})
          </h3>
          <div className="inventory-grid">
            {filledSlots.map((slot, i) => (
              <div
                key={i}
                className={`inventory-slot ${slot ? 'occupied' : 'empty'} ${slot ? rarityBorder[slot.item.rarity] ?? 'border-gray-500' : ''}`}
                data-tooltip={slot ? `${slot.item.name} x${slot.quantity}` : undefined}
              >
                {slot ? (
                  <>
                    <span className="text-lg">
                      {slot.item.type === 'weapon' ? '⚔️'
                        : slot.item.type === 'consumable' ? '🧪'
                        : slot.item.type === 'material' ? '💎'
                        : '📦'}
                    </span>
                    {slot.quantity > 1 && (
                      <span className="absolute bottom-0.5 right-0.5 text-xs font-mono text-white/80">
                        {slot.quantity}
                      </span>
                    )}
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Stats panel */}
        <div className="p-4 border-t border-realm-border">
          <h3 className="font-game text-xs text-realm-text-muted uppercase tracking-wider mb-3">Character Stats</h3>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {[
              ['⚔️ Attack', player?.stats?.attack],
              ['🛡️ Defense', player?.stats?.defense],
              ['💨 Speed', player?.stats?.speed],
              ['🍀 Luck', player?.stats?.luck],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between bg-realm-bg rounded px-2 py-1">
                <span className="text-realm-text-muted">{label as string}</span>
                <span className="text-white">{value ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
