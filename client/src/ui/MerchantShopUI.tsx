import { useState } from 'react';
import { useUIStore } from '@stores/useUIStore';
import { useGameStore } from '@stores/useGameStore';
import type { Item } from '@shared/types';
import { Store, X, Leaf, Hourglass, Snowflake, Hexagon } from 'lucide-react';

interface ShopItem {
  id: string;
  name: string;
  baseValue: number;
  icon: string;
  cheapBiomes: string[];
  expensiveBiomes: string[];
}

const MERCHANDISE: ShopItem[] = [
  { id: 'iron-ore', name: 'Iron Ore', baseValue: 10, icon: 'hexagon', cheapBiomes: ['volcano'], expensiveBiomes: ['desert', 'snow'] },
  { id: 'herbals', name: 'Mystic Herbs', baseValue: 12, icon: 'leaf', cheapBiomes: ['forest', 'swamp'], expensiveBiomes: ['snow', 'desert'] },
  { id: 'sand-glass', name: 'Sand Glass', baseValue: 8, icon: 'hourglass', cheapBiomes: ['desert'], expensiveBiomes: ['snow', 'forest'] },
  { id: 'ice-crystal', name: 'Ice Crystal', baseValue: 15, icon: 'snowflake', cheapBiomes: ['snow'], expensiveBiomes: ['volcano', 'desert'] },
];

const renderIcon = (iconName: string) => {
  switch (iconName) {
    case 'hexagon': return <Hexagon className="w-6 h-6 text-realm-text-muted" />;
    case 'leaf': return <Leaf className="w-6 h-6 text-green-400" />;
    case 'hourglass': return <Hourglass className="w-6 h-6 text-yellow-400" />;
    case 'snowflake': return <Snowflake className="w-6 h-6 text-blue-400" />;
    default: return null;
  }
};

export function MerchantShopUI() {
  const { isMerchantShopOpen, merchantBiome, closeMerchantShop, addToast } = useUIStore();
  const { player, addGold, addToInventory, removeFromInventory } = useGameStore();

  // Local saturation counter to track price crashes for this trade session
  const [saturation, setSaturation] = useState<Record<string, number>>({});

  if (!isMerchantShopOpen || !player) return null;

  const currentBiome = merchantBiome ?? 'plains';

  // Calculate pricing based on biome and saturation
  const getItemPrice = (item: ShopItem, isSelling: boolean) => {
    let multiplier = 1.0;
    if (item.cheapBiomes.includes(currentBiome)) {
      multiplier = 0.5;
    } else if (item.expensiveBiomes.includes(currentBiome)) {
      multiplier = 2.0;
    }

    const itemSaturation = saturation[item.id] ?? 0;
    // Price crash effect: sell price decreases by 8% per item sold to the merchant
    const saturationMultiplier = isSelling ? Math.max(0.2, 1.0 - itemSaturation * 0.08) : 1.0;

    const finalPrice = Math.round(item.baseValue * multiplier * saturationMultiplier);
    return {
      price: finalPrice,
      isCrashed: itemSaturation > 0,
      discount: Math.round((1 - saturationMultiplier) * 100),
    };
  };

  const handleBuy = async (item: ShopItem) => {
    const token = useGameStore.getState().playerToken;
    const { price } = getItemPrice(item, false);

    if (token) {
      try {
        const res = await fetch('/api/inventory/shop-transaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: 'buy',
            itemId: item.id,
            quantity: 1,
            biome: currentBiome,
            saturation: saturation[item.id] ?? 0,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          useGameStore.setState(s => ({
            player: s.player ? { ...s.player, inventory: data.inventory, equipment: data.equipment, stats: data.stats, gold: data.gold } : null
          }));
          addToast(`Bought ${item.name} for ${price}g`, 'success');
          return;
        } else {
          const err = await res.json().catch(() => ({ message: 'Purchase failed.' }));
          addToast(err.message ?? 'Purchase failed.', 'error');
          return;
        }
      } catch (e) {
        console.error('[Shop] Server error buying item, falling back to local:', e);
      }
    }

    const gold = player.gold ?? 0;

    if (gold < price) {
      addToast('Not enough gold!', 'error');
      return;
    }

    const boughtItem: Item = {
      id: item.id,
      name: item.name,
      description: `A commodity traded across biomes. Base value is ${item.baseValue}g.`,
      type: 'material',
      rarity: 'common',
      icon: item.icon,
      value: item.baseValue,
    };

    addGold(-price);
    addToInventory(boughtItem, 1);
    addToast(`Bought ${item.name} for ${price}g`, 'success');
  };

  const handleSell = async (item: ShopItem) => {
    const inventory = player.inventory ?? [];
    const slot = inventory.find((s) => s.item.id === item.id);

    if (!slot || slot.quantity <= 0) {
      addToast(`You do not have any ${item.name} to sell!`, 'error');
      return;
    }

    const { price } = getItemPrice(item, true);
    const token = useGameStore.getState().playerToken;

    if (token) {
      try {
        const res = await fetch('/api/inventory/shop-transaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: 'sell',
            itemId: item.id,
            quantity: 1,
            biome: currentBiome,
            saturation: saturation[item.id] ?? 0,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          useGameStore.setState(s => ({
            player: s.player ? { ...s.player, inventory: data.inventory, equipment: data.equipment, stats: data.stats, gold: data.gold } : null
          }));
          setSaturation((prev) => ({
            ...prev,
            [item.id]: (prev[item.id] ?? 0) + 1,
          }));
          addToast(`Sold ${item.name} for ${price}g`, 'gold');
          return;
        } else {
          const err = await res.json().catch(() => ({ message: 'Sale failed.' }));
          addToast(err.message ?? 'Sale failed.', 'error');
          return;
        }
      } catch (e) {
        console.error('[Shop] Server error selling item, falling back to local:', e);
      }
    }

    // Remove from inventory and add gold
    const success = removeFromInventory(item.id, 1);
    if (success) {
      addGold(price);
      // Increase saturation
      setSaturation((prev) => ({
        ...prev,
        [item.id]: (prev[item.id] ?? 0) + 1,
      }));
      addToast(`Sold ${item.name} for ${price}g`, 'gold');
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
      <div className="glass p-6 w-full max-w-lg mx-4 flex flex-col max-h-[85vh] animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-realm-border pb-3 mb-4">
          <div>
            <h2 className="font-game text-xl text-white flex items-center gap-2"><Store className="w-5 h-5 text-realm-accent" /> Regional Trade Bazaar</h2>
            <p className="text-[10px] text-realm-text-muted capitalize mt-1">Current Location Biome: {currentBiome}</p>
          </div>
          <button onClick={closeMerchantShop} className="text-realm-text-muted hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-xs text-realm-text-muted font-ui mb-4">
          Supply and demand dictate rates! Selling large quantities to the same merchant will saturate their supply, causing local prices to crash.
        </p>

        {/* Currency & Inventory Status */}
        <div className="bg-realm-bg border border-realm-border rounded-lg p-3 mb-4 flex justify-between items-center text-xs font-mono">
          <span className="text-realm-text-muted">Your Gold: <span className="text-realm-gold font-bold">{player.gold ?? 0}g</span></span>
          <span className="text-realm-text-muted">Refining Material Stock</span>
        </div>

        {/* Trade Grid */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
          {MERCHANDISE.map((item) => {
            const buyInfo = getItemPrice(item, false);
            const sellInfo = getItemPrice(item, true);
            const userQty = player.inventory?.find((s) => s.item.id === item.id)?.quantity ?? 0;

            return (
              <div
                key={item.id}
                className="bg-realm-surface border border-realm-border hover:border-realm-accent/40 rounded-lg p-3 flex items-center justify-between transition-all"
              >
                {/* Details */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-black/40 border border-realm-border flex items-center justify-center">
                    {renderIcon(item.icon)}
                  </div>
                  <div>
                    <h3 className="font-game text-xs text-white">{item.name}</h3>
                    <div className="flex gap-2 text-[10px] mt-0.5">
                      <span className="text-realm-text-muted">Held: <span className="text-white">{userQty}</span></span>
                      {item.cheapBiomes.includes(currentBiome) && (
                        <span className="text-realm-xp font-semibold">Abundant Here</span>
                      )}
                      {item.expensiveBiomes.includes(currentBiome) && (
                        <span className="text-realm-gold font-semibold">Scarce Here</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Buy Column */}
                  <div className="text-center">
                    <button
                      onClick={() => handleBuy(item)}
                      className="btn-secondary text-[10px] py-1 px-3 w-16"
                    >
                      Buy
                    </button>
                    <div className="font-mono text-[9px] text-realm-gold mt-1">{buyInfo.price}g</div>
                  </div>

                  {/* Sell Column */}
                  <div className="text-center">
                    <button
                      onClick={() => handleSell(item)}
                      disabled={userQty <= 0}
                      className="btn-gold text-[10px] py-1 px-3 w-16 disabled:opacity-40"
                    >
                      Sell
                    </button>
                    <div className="font-mono text-[9px] text-realm-xp mt-1">
                      {sellInfo.price}g
                      {sellInfo.isCrashed && (
                        <span className="text-red-400 text-[8px] block">-{sellInfo.discount}% Sat.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <button className="btn-secondary w-full text-xs" onClick={closeMerchantShop}>
          Close Trade Interface
        </button>
      </div>
    </div>
  );
}
