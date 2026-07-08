// ============================================================
// Quest System — AI quest generation + tracking
// ============================================================

import type { Quest, BiomeType, Season, QuestObjective } from '@shared/types';
import { useQuestStore } from '@stores/useQuestStore';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';
import { v4 as uuidv4 } from 'uuid';

// Mock AI generation (client-side fallback — real call hits server)
function generateMockQuest(biome: BiomeType, playerLevel: number): Partial<Quest> {
  const types = ['kill', 'collect', 'explore', 'mystery'] as const;
  const type = types[Math.floor(Math.random() * types.length)];

  const titles: Record<typeof type, string[]> = {
    kill:    ['Shadows in the Dark', 'The Haunted Hollow', 'Pest Control', 'Predator\'s End'],
    collect: ['Rare Components', 'The Alchemist\'s List', 'Scattered Pages', 'Crystal Hunt'],
    explore: ['Uncharted Territory', 'The Lost Road', 'Beyond the Veil', 'First Contact'],
    mystery: ['Strange Disappearances', 'The Cryptic Signal', 'Whispers at Midnight', 'The Vanishing'],
  };

  const lore: Record<BiomeType, string> = {
    plains:  'The golden plains hide ancient secrets beneath their tranquil surface.',
    forest:  'The deep woods stir with activity not seen in living memory.',
    desert:  'The dunes shift, revealing ruins older than the kingdom itself.',
    snow:    'The frozen north holds dangers that freeze more than the body.',
    ocean:   'The sea keeps its secrets — until it doesn\'t.',
    beach:   'The tide brings in strange cargo from distant shores.',
    volcano: 'The mountain\'s fire is matched only by the heat of conflict below.',
    swamp:   'The bog swallows secrets whole — yours included, if you\'re not careful.',
    dungeon: 'These halls have seen countless adventurers. Few left.',
  };

  return {
    id: uuidv4(),
    title: titles[type][Math.floor(Math.random() * titles[type].length)],
    description: `A quest suited for a level ${playerLevel} adventurer in the ${biome}.`,
    type,
    lore: lore[biome] ?? lore.plains,
    aiGenerated: false,
    status: 'available',
    objectives: [
      {
        description: type === 'kill' ? 'Defeat the enemies' : type === 'collect' ? 'Gather the materials' : 'Reach the destination',
        targetType: type === 'kill' ? 'enemy' : type === 'collect' ? 'item' : 'location',
        targetId: `${type}-${Math.floor(Math.random() * 100)}`,
        quantity: type === 'kill' ? 5 : type === 'collect' ? 3 : 1,
        current: 0,
      } as QuestObjective,
    ],
    rewards: {
      experience: Math.floor(80 + playerLevel * 25 * (0.8 + Math.random() * 0.4)),
      gold: Math.floor(30 + playerLevel * 12 * (0.8 + Math.random() * 0.4)),
      items: [],
    },
  };
}

export class QuestSystem {
  /** Fetch existing quests (and trigger auto-generation on server if empty) */
  async syncQuests() {
    const gameStore = useGameStore.getState();
    const token = gameStore.playerToken;
    const player = gameStore.player;
    const world = gameStore.worldState;
    if (!token || !player || !world) return;

    try {
      const biome: BiomeType = 'plains';
      const query = new URLSearchParams({
        worldSeed: world.seed ?? 'default',
        biome,
        season: world.season ?? 'spring',
        playerLevel: (player.level ?? 1).toString(),
      });
      const res = await fetch(`/api/quests/my?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as Quest[];
        const store = useQuestStore.getState();
        // Avoid duplicates
        for (const q of data) {
          if (!store.quests.find((existing) => existing.id === q.id)) {
            store.addQuest(q);
          }
        }
      }
    } catch (e) {
      console.error('[QuestSystem] Failed to sync quests:', e);
    }
  }

  /** Generate a new quest (tries server first, falls back to client mock) */
  async generateQuest(options?: { npcName?: string }): Promise<Quest> {
    const gameStore = useGameStore.getState();
    const uiStore = useUIStore.getState();

    const player = gameStore.player;
    const world = gameStore.worldState;

    const biome: BiomeType = 'plains'; // TODO: get from player position
    const playerLevel = player?.level ?? 1;
    const worldSeed = world?.seed ?? 'default';
    const season: Season = world?.season ?? 'spring';

    let questData: Partial<Quest>;

    try {
      const token = gameStore.playerToken;
      if (token) {
        const res = await fetch('/api/quests/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            worldSeed,
            biome,
            season,
            playerLevel,
            nearbyNpcName: options?.npcName,
          }),
        });
        if (res.ok) {
          questData = await res.json() as Partial<Quest>;
        } else {
          questData = generateMockQuest(biome, playerLevel);
        }
      } else {
        questData = generateMockQuest(biome, playerLevel);
      }
    } catch {
      questData = generateMockQuest(biome, playerLevel);
    }

    const quest: Quest = {
      id: questData.id ?? uuidv4(),
      title: questData.title ?? 'Unknown Quest',
      description: questData.description ?? '',
      type: questData.type ?? 'kill',
      lore: questData.lore ?? '',
      aiGenerated: questData.aiGenerated ?? false,
      objectives: questData.objectives ?? [],
      rewards: questData.rewards ?? { experience: 50, gold: 20, items: [] },
      status: 'available',
    };

    useQuestStore.getState().addQuest(quest);
    uiStore.addToast(`New quest: "${quest.title}"`, 'info');

    return quest;
  }

  /** Accept a quest */
  acceptQuest(questId: string) {
    const store = useQuestStore.getState();
    store.updateQuestStatus(questId, 'active');
    store.setActiveQuest(questId);
    useUIStore.getState().addToast('Quest accepted!', 'success');
  }

  /** Complete an objective */
  progressObjective(questId: string, objectiveIndex: number, amount = 1) {
    const store = useQuestStore.getState();
    const quest = store.quests.find((q) => q.id === questId);
    if (!quest) return;

    const obj = quest.objectives[objectiveIndex];
    if (!obj) return;

    const newCurrent = Math.min(obj.current + amount, obj.quantity);
    store.updateObjectiveProgress(questId, objectiveIndex, newCurrent);

    // Check if all objectives complete
    const updatedQuest = useQuestStore.getState().quests.find((q) => q.id === questId);
    if (updatedQuest && updatedQuest.objectives.every((o) => o.current >= o.quantity)) {
      this.completeQuest(questId);
    }
  }

  /** Complete a quest and grant rewards */
  completeQuest(questId: string) {
    const store = useQuestStore.getState();
    const quest = store.quests.find((q) => q.id === questId);
    if (!quest) return;

    store.updateQuestStatus(questId, 'completed');

    const gameStore = useGameStore.getState();
    if (quest.rewards.experience) gameStore.addExperience(quest.rewards.experience);
    if (quest.rewards.gold) gameStore.addGold(quest.rewards.gold);

    const uiStore = useUIStore.getState();
    uiStore.addToast(`Quest complete: "${quest.title}"`, 'success');
    if (quest.rewards.gold) uiStore.addToast(`+${quest.rewards.gold} gold`, 'gold');
    if (quest.rewards.experience) uiStore.addToast(`+${quest.rewards.experience} XP`, 'success');
  }
}

export const questSystem = new QuestSystem();
