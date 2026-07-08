import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class NpcsService {
  constructor(
    private prisma: PrismaService,
    private ai: AiService,
  ) {}

  async getOrCreate(dto: {
    npcId: string;
    name: string;
    role: string;
    biome: string;
    worldSeed: string;
  }) {
    let npc = await this.prisma.nPC.findUnique({
      where: { id: dto.npcId },
    });

    if (!npc) {
      const aiNpc = await this.ai.generateNPC({
        role: dto.role as any,
        biome: dto.biome as any,
        worldAge: 10,
      });

      npc = await this.prisma.nPC.create({
        data: {
          id: dto.npcId,
          name: dto.name,
          role: dto.role,
          personality: aiNpc.personality ?? 'friendly',
          posX: 0,
          posY: 0,
          biome: dto.biome,
          worldSeed: dto.worldSeed,
          dialogueJson: JSON.stringify(aiNpc.dialogueKeys ?? ['Hello traveler.']),
          memoryJson: JSON.stringify([]),
        },
      });
    }

    return npc;
  }

  async interact(dto: {
    npcId: string;
    name: string;
    role: string;
    biome: string;
    worldSeed: string;
    playerLevel: number;
    playerName: string;
    playerMessage?: string;
  }) {
    const npc = await this.getOrCreate(dto);
    const memory = JSON.parse(npc.memoryJson) as string[];

    let dialogueText = 'Welcome back, traveler.';
    const moodShift = 2;
    let newMemoryLog = `Spoke with ${dto.playerName} (Lv.${dto.playerLevel}).`;

    try {
      if (dto.playerMessage) {
        dialogueText = await this.ai.generateDialogue({
          npcName: npc.name,
          npcRole: npc.role as any,
          personality: npc.personality,
          playerMessage: dto.playerMessage,
          memory,
        });
        newMemoryLog = `Responded to ${dto.playerName}'s query: "${dto.playerMessage.slice(0, 30)}"`;
      } else {
        const aiNpc = await this.ai.generateNPC({
          role: npc.role as any,
          biome: npc.biome as any,
          worldAge: 15,
        });

        if (aiNpc.dialogueKeys && aiNpc.dialogueKeys.length > 0) {
          dialogueText = aiNpc.dialogueKeys[0];
        }

        if (memory.length > 0) {
          dialogueText = `Greetings, ${dto.playerName}! I recall our previous conversation. ${dialogueText}`;
          newMemoryLog = `Met with ${dto.playerName} again.`;
        }
      }
    } catch {
      // Fallback
    }

    const updatedMemory = [...memory, newMemoryLog].slice(-5);
    const updatedMood = Math.max(0, Math.min(100, npc.mood + moodShift));

    await this.prisma.nPC.update({
      where: { id: npc.id },
      data: {
        mood: updatedMood,
        memoryJson: JSON.stringify(updatedMemory),
      },
    });

    const options = [
      { text: 'Tell me about your quests', action: 'quest' },
      { text: 'Farewell', action: 'close' },
    ];

    if (npc.role === 'merchant') {
      options.unshift({ text: 'Trade / View Shop', action: 'trade' });
    }

    return {
      dialogue: dialogueText,
      options,
    };
  }
}
