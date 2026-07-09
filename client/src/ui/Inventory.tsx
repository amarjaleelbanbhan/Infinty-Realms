import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';
import type { InventorySlot, ItemRarity } from '@shared/types';
import { Backpack, Coins, Sword, Shield, HardHat, Gem, FlaskConical, PackageOpen, X } from 'lucide-react';

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
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="font-game text-2xl text-white flex items-center gap-3">
            <Backpack className="w-6 h-6 text-realm-accent" /> Inventory
          </h2>
          <div className="flex items-center gap-4">
            <span className="font-mono text-sm text-realm-gold flex items-center gap-2">
              <Coins className="w-4 h-4" /> {player?.gold ?? 0}
            </span>
            <button onClick={closeInventory} className="text-white/50 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Equipment slots */}
        <div className="p-6 border-b border-white/10">
          <h3 className="font-game text-xs text-white/50 uppercase tracking-wider mb-4">Equipment</h3>
          <div className="flex gap-4">
            {['weapon', 'armor', 'helmet', 'accessory'].map((slot) => {
              const equipped = (player?.equipment as Record<string, import('@shared/types').Item | undefined>)?.[slot];
              const Icon = slot === 'weapon' ? Sword : slot === 'armor' ? Shield : slot === 'helmet' ? HardHat : Gem;
              return (
                <div
                  key={slot}
                  className="flex-1 aspect-square rounded-2xl border border-white/10 bg-white/5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-realm-accent hover:bg-realm-accent/10 transition-all shadow-inner"
                >
                  <Icon className="w-8 h-8 text-white/40" strokeWidth={1.5} />
                  <span className="text-[10px] text-white/50 capitalize font-mono">{slot}</span>
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
                className={`inventory-slot ${slot ? 'occupied hover:scale-110 hover:shadow-[0_0_15px_currentColor]' : 'empty'} ${slot ? rarityBorder[slot.item.rarity] ?? 'border-gray-500' : ''}`}
                style={slot ? { color: `var(--color-${slot.item.rarity === 'legendary' ? 'gold' : slot.item.rarity === 'epic' ? 'accent' : 'text'})` } : {}}
                data-tooltip={slot ? `${slot.item.name} x${slot.quantity}` : undefined}
              >
                {slot ? (
                  <>
                    <span className="flex items-center justify-center w-full h-full drop-shadow-[0_0_10px_currentColor]">
                      {slot.item.type === 'weapon' ? <Sword className="w-6 h-6" />
                        : slot.item.type === 'consumable' ? <FlaskConical className="w-6 h-6" />
                        : slot.item.type === 'material' ? <Gem className="w-6 h-6" />
                        : <PackageOpen className="w-6 h-6" />}
                    </span>
                    {slot.quantity > 1 && (
                      <span className="absolute bottom-1 right-2 text-[10px] font-mono text-white drop-shadow-[0_1px_2px_black] font-bold">
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
