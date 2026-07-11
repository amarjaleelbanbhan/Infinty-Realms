import { create } from 'zustand';

interface DungeonStore {
  isEntryModalOpen: boolean;
  dungeonSeed: string | null;
  biome: string;
  recommendedLevel: number;
  openEntryModal: (seed: string, biome: string, recommendedLevel: number) => void;
  closeEntryModal: () => void;
}

export const useDungeonStore = create<DungeonStore>((set) => ({
  isEntryModalOpen: false,
  dungeonSeed: null,
  biome: 'dungeon',
  recommendedLevel: 1,

  openEntryModal: (seed, biome, recommendedLevel) =>
    set({ isEntryModalOpen: true, dungeonSeed: seed, biome, recommendedLevel }),

  closeEntryModal: () =>
    set({ isEntryModalOpen: false, dungeonSeed: null }),
}));
