import { describe, it, expect, beforeEach } from 'vitest';
import { useCodexStore } from './useCodexStore';

describe('useCodexStore', () => {
  beforeEach(() => {
    useCodexStore.setState({
      achievements: [
        {
          id: 'first_blood',
          title: 'First Blood',
          description: 'Vanquish your first enemy in the realm.',
          icon: '⚔️',
          rewardGold: 50,
          rewardXp: 100,
          unlocked: false,
          claimed: false,
          progress: 0,
          maxProgress: 1,
        },
      ],
      bestiary: {},
      isCodexOpen: false,
    });
  });

  it('toggles and opens codex window state', () => {
    const store = useCodexStore.getState();
    expect(store.isCodexOpen).toBe(false);

    store.openCodex();
    expect(useCodexStore.getState().isCodexOpen).toBe(true);

    store.closeCodex();
    expect(useCodexStore.getState().isCodexOpen).toBe(false);

    store.toggleCodex();
    expect(useCodexStore.getState().isCodexOpen).toBe(true);
  });

  it('increments achievement progress and unlocks when max reached', () => {
    const store = useCodexStore.getState();
    expect(store.achievements[0].unlocked).toBe(false);

    store.incrementAchievementProgress('first_blood', 1);
    const updated = useCodexStore.getState().achievements[0];

    expect(updated.progress).toBe(1);
    expect(updated.unlocked).toBe(true);
  });

  it('claims reward for unlocked achievement', () => {
    const store = useCodexStore.getState();
    store.incrementAchievementProgress('first_blood', 1);

    const reward = useCodexStore.getState().claimAchievementReward('first_blood');
    expect(reward).toEqual({ gold: 50, xp: 100 });

    const claimedState = useCodexStore.getState().achievements[0];
    expect(claimedState.claimed).toBe(true);

    // Double claim returns null
    const secondClaim = useCodexStore.getState().claimAchievementReward('first_blood');
    expect(secondClaim).toBeNull();
  });

  it('records enemy kill in bestiary and increments kill count', () => {
    const store = useCodexStore.getState();
    store.recordEnemyKill('goblin', 'Goblin Raider', 'Plains', '👺', 'Fire Spells');

    const entry = useCodexStore.getState().bestiary['goblin'];
    expect(entry).toBeDefined();
    expect(entry.kills).toBe(1);
    expect(entry.name).toBe('Goblin Raider');

    store.recordEnemyKill('goblin');
    expect(useCodexStore.getState().bestiary['goblin'].kills).toBe(2);
  });
});
