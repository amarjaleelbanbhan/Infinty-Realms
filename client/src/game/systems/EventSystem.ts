import { create } from 'zustand';
import type { WorldEvent } from '@shared/types';
import { useUIStore } from '@stores/useUIStore';

interface EventStore {
  activeEvent: WorldEvent | null;
  triggerEvent: (event: WorldEvent) => void;
  clearEvent: () => void;
}

export const useEventStore = create<EventStore>((set) => ({
  activeEvent: null,

  triggerEvent: (event) => {
    set({ activeEvent: event });
    useUIStore.getState().addToast(`🔥 WORLD EVENT: ${event.title}`, 'info');
  },

  clearEvent: () => set({ activeEvent: null }),
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

  triggerRandomEvent() {
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
      {
        id: `event-${Date.now()}-3`,
        type: 'arcane_aurora',
        title: '🌌 Arcane Leyline Surge',
        description: 'Magical aurora lights flood the sky! Leyline collectors extract double essence.',
        duration: 360,
        effects: '+100% Leyline essence extraction speed!',
        rewards: 'Pure Essence',
        startTime: Date.now(),
      },
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    useEventStore.getState().triggerEvent(event);
  }
}

export const eventSystem = new EventSystem();
