import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTradeStore } from './useTradeStore';
import { useGameStore } from './useGameStore';
import type { Item } from '@shared/types';

vi.mock('@game/systems/SocketManager', () => ({
  socketManager: {
    sendTradeRequest: vi.fn(),
    respondTradeRequest: vi.fn(),
    sendTradeOfferUpdate: vi.fn(),
    sendTradeLock: vi.fn(),
    sendTradeCancel: vi.fn(),
  },
}));

import { socketManager } from '@game/systems/SocketManager';

function makeItem(id: string, overrides: Partial<Item> = {}): Item {
  return { id, name: id, description: '', type: 'material', rarity: 'common', icon: '', value: 1, ...overrides };
}

describe('useTradeStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTradeStore.setState({
      isActive: false,
      partnerId: null,
      partnerName: null,
      incomingRequest: null,
      myOffer: { items: [], gold: 0 },
      partnerOffer: { items: [], gold: 0 },
      isLocked: false,
      isPartnerLocked: false,
    });
  });

  describe('initiateTrade / requestTrade', () => {
    it('sends a real trade request over the socket rather than faking one', () => {
      useTradeStore.getState().requestTrade('bob-id', 'Bob');
      expect(socketManager.sendTradeRequest).toHaveBeenCalledWith('bob-id');
    });

    it('opens the trade window with a clean offer state', () => {
      useTradeStore.getState().initiateTrade('bob-id', 'Bob');
      const state = useTradeStore.getState();
      expect(state.isActive).toBe(true);
      expect(state.partnerId).toBe('bob-id');
      expect(state.myOffer).toEqual({ items: [], gold: 0 });
      expect(state.isLocked).toBe(false);
    });
  });

  describe('incoming trade requests', () => {
    it('accepting relays acceptance to the requester and opens the trade window', () => {
      useTradeStore.getState().receiveTradeRequest('alice-id', 'Alice');
      useTradeStore.getState().acceptIncomingRequest();

      expect(socketManager.respondTradeRequest).toHaveBeenCalledWith('alice-id', true);
      expect(useTradeStore.getState().incomingRequest).toBeNull();
      expect(useTradeStore.getState().isActive).toBe(true);
      expect(useTradeStore.getState().partnerId).toBe('alice-id');
    });

    it('declining relays refusal and does not open a trade window', () => {
      useTradeStore.getState().receiveTradeRequest('alice-id', 'Alice');
      useTradeStore.getState().declineIncomingRequest();

      expect(socketManager.respondTradeRequest).toHaveBeenCalledWith('alice-id', false);
      expect(useTradeStore.getState().isActive).toBe(false);
    });
  });

  describe('addItemToOffer', () => {
    beforeEach(() => {
      useTradeStore.getState().initiateTrade('bob-id', 'Bob');
    });

    it('does nothing if the player has no inventory to offer from', () => {
      useGameStore.setState({ player: null });
      useTradeStore.getState().addItemToOffer(makeItem('sword'), 1);
      expect(useTradeStore.getState().myOffer.items).toEqual([]);
      expect(socketManager.sendTradeOfferUpdate).not.toHaveBeenCalled();
    });

    it('will not let a player offer more of an item than they actually hold', () => {
      const sword = makeItem('sword');
      useGameStore.setState({ player: { inventory: [{ item: sword, quantity: 2 }] } as any });

      useTradeStore.getState().addItemToOffer(sword, 5);
      expect(useTradeStore.getState().myOffer.items).toEqual([]);

      useTradeStore.getState().addItemToOffer(sword, 2);
      expect(useTradeStore.getState().myOffer.items).toEqual([{ item: sword, quantity: 2 }]);
      expect(socketManager.sendTradeOfferUpdate).toHaveBeenCalledWith('bob-id', { items: [{ item: sword, quantity: 2 }], gold: 0 });
    });

    it('is a no-op once the offer is locked', () => {
      const sword = makeItem('sword');
      useGameStore.setState({ player: { inventory: [{ item: sword, quantity: 2 }] } as any });
      useTradeStore.setState({ isLocked: true });

      useTradeStore.getState().addItemToOffer(sword, 1);
      expect(useTradeStore.getState().myOffer.items).toEqual([]);
    });
  });

  describe('setGoldOffer', () => {
    beforeEach(() => {
      useTradeStore.getState().initiateTrade('bob-id', 'Bob');
    });

    it('will not let a player offer more gold than they have', () => {
      useGameStore.setState({ player: { gold: 50 } as any });

      useTradeStore.getState().setGoldOffer(999);
      expect(useTradeStore.getState().myOffer.gold).toBe(0);

      useTradeStore.getState().setGoldOffer(30);
      expect(useTradeStore.getState().myOffer.gold).toBe(30);
      expect(socketManager.sendTradeOfferUpdate).toHaveBeenCalledWith('bob-id', { items: [], gold: 30 });
    });
  });

  describe('lockTrade / cancelTrade', () => {
    it('lockTrade relays the lock but does NOT apply the trade locally (server is authoritative)', () => {
      useTradeStore.getState().initiateTrade('bob-id', 'Bob');
      useTradeStore.getState().lockTrade();

      expect(socketManager.sendTradeLock).toHaveBeenCalledWith('bob-id');
      expect(useTradeStore.getState().isLocked).toBe(true);
      // Trade must still be active — completion only happens via a server tradeExecuted push.
      expect(useTradeStore.getState().isActive).toBe(true);
    });

    it('cancelTrade relays cancellation and resets local state', () => {
      useTradeStore.getState().initiateTrade('bob-id', 'Bob');
      useTradeStore.getState().cancelTrade();

      expect(socketManager.sendTradeCancel).toHaveBeenCalledWith('bob-id');
      expect(useTradeStore.getState().isActive).toBe(false);
      expect(useTradeStore.getState().partnerId).toBeNull();
    });
  });

  describe('server-authoritative trade resolution', () => {
    it('applyTradeExecuted replaces gold/inventory with exactly what the server computed', () => {
      useTradeStore.getState().initiateTrade('bob-id', 'Bob');
      useGameStore.setState({ player: { id: 'me', gold: 10, inventory: [] } as any });

      const potion = makeItem('potion');
      useTradeStore.getState().applyTradeExecuted({ gold: 40, inventory: [{ item: potion, quantity: 3 }] });

      expect(useGameStore.getState().player?.gold).toBe(40);
      expect(useGameStore.getState().player?.inventory).toEqual([{ item: potion, quantity: 3 }]);
      expect(useTradeStore.getState().isActive).toBe(false);
    });

    it('handleTradeFailed closes the trade without mutating player state', () => {
      useTradeStore.getState().initiateTrade('bob-id', 'Bob');
      useGameStore.setState({ player: { id: 'me', gold: 10, inventory: [] } as any });

      useTradeStore.getState().handleTradeFailed('Bob does not have the offered item.');

      expect(useGameStore.getState().player?.gold).toBe(10);
      expect(useTradeStore.getState().isActive).toBe(false);
    });
  });
});
