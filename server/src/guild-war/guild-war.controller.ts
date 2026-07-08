import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GuildWarService } from './guild-war.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsNumber } from 'class-validator';

class DeclareWarDto {
  @IsString() challengerId!: string;
  @IsString() defenderId!: string;
  @IsString() targetCityId!: string;
}

class ContributeDto {
  @IsString() guildId!: string;
  @IsNumber() points!: number;
}

@ApiTags('guild-war')
@Controller('guild-war')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GuildWarController {
  constructor(private readonly guildWar: GuildWarService) {}

  @Get()
  @ApiOperation({ summary: 'List active guild wars' })
  async list() {
    return this.guildWar.listActiveWars();
  }

  @Post('declare')
  @ApiOperation({ summary: 'Declare war on a guild' })
  async declare(@Body() dto: DeclareWarDto) {
    return this.guildWar.declareWar(dto.challengerId, dto.defenderId, dto.targetCityId);
  }

  @Post(':id/contribute')
  @ApiOperation({ summary: 'Contribute siege points to a war' })
  async contribute(@Param('id') warId: string, @Body() dto: ContributeDto) {
    return this.guildWar.contributeSiegePoints(warId, dto.guildId, dto.points);
  }
}
