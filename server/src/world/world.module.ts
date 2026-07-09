import { Module, forwardRef } from '@nestjs/common';
import { WorldController } from './world.controller';
import { WorldService } from './world.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SeasonService } from './season.service';
import { ModdingController } from './modding.controller';
import { AiModule } from '../ai/ai.module';
import { MultiplayerModule } from '../multiplayer/multiplayer.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AiModule), forwardRef(() => MultiplayerModule)],
  controllers: [WorldController, ModdingController],
  providers: [WorldService, SeasonService],
  exports: [WorldService, SeasonService],
})
export class WorldModule {}
