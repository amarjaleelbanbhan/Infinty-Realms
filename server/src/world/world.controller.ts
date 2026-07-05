import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WorldService } from './world.service';

@ApiTags('world')
@Controller('world')
export class WorldController {
  constructor(private world: WorldService) {}

  @Get(':seed')
  @ApiOperation({ summary: 'Get or create world state for a given seed' })
  getWorld(@Param('seed') seed: string) {
    return this.world.getOrCreate(seed);
  }
}
