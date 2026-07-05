import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { QuestGenerationRequest, NPCGenerationRequest, EventGenerationRequest } from '@infinity-realms/shared/types';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private ai: AiService) {}

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
}
