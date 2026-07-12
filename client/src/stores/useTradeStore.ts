import { create } from 'zustand';
import type { Item } from '@shared/types';
import { useGameStore } from './useGameStore';
import { useUIStore } from './useUIStore';

export interface TradeOffer {
  items: Array<{ item: Item, quantity: number }>;
  gold: number;
}

interface TradeState {
  isActive: boolean;
  partnerId: string | null;
  partnerName: string | null;
  
  myOffer: TradeOffer;
  partnerOffer: TradeOffer;
  
  isLocked: boolean;
  isPartnerLocked: boolean;
  
  // Actions
  initiateTrade: (partnerId: string, partnerName: string) => void;
  addItemToOffer: (item: Item, quantity: number) => void;
  removeItemFromOffer: (itemId: string, quantity: number) => void;
  setGoldOffer: (amount: number) => void;
  
  // Socket updates
  updatePartnerOffer: (offer: TradeOffer) => void;
  setPartnerLocked: (locked: boolean) => void;
  
  // Lifecycle
  lockTrade: () => void;
  cancelTrade: () => void;
  completeTrade: () => void;
}

export const useTradeStore = create<TradeState>()((set, get) => ({
  isActive: false,
  partnerId: null,
  partnerName: null,
  
  myOffer: { items: [], gold: 0 },
  partnerOffer: { items: [], gold: 0 },
  
  isLocked: false,
  isPartnerLocked: false,

  initiateTrade: (partnerId, partnerName) => {
    set({
      isActive: true,
      partnerId,
      partnerName,
      myOffer: { items: [], gold: 0 },
      partnerOffer: { items: [], gold: 0 },
      isLocked: false,
      isPartnerLocked: false
    });
    useUIStore.getState().openTrade();
  },

  addItemToOffer: (item, quantity) => {
    const { isLocked, myOffer } = get();
    if (isLocked) return;

    // Check if player actually has this item
    const player = useGameStore.getState().player;
    if (!player || !player.inventory) return;

    const invItem = player.inventory.find(i => i.item.id === item.id);
    if (!invItem || invItem.quantity < quantity) return;

    const existing = myOffer.items.find(i => i.item.id === item.id);
    
    // We must ensure the offered amount doesn't exceed inventory amount
    const currentOffered = existing ? existing.quantity : 0;
    if (currentOffered + quantity > invItem.quantity) return;

    const newItems = [...myOffer.items];
    if (existing) {
      existing.quantity += quantity;
    } else {
      newItems.push({ item, quantity });
    }

    set({ myOffer: { ...myOffer, items: newItems } });
    
    // In real app, emit to socket: socketManager.sendTradeUpdate(get().myOffer)
    window.dispatchEvent(new CustomEvent('ir:trade_update_local', { detail: get().myOffer }));
  },

  removeItemFromOffer: (itemId, quantity) => {
    const { isLocked, myOffer } = get();
    if (isLocked) return;

    const existing = myOffer.items.find(i => i.item.id === itemId);
    if (!existing) return;

    let newItems = [...myOffer.items];
    if (existing.quantity <= quantity) {
      newItems = newItems.filter(i => i.item.id !== itemId);
    } else {
      const idx = newItems.findIndex(i => i.item.id === itemId);
      newItems[idx] = { ...existing, quantity: existing.quantity - quantity };
    }

    set({ myOffer: { ...myOffer, items: newItems } });
    window.dispatchEvent(new CustomEvent('ir:trade_update_local', { detail: get().myOffer }));
  },

  setGoldOffer: (amount) => {
    const { isLocked, myOffer } = get();
    if (isLocked) return;
    
    const player = useGameStore.getState().player;
    if (!player || (player.gold || 0) < amount) return;

    set({ myOffer: { ...myOffer, gold: Math.max(0, amount) } });
    window.dispatchEvent(new CustomEvent('ir:trade_update_local', { detail: get().myOffer }));
  },

  updatePartnerOffer: (offer) => {
    set({ partnerOffer: offer });
  },

  setPartnerLocked: (locked) => {
    set({ isPartnerLocked: locked });
    // If both locked, we complete
    if (locked && get().isLocked) {
      setTimeout(() => get().completeTrade(), 1000);
    }
  },

  lockTrade: () => {
    set({ isLocked: true });
    window.dispatchEvent(new CustomEvent('ir:trade_lock_local'));
    
    if (get().isPartnerLocked) {
      setTimeout(() => get().completeTrade(), 1000);
    }
  },

  cancelTrade: () => {
    set({ isActive: false, isLocked: false, isPartnerLocked: false });
    window.dispatchEvent(new CustomEvent('ir:trade_cancel_local'));
    useUIStore.getState().closeTrade();
  },

  completeTrade: () => {
    const state = get();
    if (!state.isActive) return;

    const gameStore = useGameStore.getState();
    const uiStore = useUIStore.getState();

    // Deduct my offer
    state.myOffer.items.forEach(offered => {
      gameStore.removeFromInventory(offered.item.id, offered.quantity);
    });
    if (state.myOffer.gold > 0) {
       // A bit hacky since there is no removeGold, we'll use a negative addGold or just update it
       const currentGold = gameStore.player?.gold || 0;
       gameStore.updatePlayerStats({} as any); // Force a re-render if needed
       gameStore.setPlayer({ ...gameStore.player, gold: Math.max(0, currentGold - state.myOffer.gold) });
    }

    // Add partner offer
    state.partnerOffer.items.forEach(received => {
      gameStore.addToInventory(received.item, received.quantity);
    });
    if (state.partnerOffer.gold > 0) {
      gameStore.addGold(state.partnerOffer.gold);
    }

    uiStore.addToast('Trade completed successfully.', 'success');
    set({ isActive: false, isLocked: false, isPartnerLocked: false });
    uiStore.closeTrade();
  }
}));
