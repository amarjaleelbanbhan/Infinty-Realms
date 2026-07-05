import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { v4 as uuidv4 } from 'uuid';
import type { BiomeType, Season } from '@infinity-realms/shared/types';

@Injectable()
export class QuestsService {
  constructor(
    private prisma: PrismaService,
    private ai: AiService,
  ) {}

  async generateAndSave(options: {
    worldSeed: string;
    biome: BiomeType;
    season: Season;
    playerLevel: number;
    playerId: string;
    nearbyNpcName?: string;
  }) {
    const generated = await this.ai.generateQuest({
      worldSeed: options.worldSeed,
      biome: options.biome,
      season: options.season,
      playerLevel: options.playerLevel,
      nearbyNpcName: options.nearbyNpcName,
    });

    return this.prisma.quest.create({
      data: {
        id: uuidv4(),
        title: generated.title ?? 'Unnamed Quest',
        description: generated.description ?? '',
        type: generated.type ?? 'kill',
        lore: generated.lore ?? '',
        aiGenerated: generated.aiGenerated ?? false,
        objectivesJson: JSON.stringify(generated.objectives ?? []),
        rewardsJson: JSON.stringify(generated.rewards ?? {}),
        status: 'available',
        playerId: options.playerId,
      },
    });
  }

  async getPlayerQuests(playerId: string) {
    const quests = await this.prisma.quest.findMany({
      where: { playerId },
      orderBy: { createdAt: 'desc' },
    });

    return quests.map((q) => ({
      ...q,
      objectives: JSON.parse(q.objectivesJson),
      rewards: JSON.parse(q.rewardsJson),
    }));
  }

  async updateStatus(questId: string, status: 'active' | 'completed' | 'failed') {
    return this.prisma.quest.update({
      where: { id: questId },
      data: { status },
    });
  }
}
