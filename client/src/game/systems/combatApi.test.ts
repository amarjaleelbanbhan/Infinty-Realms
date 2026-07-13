import { describe, it, expect, vi, beforeEach } from 'vitest';
import { claimKillReward } from './combatApi';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';

// Mock global fetch
const fetchMock = vi.fn();
globalThis.fetch = fetchMock;

describe('combatApi.claimKillReward', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.setState({
      playerToken: 'test-token',
      player: {
        id: 'p1',
        name: 'Player',
        experience: 0,
        gold: 0,
        level: 1,
      },
    });
    useUIStore.setState({
      toasts: [],
    });
  });

  it('posts correct parameters to server and updates client state on success', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        xpAwarded: 20,
        goldAwarded: 8,
        totalXp: 120,
        totalGold: 58,
      }),
    });

    await claimKillReward('skeleton', 3);

    // Assert fetch call details
    expect(fetchMock).toHaveBeenCalledWith('/api/combat/kill-claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({ enemyType: 'skeleton', enemyLevel: 3 }),
      signal: expect.any(AbortSignal),
    });

    // Client store state is updated to matches server response
    const game = useGameStore.getState();
    expect(game.player?.experience).toBe(120);
    expect(game.player?.gold).toBe(58);
  });

  it('falls back to offline logic when server is unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    // Try claiming wolf kill (base xp 18, base gold 5)
    await claimKillReward('wolf', 1);

    // Client updates locally (falls back to local increments)
    const game = useGameStore.getState();
    expect(game.player?.experience).toBe(18);
    expect(game.player?.gold).toBe(5);
  });
});
