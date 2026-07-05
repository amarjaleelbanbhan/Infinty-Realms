import { useState } from 'react';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';

interface Listing {
  id: string;
  name: string;
  type: string;
  price: number;
  seller: string;
  icon: string;
}

const DEFAULT_MARKET_ITEMS: Listing[] = [
  { id: '1', name: 'Leyline Fire Essence', type: 'material', price: 25, seller: 'Merchant Eldrin', icon: '🔥' },
  { id: '2', name: 'Frost Crystal', type: 'material', price: 40, seller: 'Alchemist Vane', icon: '❄️' },
  { id: '3', name: 'Iron Breastplate', type: 'armor', price: 150, seller: 'Smith Thorin', icon: '🛡️' },
  { id: '4', name: 'Elixir of Great Health', type: 'consumable', price: 60, seller: 'Healer Lyra', icon: '🧪' },
  { id: '5', name: 'Ancient Runed Sword', type: 'weapon', price: 350, seller: 'Ranger Kael', icon: '⚔️' },
];

export function MarketplaceUI({ onClose }: { onClose: () => void }) {
  const { player, addGold } = useGameStore();
  const { addToast } = useUIStore();
  const [listings] = useState<Listing[]>(DEFAULT_MARKET_ITEMS);

  const handleBuy = (item: Listing) => {
    const gold = player?.gold ?? 0;
    if (gold < item.price) {
      addToast('Not enough gold!', 'error');
      return;
    }

    addGold(-item.price);
    addToast(`Bought ${item.name} for ${item.price}g!`, 'gold');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass p-6 w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-realm-border pb-3 mb-4">
          <h2 className="font-game text-xl text-white">🏪 Realm Bazaar</h2>
          <div className="flex items-center gap-4">
            <span className="font-mono text-sm text-realm-gold">💰 {player?.gold ?? 0}g</span>
            <button onClick={onClose} className="text-realm-text-muted hover:text-white">✕</button>
          </div>
        </div>

        <p className="text-xs text-realm-text-muted font-ui mb-4">
          Trade goods, materials, and equipment across the shared realm economy.
        </p>

        {/* Listings */}
        <div className="space-y-2 max-h-72 overflow-y-auto mb-4">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-realm-surface border border-realm-border rounded-lg p-3 flex items-center justify-between hover:border-realm-accent/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <div className="font-game text-sm text-white">{item.name}</div>
                  <div className="text-xs text-realm-text-muted font-ui">Seller: {item.seller}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-realm-gold font-bold">{item.price}g</span>
                <button
                  onClick={() => handleBuy(item)}
                  className="btn-gold text-xs py-1.5 px-3"
                >
                  Buy
                </button>
              </div>
            </div>
          ))}
        </div>

        <button className="btn-secondary w-full text-xs" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
