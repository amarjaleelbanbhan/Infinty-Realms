import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuestsService } from './quests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsNumber, IsOptional } from 'class-validator';
import type { BiomeType, Season } from '@infinity-realms/shared/types';

class GenerateQuestDto {
  @IsString() worldSeed!: string;
  @IsString() biome!: string;
  @IsString() season!: string;
  @IsNumber() playerLevel!: number;
  @IsOptional() @IsString() nearbyNpcName?: string;
  @IsOptional() @IsString() npcRole?: string;
  @IsOptional() @IsString() npcPersonality?: string;
  @IsOptional() npcMemory?: string[];
}

@ApiTags('quests')
@Controller('quests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuestsController {
  constructor(private quests: QuestsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a new AI quest for the player' })
  async generate(
    @Body() dto: GenerateQuestDto,
    @Request() req: { user: { playerId: string } },
  ) {
    return this.quests.generateAndSave({
      worldSeed: dto.worldSeed,
      biome: dto.biome as BiomeType,
      season: dto.season as Season,
      playerLevel: dto.playerLevel,
      playerId: req.user.playerId,
      nearbyNpcName: dto.nearbyNpcName,
      npcRole: dto.npcRole,
      npcPersonality: dto.npcPersonality,
      npcMemory: dto.npcMemory,
    });
  }

  @Get('my')
  @ApiOperation({ summary: 'Get all quests for current player' })
  async myQuests(
    @Request() req: { user: { playerId: string } },
    @Query('worldSeed') worldSeed?: string,
    @Query('biome') biome?: string,
    @Query('season') season?: string,
    @Query('playerLevel') playerLevel?: string,
  ) {
    let options = undefined;
    if (worldSeed && biome && season && playerLevel) {
      options = {
        worldSeed,
        biome: biome as BiomeType,
        season: season as Season,
        playerLevel: parseInt(playerLevel, 10) || 1,
      };
    }
    return this.quests.getPlayerQuests(req.user.playerId, options);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update quest status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'active' | 'completed' | 'failed' },
  ) {
    return this.quests.updateStatus(id, body.status);
  }
}
