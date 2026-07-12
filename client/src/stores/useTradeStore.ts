import { create } from 'zustand';
import type { Item, TradeOffer, InventorySlot } from '@shared/types';
import { useGameStore } from './useGameStore';
import { useUIStore } from './useUIStore';
import { socketManager } from '@game/systems/SocketManager';

export type { TradeOffer };

interface IncomingTradeRequest {
  fromId: string;
  fromName: string;
}

interface TradeState {
  isActive: boolean;
  partnerId: string | null;
  partnerName: string | null;

  incomingRequest: IncomingTradeRequest | null;

  myOffer: TradeOffer;
  partnerOffer: TradeOffer;

  isLocked: boolean;
  isPartnerLocked: boolean;

  // Actions
  requestTrade: (partnerId: string, partnerName: string) => void;
  receiveTradeRequest: (fromId: string, fromName: string) => void;
  acceptIncomingRequest: () => void;
  declineIncomingRequest: () => void;
  handleRequestResponse: (accepted: boolean, partnerId: string, partnerName?: string, reason?: string) => void;
  initiateTrade: (partnerId: string, partnerName: string) => void;
  addItemToOffer: (item: Item, quantity: number) => void;
  removeItemFromOffer: (itemId: string, quantity: number) => void;
  setGoldOffer: (amount: number) => void;

  // Socket updates
  updatePartnerOffer: (offer: TradeOffer) => void;
  setPartnerLocked: (locked: boolean) => void;
  handlePartnerCancelled: () => void;
  applyTradeExecuted: (result: { gold: number; inventory: InventorySlot[] }) => void;
  handleTradeFailed: (reason: string) => void;

  // Lifecycle
  lockTrade: () => void;
  cancelTrade: () => void;
}

export const useTradeStore = create<TradeState>()((set, get) => ({
  isActive: false,
  partnerId: null,
  partnerName: null,

  incomingRequest: null,

  myOffer: { items: [], gold: 0 },
  partnerOffer: { items: [], gold: 0 },

  isLocked: false,
  isPartnerLocked: false,

  requestTrade: (partnerId, partnerName) => {
    socketManager.sendTradeRequest(partnerId);
    useUIStore.getState().addToast(`Trade request sent to ${partnerName}...`, 'info');
  },

  receiveTradeRequest: (fromId, fromName) => {
    set({ incomingRequest: { fromId, fromName } });
  },

  acceptIncomingRequest: () => {
    const request = get().incomingRequest;
    if (!request) return;
    socketManager.respondTradeRequest(request.fromId, true);
    set({ incomingRequest: null });
    get().initiateTrade(request.fromId, request.fromName);
  },

  declineIncomingRequest: () => {
    const request = get().incomingRequest;
    if (!request) return;
    socketManager.respondTradeRequest(request.fromId, false);
    set({ incomingRequest: null });
  },

  handleRequestResponse: (accepted, partnerId, partnerName, reason) => {
    if (accepted && partnerName) {
      get().initiateTrade(partnerId, partnerName);
    } else {
      useUIStore.getState().addToast(reason || `${partnerName || 'Player'} declined the trade.`, 'error');
    }
  },

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
    const { isLocked, myOffer, partnerId } = get();
    if (isLocked || !partnerId) return;

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

    const newOffer = { ...myOffer, items: newItems };
    set({ myOffer: newOffer });
    socketManager.sendTradeOfferUpdate(partnerId, newOffer);
  },

  removeItemFromOffer: (itemId, quantity) => {
    const { isLocked, myOffer, partnerId } = get();
    if (isLocked || !partnerId) return;

    const existing = myOffer.items.find(i => i.item.id === itemId);
    if (!existing) return;

    let newItems = [...myOffer.items];
    if (existing.quantity <= quantity) {
      newItems = newItems.filter(i => i.item.id !== itemId);
    } else {
      const idx = newItems.findIndex(i => i.item.id === itemId);
      newItems[idx] = { ...existing, quantity: existing.quantity - quantity };
    }

    const newOffer = { ...myOffer, items: newItems };
    set({ myOffer: newOffer });
    socketManager.sendTradeOfferUpdate(partnerId, newOffer);
  },

  setGoldOffer: (amount) => {
    const { isLocked, myOffer, partnerId } = get();
    if (isLocked || !partnerId) return;

    const player = useGameStore.getState().player;
    if (!player || (player.gold || 0) < amount) return;

    const newOffer = { ...myOffer, gold: Math.max(0, amount) };
    set({ myOffer: newOffer });
    socketManager.sendTradeOfferUpdate(partnerId, newOffer);
  },

  updatePartnerOffer: (offer) => {
    set({ partnerOffer: offer });
  },

  setPartnerLocked: (locked) => {
    // Execution is server-driven now: once both sides have sent tradeLock,
    // the server validates and applies the trade and pushes tradeExecuted/
    // tradeFailed back. The client no longer decides when to "complete."
    set({ isPartnerLocked: locked });
  },

  handlePartnerCancelled: () => {
    if (!get().isActive) return;
    useUIStore.getState().addToast(`${get().partnerName || 'Your partner'} cancelled the trade.`, 'error');
    set({ isActive: false, isLocked: false, isPartnerLocked: false, partnerId: null, partnerName: null });
    useUIStore.getState().closeTrade();
  },

  lockTrade: () => {
    const { partnerId } = get();
    if (!partnerId) return;
    set({ isLocked: true });
    socketManager.sendTradeLock(partnerId);
  },

  cancelTrade: () => {
    const { partnerId } = get();
    if (partnerId) socketManager.sendTradeCancel(partnerId);
    set({ isActive: false, isLocked: false, isPartnerLocked: false, partnerId: null, partnerName: null });
    useUIStore.getState().closeTrade();
  },

  applyTradeExecuted: (result) => {
    if (!get().isActive) return;
    const gameStore = useGameStore.getState();
    const uiStore = useUIStore.getState();

    // Authoritative — replace local gold/inventory with exactly what the
    // server computed, rather than recomputing the trade math client-side.
    gameStore.setPlayer({ ...gameStore.player, gold: result.gold, inventory: result.inventory });

    uiStore.addToast('Trade completed successfully.', 'success');
    set({ isActive: false, isLocked: false, isPartnerLocked: false, partnerId: null, partnerName: null });
    uiStore.closeTrade();
  },

  handleTradeFailed: (reason) => {
    if (!get().isActive) return;
    useUIStore.getState().addToast(reason || 'Trade failed.', 'error');
    set({ isActive: false, isLocked: false, isPartnerLocked: false, partnerId: null, partnerName: null });
    useUIStore.getState().closeTrade();
  },
}));
