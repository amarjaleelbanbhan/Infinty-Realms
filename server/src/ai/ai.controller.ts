import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AiAgentService } from './ai-agent.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { QuestGenerationRequest, NPCGenerationRequest, EventGenerationRequest, ItemGenerationRequest } from '@infinity-realms/shared/types';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private ai: AiService, private agent: AiAgentService) {}

  @Get('simulate-agents')
  @ApiOperation({ summary: 'Simulate interaction between two AI NPCs' })
  simulateAgents(@Query('npc1') npc1: string, @Query('npc2') npc2: string, @Query('context') context: string) {
    return this.agent.simulateNpcInteraction(npc1 || 'Merchant', npc2 || 'Guard', context || 'Peaceful day');
  }

  @Get('evaluate-world')
  @ApiOperation({ summary: 'Evaluate world state for dynamic events' })
  evaluateWorld(@Query('seed') seed: string) {
    return this.agent.evaluateWorldState(seed || 'default');
  }

  @Post('quest')
  @ApiOperation({ summary: 'Generate a quest via AI' })
  generateQuest(@Body() req: QuestGenerationRequest) {
    return this.ai.generateQuest(req);
  }

  @Post('npc')
  @ApiOperation({ summary: 'Generate an NPC via AI' })
  generateNPC(@Body() req: NPCGenerationRequest) {
    return this.ai.generateNPC(req);
  }

  @Post('event')
  @ApiOperation({ summary: 'Generate a world event via AI' })
  generateEvent(@Body() req: EventGenerationRequest) {
    return this.ai.generateWorldEvent(req);
  }

  @Post('item')
  @ApiOperation({ summary: 'Generate a custom item via AI' })
  generateItem(@Body() req: ItemGenerationRequest) {
    return this.ai.generateItem(req);
  }
}
