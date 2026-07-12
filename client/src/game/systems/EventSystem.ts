import { create } from 'zustand';
import type { WorldEvent } from '@shared/types';
import { useUIStore } from '@stores/useUIStore';

import { useGameStore } from '@stores/useGameStore';

interface EventStore {
  activeEvent: WorldEvent | null;
  triggerEvent: (event: WorldEvent) => void;
  clearEvent: () => void;
}

export const useEventStore = create<EventStore>((set, get) => ({
  activeEvent: null,

  triggerEvent: (event) => {
    set({ activeEvent: event });
    useUIStore.getState().addToast(`🔥 WORLD EVENT: ${event.title}`, 'info');
    window.dispatchEvent(new CustomEvent('ir:world_event_start', { detail: event }));
  },

  clearEvent: () => {
    const prev = get().activeEvent;
    if (prev) {
      window.dispatchEvent(new CustomEvent('ir:world_event_end', { detail: prev }));
    }
    set({ activeEvent: null });
  },
}));

export class EventSystem {
  private timer: ReturnType<typeof setInterval> | null = null;

  start() {
    // Check every 90 seconds for potential dynamic events
    this.timer = setInterval(() => {
      if (Math.random() < 0.35) {
        this.triggerRandomEvent();
      }
    }, 90_000);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }

  async triggerRandomEvent() {
    const gameStore = useGameStore.getState();
    const token = gameStore.playerToken;
    const player = gameStore.player;

    let event: WorldEvent | null = null;

    if (token && player) {
      try {
        const res = await fetch('/api/world/dm/event', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            playerLevel: player.level ?? 1,
            playerGold: player.gold ?? 0,
            currentBiome: 'plains',
            currentSeason: gameStore.worldState?.season ?? 'spring',
          }),
        });

        if (res.ok) {
          event = await res.json();
        }
      } catch (err) {
        console.warn('[EventSystem] Server DM event fetch failed, falling back to local pool:', err);
      }
    }

    if (!event) {
      const events: WorldEvent[] = [
        {
          id: `event-${Date.now()}-1`,
          type: 'meteor_strike',
          title: '☄️ Starfall over the Plains',
          description: 'A glowing meteor has struck nearby! Rare star minerals are scatter-dropped in the region.',
          duration: 300,
          effects: 'Double Gold & Gem drops from all enemies!',
          rewards: 'Starfall Essence & Gold',
          startTime: Date.now(),
        },
        {
          id: `event-${Date.now()}-2`,
          type: 'dragon_attack',
          title: '🐉 Dragon\'s Fury Awakening',
          description: 'An ancient wyrm stirs in the volcanic peaks! Flame embers rain from the sky.',
          duration: 240,
          effects: 'Enemies gain +25% Attack, but grant +100% XP!',
          rewards: 'Dragon Scale & Legendary Loot',
          startTime: Date.now(),
        },
      ];
      event = events[Math.floor(Math.random() * events.length)];
    }

    if (event) {
      useEventStore.getState().triggerEvent(event);
    }
  }
}

export const eventSystem = new EventSystem();
