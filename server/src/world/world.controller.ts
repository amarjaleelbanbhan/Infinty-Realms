import { Controller, Get, Param, Post, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorldService } from './world.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsNumber, IsString } from 'class-validator';

class DmTriggerDto {
  @IsNumber() playerLevel!: number;
  @IsNumber() playerGold!: number;
  @IsString() currentBiome!: string;
  @IsString() currentSeason!: string;
}

@ApiTags('world')
@Controller('world')
export class WorldController {
  constructor(private world: WorldService) {}

  @Get(':seed')
  @ApiOperation({ summary: 'Get or create world state for a given seed' })
  getWorld(@Param('seed') seed: string) {
    return this.world.getOrCreate(seed);
  }

  @Post('dm/event')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Let the AI Dungeon Master trigger a dynamic crisis based on player stats' })
  triggerDmEvent(@Body() dto: DmTriggerDto) {
    return this.world.triggerDmEvent(dto);
  }
}
