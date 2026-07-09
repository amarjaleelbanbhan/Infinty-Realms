import { Module, forwardRef } from '@nestjs/common';
import { WorldController } from './world.controller';
import { WorldService } from './world.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SocketGateway } from './socket.gateway';
import { TerrainService } from './terrain.service';
import { SeasonService } from './season.service';
import { ModdingController } from './modding.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AiModule)],
  controllers: [WorldController, ModdingController],
  providers: [WorldService, SocketGateway, TerrainService, SeasonService],
  exports: [WorldService, SocketGateway, TerrainService, SeasonService],
})
export class WorldModule {}
