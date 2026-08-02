import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardGold: number;
  rewardXp: number;
  unlocked: boolean;
  claimed: boolean;
  progress: number;
  maxProgress: number;
}

export interface BestiaryEntry {
  id: string;
  name: string;
  biome: string;
  icon: string;
  kills: number;
  description: string;
  weakness: string;
  lootDrops: string[];
}

interface CodexState {
  achievements: Achievement[];
  bestiary: Record<string, BestiaryEntry>;
  isCodexOpen: boolean;

  openCodex: () => void;
  closeCodex: () => void;
  toggleCodex: () => void;
  incrementAchievementProgress: (id: string, amount?: number) => void;
  claimAchievementReward: (id: string) => { gold: number; xp: number } | null;
  recordEnemyKill: (enemyType: string, name?: string, biome?: string, icon?: string, weakness?: string) => void;
}

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
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
  {
    id: 'monster_slayer',
    title: 'Monster Slayer',
    description: 'Defeat 25 aggressive creatures across biomes.',
    icon: '🐉',
    rewardGold: 250,
    rewardXp: 500,
    unlocked: false,
    claimed: false,
    progress: 0,
    maxProgress: 25,
  },
  {
    id: 'master_craftsman',
    title: 'Master Craftsman',
    description: 'Forge 5 weapons or armor pieces in the Blacksmith.',
    icon: '🔨',
    rewardGold: 150,
    rewardXp: 300,
    unlocked: false,
    claimed: false,
    progress: 0,
    maxProgress: 5,
  },
  {
    id: 'shrine_seeker',
    title: 'Shrine Seeker',
    description: 'Discover 3 ancient leylines or hidden shrines.',
    icon: '✨',
    rewardGold: 200,
    rewardXp: 400,
    unlocked: false,
    claimed: false,
    progress: 0,
    maxProgress: 3,
  },
];

export const useCodexStore = create<CodexState>()(
  persist(
    (set, get) => ({
      achievements: DEFAULT_ACHIEVEMENTS,
      bestiary: {
        goblin: { id: 'goblin', name: 'Goblin Raider', biome: 'Plains', icon: '👺', kills: 0, description: 'Small, nimble scavengers that strike in packs.', weakness: 'Fire Spells', lootDrops: ['Iron Ore', 'Minor Health Potion'] },
        skeleton: { id: 'skeleton', name: 'Skeletal Sentinel', biome: 'Dungeon', icon: '💀', kills: 0, description: 'Reanimated remains bound by shadow magic.', weakness: 'Blunt Melee', lootDrops: ['Iron Sword', 'Mystic Herbs'] },
        dragon: { id: 'dragon', name: 'Dungeon Warden', biome: 'Dungeon', icon: '🐲', kills: 0, description: 'Ancient apex predator guarding deep domain riches.', weakness: 'Ice Magic', lootDrops: ['Flame Blade', 'Lucky Ring'] },
      },
      isCodexOpen: false,

      openCodex: () => set({ isCodexOpen: true }),
      closeCodex: () => set({ isCodexOpen: false }),
      toggleCodex: () => set((s) => ({ isCodexOpen: !s.isCodexOpen })),

      incrementAchievementProgress: (id, amount = 1) => {
        set((state) => {
          const updated = state.achievements.map((ach) => {
            if (ach.id !== id || ach.unlocked) return ach;
            const newProgress = Math.min(ach.maxProgress, ach.progress + amount);
            const isUnlocked = newProgress >= ach.maxProgress;
            return {
              ...ach,
              progress: newProgress,
              unlocked: isUnlocked,
            };
          });
          return { achievements: updated };
        });
      },

      claimAchievementReward: (id) => {
        const ach = get().achievements.find((a) => a.id === id);
        if (!ach || !ach.unlocked || ach.claimed) return null;

        set((state) => ({
          achievements: state.achievements.map((a) =>
            a.id === id ? { ...a, claimed: true } : a
          ),
        }));

        return { gold: ach.rewardGold, xp: ach.rewardXp };
      },

      recordEnemyKill: (enemyType, name, biome, icon, weakness) => {
        const key = enemyType.toLowerCase();
        set((state) => {
          const current = state.bestiary[key] || {
            id: key,
            name: name || enemyType,
            biome: biome || 'Overworld',
            icon: icon || '👾',
            kills: 0,
            description: 'A dangerous creature wandering the realms.',
            weakness: weakness || 'Standard Physical',
            lootDrops: ['Gold', 'Crafting Materials'],
          };

          return {
            bestiary: {
              ...state.bestiary,
              [key]: {
                ...current,
                kills: current.kills + 1,
              },
            },
          };
        });

        // Trigger achievement progress
        get().incrementAchievementProgress('first_blood', 1);
        get().incrementAchievementProgress('monster_slayer', 1);
      },
    }),
    {
      name: 'ir-codex-storage',
      partialize: (state) => ({
        achievements: state.achievements,
        bestiary: state.bestiary,
      }),
    }
  )
);
