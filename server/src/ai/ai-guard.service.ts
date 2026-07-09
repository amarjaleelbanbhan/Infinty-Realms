import { Injectable } from '@nestjs/common';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiGuardService {
  constructor(
    private ai: AiService,
    private prisma: PrismaService,
  ) {}

  async investigateCrime(criminalName: string, crimeType: string, location: string) {
    // Determine the guard's reaction via the AI service
    const prompt = `You are a city guard in the town of ${location}. You have just witnessed or been informed that a player named ${criminalName} committed ${crimeType}. What is your immediate reaction and what do you say to them? Keep it under 2 sentences.`;
    
    let reaction = "Halt, criminal! You violate the laws of this realm!";
    try {
      const aiResponse = await this.ai.generateDialogue({
        npcName: 'City Guard',
        npcRole: 'guard',
        personality: 'stern',
        playerMessage: prompt,
        memory: [],
      });
      if (aiResponse) {
        reaction = aiResponse;
      }
    } catch (e) {
      console.error('Guard investigation AI failed', e);
    }

    return {
      success: true,
      reaction,
      action: crimeType === 'murder' ? 'attack' : 'fine'
    };
  }
}
