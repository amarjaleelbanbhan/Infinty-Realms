import { Injectable, OnModuleInit } from '@nestjs/common';
import { SocketGateway } from '../world/socket.gateway';
import { AiService } from '../ai/ai.service';

@Injectable()
export class SeasonService implements OnModuleInit {
  private currentSeason = 'Standard';

  constructor(
    private socketGateway: SocketGateway,
    private ai: AiService
  ) {}

  onModuleInit() {
    // Check every hour for a dynamic seasonal shift
    setInterval(() => this.evaluateSeason(), 3600000);
  }

  async evaluateSeason() {
    // Mock season shift logic
    const seasons = ['The Long Winter', 'Harvest Festival', 'Standard'];
    const randomSeason = seasons[Math.floor(Math.random() * seasons.length)];
    
    if (randomSeason !== this.currentSeason) {
      this.currentSeason = randomSeason;
      console.log(`Season changed to: ${this.currentSeason}`);
      
      try {
        const lore = await this.ai.generateDialogue({
          npcName: 'The World Tree',
          npcRole: 'narrator',
          personality: 'mystical',
          playerMessage: `The season has just shifted to ${this.currentSeason}. Announce this to the realm.`,
          memory: []
        });

        this.socketGateway.server.emit('systemMessage', {
          sender: 'Realm Announcer',
          text: lore || `A new season begins: ${this.currentSeason}!`
        });
      } catch (e) {
        console.error('Failed to generate season lore', e);
      }
    }
  }

  getCurrentSeason() {
    return this.currentSeason;
  }
}
