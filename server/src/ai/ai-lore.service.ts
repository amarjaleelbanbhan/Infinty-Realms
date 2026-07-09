import { Injectable } from '@nestjs/common';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiLoreService {
  constructor(
    private ai: AiService,
    private prisma: PrismaService,
  ) {}

  async generateLoreBook(biome: string, seed: string) {
    const prompt = `You are a historian in a fantasy realm. Write a short, ancient journal entry found in the ${biome} biome. The world seed is ${seed}. The tone should be mysterious and uncover ancient lore. Max 3 paragraphs.`;
    
    let loreText = "The ancient texts are unreadable.";
    try {
      const response = await this.ai.generateDialogue({
        npcName: 'Ancient Tome',
        npcRole: 'lorebook',
        personality: 'mysterious',
        playerMessage: prompt,
        memory: [],
      });
      if (response) {
        loreText = response;
      }
    } catch (e) {
      console.error('Lore generation failed', e);
    }

    return {
      success: true,
      loreText,
      biome,
      discoveredAt: new Date()
    };
  }
}
