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
  buyItem: (itemId: string, quantity?: number) => void;
  sellItem: (itemId: string, quantity?: number) => void;
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

  buyItem: (itemId, quantity = 1) => {
    const state = get();
    const marketItem = state.marketItems.find(m => m.item.id === itemId);
    if (!marketItem) return;

    const gameStore = useGameStore.getState();
    const totalCost = marketItem.price * quantity;
    const playerGold = gameStore.player?.gold ?? 0;

    if (playerGold >= totalCost) {
      // Deduct gold
      gameStore.addGold(-totalCost);
      // Add item
      gameStore.addToInventory(marketItem.item, quantity);
      useUIStore.getState().addToast(`Bought ${quantity}x ${marketItem.item.name}`, 'success');
    } else {
      useUIStore.getState().addToast("Not enough gold!", 'error');
    }
  },

  sellItem: (itemId, quantity = 1) => {
    const gameStore = useGameStore.getState();
    const inventoryItem = gameStore.player?.inventory?.find(i => i.item.id === itemId);
    
    if (!inventoryItem || inventoryItem.quantity < quantity) {
      useUIStore.getState().addToast("You don't have enough of this item.", 'error');
      return;
    }

    // Sell price is usually half the item's base value
    const sellPrice = Math.max(1, Math.floor((inventoryItem.item.value || 1) * 0.5));
    const totalRevenue = sellPrice * quantity;

    if (gameStore.removeFromInventory(itemId, quantity)) {
      gameStore.addGold(totalRevenue);
      useUIStore.getState().addToast(`Sold ${quantity}x ${inventoryItem.item.name} for ${totalRevenue}g`, 'success');
    }
  }
}));
