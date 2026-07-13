import { create } from 'zustand';
import type { Item } from '@shared/types';
import { useGameStore } from './useGameStore';
import { useUIStore } from './useUIStore';

export interface MarketItem {
  item: Item;
  price: number; // Buy price
  stock?: number;
}

interface MarketState {
  isOpen: boolean;
  marketItems: MarketItem[];
  openMarket: (items: MarketItem[]) => void;
  closeMarket: () => void;
  buyItem: (itemId: string, quantity?: number) => Promise<void>;
  sellItem: (itemId: string, quantity?: number) => Promise<void>;
}

const DEFAULT_MARKET_ITEMS: MarketItem[] = [
  {
    item: { id: 'health-potion-1', name: 'Minor Health Potion', type: 'consumable', rarity: 'common', value: 10, icon: '🧪', description: 'Restores 50 HP.' },
    price: 15,
  },
  {
    item: { id: 'magic-seed', name: 'Leyline Seed', type: 'seed', rarity: 'uncommon', value: 5, icon: '🌱', description: 'Plant on dirt to grow crops.' },
    price: 10,
  },
  {
    item: { id: 'iron-sword', name: 'Iron Sword', type: 'weapon', rarity: 'common', value: 50, icon: '🗡️', description: 'A basic iron sword.' },
    price: 75,
  }
];

export const useMarketStore = create<MarketState>((set, get) => ({
  isOpen: false,
  marketItems: DEFAULT_MARKET_ITEMS,

  openMarket: (items) => set({ isOpen: true, marketItems: items?.length ? items : DEFAULT_MARKET_ITEMS }),
  closeMarket: () => set({ isOpen: false }),

  buyItem: async (itemId, quantity = 1) => {
    const state = get();
    const marketItem = state.marketItems.find(m => m.item.id === itemId);
    if (!marketItem) return;

    const gameStore = useGameStore.getState();
    const uiStore = useUIStore.getState();
    const token = gameStore.playerToken;

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
            itemId,
            quantity,
            biome: 'plains',
            saturation: 0,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          useGameStore.setState(s => ({
            player: s.player ? { ...s.player, inventory: data.inventory, equipment: data.equipment, stats: data.stats, gold: data.gold } : null
          }));
          uiStore.addToast(`Bought ${quantity}x ${marketItem.item.name}`, 'success');
          return;
        } else {
          const err = await res.json().catch(() => ({ message: 'Transaction failed.' }));
          uiStore.addToast(err.message ?? 'Transaction failed.', 'error');
          return;
        }
      } catch (e) {
        console.error('[Market] Server error buying item, falling back to local:', e);
      }
    }

    const totalCost = marketItem.price * quantity;
    const playerGold = gameStore.player?.gold ?? 0;

    if (playerGold >= totalCost) {
      gameStore.addGold(-totalCost);
      gameStore.addToInventory(marketItem.item, quantity);
      uiStore.addToast(`Bought ${quantity}x ${marketItem.item.name}`, 'success');
    } else {
      uiStore.addToast("Not enough gold!", 'error');
    }
  },

  sellItem: async (itemId, quantity = 1) => {
    const gameStore = useGameStore.getState();
    const uiStore = useUIStore.getState();
    const inventoryItem = gameStore.player?.inventory?.find(i => i.item.id === itemId);
    
    if (!inventoryItem || inventoryItem.quantity < quantity) {
      uiStore.addToast("You don't have enough of this item.", 'error');
      return;
    }

    const token = gameStore.playerToken;
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
            itemId,
            quantity,
            biome: 'plains',
            saturation: 0,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          useGameStore.setState(s => ({
            player: s.player ? { ...s.player, inventory: data.inventory, equipment: data.equipment, stats: data.stats, gold: data.gold } : null
          }));
          uiStore.addToast(`Sold ${quantity}x ${inventoryItem.item.name}`, 'success');
          return;
        } else {
          const err = await res.json().catch(() => ({ message: 'Transaction failed.' }));
          uiStore.addToast(err.message ?? 'Transaction failed.', 'error');
          return;
        }
      } catch (e) {
        console.error('[Market] Server error selling item, falling back to local:', e);
      }
    }

    const sellPrice = Math.max(1, Math.floor((inventoryItem.item.value || 1) * 0.5));
    const totalRevenue = sellPrice * quantity;

    if (gameStore.removeFromInventory(itemId, quantity)) {
      gameStore.addGold(totalRevenue);
      uiStore.addToast(`Sold ${quantity}x ${inventoryItem.item.name} for ${totalRevenue}g`, 'success');
    }
  }
}));
