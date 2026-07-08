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
      // MOCK FOR NOW: avoiding dependency on Vercel AI SDK in server workspace
      const text = `${npc1Type}: I've heard the leyline flows are weak today.\n${npc2Type}: Bah, it's just a temporary surge. Don't panic.\n${npc1Type}: If you say so... but I'm keeping my gold safe.`;
      this.logger.log(`Generated Agent Interaction:\n${text}`);
      return text;
    } catch (e) {
      this.logger.error('Failed to simulate NPC interaction', e);
      return 'Agents are currently unresponsive.';
    }
  }

  /**
   * Evaluates if the world needs a dynamic global event (e.g. market crash, siege).
   */
  async evaluateWorldState(worldSeed: string): Promise<string> {
    const prompt = `You are the AI Dungeon Master for the world seed "${worldSeed}".
Based on the current peace time, suggest ONE dynamic event that should happen next (e.g., Goblin Raid, Market Crash, Leyline Surge). Respond with just the event name.`;

    try {
      const text = 'Goblin Raid';
      return text.trim();
    } catch (e) {
      return 'None';
    }
  }
}
