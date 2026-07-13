import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameStore } from './useGameStore';
import type { Item } from '@shared/types';

// Mock global fetch
const fetchMock = vi.fn();
globalThis.fetch = fetchMock;

describe('useGameStore inventory API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.setState({
      playerToken: 'test-token',
      player: {
        id: 'p1',
        name: 'Player',
        gold: 100,
        experience: 0,
        level: 1,
        inventory: [
          {
            item: { id: 'health-potion-1', name: 'Potion', type: 'consumable', rarity: 'common', value: 10, icon: '🧪', description: '' },
            quantity: 2,
          },
          {
            item: { id: 'iron-sword', name: 'Sword', type: 'weapon', rarity: 'common', value: 50, icon: '🗡️', description: '' },
            quantity: 1,
          },
        ],
        equipment: {},
        stats: { hp: 50, maxHp: 100, mana: 50, maxMana: 50, attack: 10, defense: 5, speed: 150, luck: 5 },
      },
    });
  });

  it('calls server equip endpoint and updates state on success', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        inventory: [],
        equipment: {
          weapon: { id: 'iron-sword', name: 'Sword', type: 'weapon', rarity: 'common', value: 50, icon: '🗡️', description: '' },
        },
        stats: { hp: 50, maxHp: 100, attack: 15, defense: 5, speed: 150, luck: 5 },
      }),
    });

    const sword = useGameStore.getState().player?.inventory?.[1].item;
    expect(sword).toBeDefined();

    await useGameStore.getState().equipItem(sword!);

    expect(fetchMock).toHaveBeenCalledWith('/api/inventory/equip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({ itemId: 'iron-sword', slot: 'weapon' }),
    });

    const player = useGameStore.getState().player;
    expect(player?.equipment?.weapon?.id).toBe('iron-sword');
    expect(player?.stats?.attack).toBe(15);
    expect(player?.inventory?.length).toBe(0);
  });

  it('calls server consume endpoint and updates state on success', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        inventory: [
          {
            item: { id: 'health-potion-1', name: 'Potion', type: 'consumable', rarity: 'common', value: 10, icon: '🧪', description: '' },
            quantity: 1,
          },
        ],
        equipment: {},
        stats: { hp: 100, maxHp: 100, attack: 10, defense: 5, speed: 150, luck: 5 },
      }),
    });

    const potion = useGameStore.getState().player?.inventory?.[0].item;
    expect(potion).toBeDefined();

    await useGameStore.getState().consumeItem(potion!);

    expect(fetchMock).toHaveBeenCalledWith('/api/inventory/consume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({ itemId: 'health-potion-1' }),
    });

    const player = useGameStore.getState().player;
    expect(player?.stats?.hp).toBe(100);
    expect(player?.inventory?.[0].quantity).toBe(1);
  });

  it('falls back to local logic on consume if server is unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    const potion = useGameStore.getState().player?.inventory?.[0].item;
    await useGameStore.getState().consumeItem(potion!);

    const player = useGameStore.getState().player;
    expect(player?.stats?.hp).toBe(60); // local fallback does hp + 10 (value of potion)
    expect(player?.inventory?.[0].quantity).toBe(1);
  });
});
