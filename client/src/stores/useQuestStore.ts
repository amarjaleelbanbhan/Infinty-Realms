import { create } from 'zustand';
import type { Quest, QuestStatus } from '@shared/types';

interface QuestStore {
  quests: Quest[];
  activeQuestId: string | null;

  addQuest: (quest: Quest) => void;
  setActiveQuest: (id: string | null) => void;
  updateQuestStatus: (id: string, status: QuestStatus) => void;
  updateObjectiveProgress: (questId: string, objectiveIndex: number, current: number) => void;
  getActiveQuest: () => Quest | undefined;
  getQuestsByStatus: (status: QuestStatus) => Quest[];
  clearAll: () => void;
}

export const useQuestStore = create<QuestStore>((set, get) => ({
  quests: [],
  activeQuestId: null,

  addQuest: (quest) =>
    set((s) => ({ quests: [quest, ...s.quests] })),

  setActiveQuest: (id) => set({ activeQuestId: id }),

  updateQuestStatus: (id, status) =>
    set((s) => ({
      quests: s.quests.map((q) => (q.id === id ? { ...q, status } : q)),
    })),

  updateObjectiveProgress: (questId, objectiveIndex, current) =>
    set((s) => ({
      quests: s.quests.map((q) =>
        q.id === questId
          ? {
              ...q,
              objectives: q.objectives.map((obj, i) =>
                i === objectiveIndex ? { ...obj, current } : obj
              ),
            }
          : q
      ),
    })),

  getActiveQuest: () => {
    const { quests, activeQuestId } = get();
    return quests.find((q) => q.id === activeQuestId);
  },

  getQuestsByStatus: (status) => get().quests.filter((q) => q.status === status),

  clearAll: () => set({ quests: [], activeQuestId: null }),
}));
