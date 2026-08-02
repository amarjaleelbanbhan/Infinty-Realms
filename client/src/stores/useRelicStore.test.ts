import { describe, it, expect, beforeEach } from 'vitest';
import { useRelicStore, INITIAL_RELICS } from './useRelicStore';

describe('useRelicStore', () => {
  beforeEach(() => {
    useRelicStore.setState({
      relics: INITIAL_RELICS,
      activeSocketId: 'eye_of_solaris',
      essences: { fire: 10, frost: 10, void: 5 },
      isRelicUIOpen: false,
    });
  });

  it('toggles and manages UI open state', () => {
    const store = useRelicStore.getState();
    expect(store.isRelicUIOpen).toBe(false);

    store.openRelicUI();
    expect(useRelicStore.getState().isRelicUIOpen).toBe(true);

    store.closeRelicUI();
    expect(useRelicStore.getState().isRelicUIOpen).toBe(false);

    store.toggleRelicUI();
    expect(useRelicStore.getState().isRelicUIOpen).toBe(true);
  });

  it('sockets and unsockets relics correctly', () => {
    const store = useRelicStore.getState();
    store.socketRelic('heart_of_permafrost');

    expect(useRelicStore.getState().activeSocketId).toBe('heart_of_permafrost');
    expect(useRelicStore.getState().relics.find((r) => r.id === 'heart_of_permafrost')?.socketed).toBe(true);
    expect(useRelicStore.getState().relics.find((r) => r.id === 'eye_of_solaris')?.socketed).toBe(false);

    store.unsocketRelic();
    expect(useRelicStore.getState().activeSocketId).toBeNull();
  });

  it('upgrades relic stats when essences are available', () => {
    const store = useRelicStore.getState();
    const upgraded = store.upgradeRelic('eye_of_solaris');

    expect(upgraded).toBe(true);
    const relic = useRelicStore.getState().relics.find((r) => r.id === 'eye_of_solaris');
    expect(relic?.level).toBe(2);
    expect(relic?.statBonus.attack).toBe(20);
    expect(useRelicStore.getState().essences.fire).toBe(5);
  });

  it('fails upgrade if essences are insufficient', () => {
    useRelicStore.setState({ essences: { fire: 0, frost: 0, void: 0 } });
    const upgraded = useRelicStore.getState().upgradeRelic('eye_of_solaris');

    expect(upgraded).toBe(false);
  });

  it('adds elemental essences', () => {
    useRelicStore.getState().addEssence('fire', 15);
    expect(useRelicStore.getState().essences.fire).toBe(25);
  });
});
