import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AiService } from './ai.service';
import { WorldService } from '../world/world.service';
import { NpcsService } from '../npcs/npcs.service';

@Injectable()
export class AiAgentService implements OnModuleInit {
  private readonly logger = new Logger(AiAgentService.name);

  constructor(
    private aiService: AiService,
    private worldService: WorldService,
    private npcsService: NpcsService,
  ) {}

  onModuleInit() {
    // Run the agent loop every 5 minutes
    setInterval(() => {
      this.evaluateWorldState('default').catch(err => this.logger.error(err));
    }, 5 * 60 * 1000);
  }

  /**
   * Simulates a conversation between two NPC agents to generate dynamic world events or rumors.
   */
  async simulateNpcInteraction(npc1Type: string, npc2Type: string, currentContext: string): Promise<string> {
    const prompt = `You are a Multi-Agent orchestrator for an MMORPG.
Agent 1 is a ${npc1Type}. Agent 2 is a ${npc2Type}.
Current world context: ${currentContext}.
Generate a short 3-turn dialogue where they negotiate, argue, or share a rumor. Output only the dialogue.`;

    try {
      const dialogueText = await this.aiService.generateDialogue({ 
        npcName: npc1Type,
        npcRole: 'merchant',
        personality: 'neutral',
        playerMessage: `Discuss this context: ${currentContext}`,
        memory: []
      });
      this.logger.log(`Generated Agent Interaction:\n${dialogueText}`);
      return dialogueText;
    } catch (e) {
      this.logger.error('Failed to simulate NPC interaction', e);
      return 'Agents are currently unresponsive.';
    }
  }

  /**
   * Evaluates if the world needs a dynamic global event (e.g. market crash, siege).
   */
  async evaluateWorldState(worldSeed: string): Promise<string> {
    try {
      const eventResponse = await this.aiService.generateWorldEvent({ 
        worldSeed: worldSeed,
        season: 'spring',
        worldAge: 0,
        currentPlayerCount: 1
      });
      const eventName = eventResponse.title || 'None';
      this.logger.log(`Evaluated World State Event: ${eventName}`);
      return eventName;
    } catch (e) {
      this.logger.error('Failed to evaluate world state', e);
      return 'None';
    }
  }
}
