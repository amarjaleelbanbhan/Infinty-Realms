import { useGameStore } from '@stores/useGameStore';
import { useMarketStore } from '@stores/useMarketStore';
import { X, Coins, ShoppingBag } from 'lucide-react';

export function MarketplaceUI({ onClose }: { onClose: () => void }) {
  const { marketItems, buyItem, sellItem } = useMarketStore();
  const { player } = useGameStore();

  if (!player) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
      <div className="premium-glass premium-border w-full max-w-4xl max-h-[85vh] flex flex-col rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-realm-gold" />
            <h2 className="font-game tracking-wider text-xl text-white drop-shadow-md uppercase">Marketplace</h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-realm-gold/20">
              <Coins className="w-5 h-5 text-realm-gold" />
              <span className="font-mono text-realm-gold text-lg">{player.gold ?? 0}</span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left: Buy Items (Merchant Stock) */}
          <div className="flex-1 border-r border-white/10 flex flex-col bg-black/20">
            <div className="p-4 border-b border-white/5 bg-white/5 text-center font-game text-sm text-realm-text tracking-widest uppercase">
              Items for Sale
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {marketItems.map((marketItem) => (
                <div key={marketItem.item.id} className="glass p-3 rounded-xl border-white/10 hover:border-realm-gold/40 transition-colors flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-black/50 rounded-lg flex items-center justify-center text-2xl border border-white/5">
                    {marketItem.item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-game text-white text-sm">{marketItem.item.name}</div>
                    <div className="font-ui text-xs text-realm-text-muted mt-1 line-clamp-1">{marketItem.item.description}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 font-mono text-realm-gold font-bold">
                      <Coins className="w-3 h-3" /> {marketItem.price}
                    </div>
                    <button
                      onClick={() => buyItem(marketItem.item.id, 1)}
                      className="px-3 py-1 bg-realm-gold/20 hover:bg-realm-gold/40 text-realm-gold border border-realm-gold/50 rounded text-xs font-mono transition-colors uppercase font-bold"
                    >
                      Buy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Sell Items (Player Inventory) */}
          <div className="flex-1 flex flex-col bg-black/10">
            <div className="p-4 border-b border-white/5 bg-white/5 text-center font-game text-sm text-realm-text tracking-widest uppercase">
              Your Inventory
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {(!player.inventory || player.inventory.length === 0) ? (
                <div className="text-center text-realm-text-muted font-ui py-8 text-sm">
                  Your inventory is empty.
                </div>
              ) : (
                player.inventory.map((slot) => {
                  const sellPrice = Math.max(1, Math.floor((slot.item.value || 1) * 0.5));
                  return (
                    <div key={slot.item.id} className="glass p-3 rounded-xl border-white/10 hover:border-realm-mana/40 transition-colors flex items-center gap-4 group">
                      <div className="w-12 h-12 bg-black/50 rounded-lg flex items-center justify-center text-2xl border border-white/5 relative">
                        {slot.item.icon}
                        <span className="absolute -bottom-1 -right-1 bg-black text-white text-[10px] font-mono px-1 rounded-sm border border-white/20">
                          x{slot.quantity}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-game text-white text-sm flex items-center gap-2">
                          {slot.item.name}
                        </div>
                        <div className="font-ui text-xs text-realm-text-muted mt-1 line-clamp-1">{slot.item.description}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1 font-mono text-realm-text-muted text-xs">
                          Sell for <Coins className="w-3 h-3 text-realm-gold" /> {sellPrice}
                        </div>
                        <button
                          onClick={() => sellItem(slot.item.id, 1)}
                          className="px-3 py-1 bg-realm-mana/20 hover:bg-realm-mana/40 text-realm-mana border border-realm-mana/50 rounded text-xs font-mono transition-colors uppercase font-bold"
                        >
                          Sell
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
