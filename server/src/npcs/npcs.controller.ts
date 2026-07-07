import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NpcsService } from './npcs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsNumber } from 'class-validator';

class InteractNpcDto {
  @IsString() npcId!: string;
  @IsString() name!: string;
  @IsString() role!: string;
  @IsString() biome!: string;
  @IsString() worldSeed!: string;
  @IsNumber() playerLevel!: number;
  @IsString() playerName!: string;
}

@ApiTags('npcs')
@Controller('npcs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NpcsController {
  constructor(private npcs: NpcsService) {}

  @Post('interact')
  @ApiOperation({ summary: 'Interact with an NPC to get memory-aware dialogue' })
  async interact(@Body() dto: InteractNpcDto) {
    return this.npcs.interact(dto);
  }
}
