import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Relic {
  id: string;
  name: string;
  rarity: 'ancient' | 'mythic' | 'celestial';
  icon: string;
  description: string;
  statBonus: {
    attack?: number;
    defense?: number;
    luck?: number;
    critChance?: number;
    elementalDamage?: number;
  };
  level: number;
  maxLevel: number;
  socketed: boolean;
}

interface RelicState {
  relics: Relic[];
  activeSocketId: string | null;
  essences: {
    fire: number;
    frost: number;
    void: number;
  };
  isRelicUIOpen: boolean;

  openRelicUI: () => void;
  closeRelicUI: () => void;
  toggleRelicUI: () => void;
  socketRelic: (id: string) => void;
  unsocketRelic: () => void;
  upgradeRelic: (id: string) => boolean;
  addEssence: (type: 'fire' | 'frost' | 'void', amount?: number) => void;
}

export const INITIAL_RELICS: Relic[] = [
  {
    id: 'eye_of_solaris',
    name: 'Eye of Solaris',
    rarity: 'mythic',
    icon: '👁️',
    description: 'Imbues spells with radiant sunfire (+15 Attack, +5% Crit).',
    statBonus: { attack: 15, critChance: 5 },
    level: 1,
    maxLevel: 5,
    socketed: true,
  },
  {
    id: 'heart_of_permafrost',
    name: 'Heart of Permafrost',
    rarity: 'ancient',
    icon: '❄️',
    description: 'Hardens skin with glacial barrier (+12 Defense, +20 Max HP).',
    statBonus: { defense: 12 },
    level: 1,
    maxLevel: 5,
    socketed: false,
  },
  {
    id: 'void_tome_of_infinity',
    name: 'Void Tome of Infinity',
    rarity: 'celestial',
    icon: '🔮',
    description: 'Bends realm reality to grant immense fortune (+10 Luck, +20 Elemental Damage).',
    statBonus: { luck: 10, elementalDamage: 20 },
    level: 1,
    maxLevel: 5,
    socketed: false,
  },
];

export const useRelicStore = create<RelicState>()(
  persist(
    (set, get) => ({
      relics: INITIAL_RELICS,
      activeSocketId: 'eye_of_solaris',
      essences: {
        fire: 10,
        frost: 10,
        void: 5,
      },
      isRelicUIOpen: false,

      openRelicUI: () => set({ isRelicUIOpen: true }),
      closeRelicUI: () => set({ isRelicUIOpen: false }),
      toggleRelicUI: () => set((s) => ({ isRelicUIOpen: !s.isRelicUIOpen })),

      socketRelic: (id: string) => {
        set((state) => ({
          relics: state.relics.map((r) => ({
            ...r,
            socketed: r.id === id,
          })),
          activeSocketId: id,
        }));
      },

      unsocketRelic: () => {
        set((state) => ({
          relics: state.relics.map((r) => ({ ...r, socketed: false })),
          activeSocketId: null,
        }));
      },

      upgradeRelic: (id: string) => {
        const relic = get().relics.find((r) => r.id === id);
        const { fire, frost, void: v } = get().essences;
        if (!relic || relic.level >= relic.maxLevel || fire < 5 || frost < 5 || v < 2) {
          return false;
        }

        set((state) => ({
          essences: {
            fire: state.essences.fire - 5,
            frost: state.essences.frost - 5,
            void: state.essences.void - 2,
          },
          relics: state.relics.map((r) => {
            if (r.id !== id) return r;
            const newLevel = r.level + 1;
            return {
              ...r,
              level: newLevel,
              statBonus: {
                attack: r.statBonus.attack ? r.statBonus.attack + 5 : undefined,
                defense: r.statBonus.defense ? r.statBonus.defense + 4 : undefined,
                luck: r.statBonus.luck ? r.statBonus.luck + 3 : undefined,
                critChance: r.statBonus.critChance ? r.statBonus.critChance + 2 : undefined,
                elementalDamage: r.statBonus.elementalDamage ? r.statBonus.elementalDamage + 8 : undefined,
              },
            };
          }),
        }));

        return true;
      },

      addEssence: (type, amount = 1) => {
        set((state) => ({
          essences: {
            ...state.essences,
            [type]: state.essences[type] + amount,
          },
        }));
      },
    }),
    {
      name: 'ir-relic-storage',
      partialize: (state) => ({
        relics: state.relics,
        activeSocketId: state.activeSocketId,
        essences: state.essences,
      }),
    }
  )
);
