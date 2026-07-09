import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiAgentService } from './ai-agent.service';
import { AiGuardService } from './ai-guard.service';
import { AiSimulatedPlayerService } from './ai-simulated-player.service';
import { AiLoreService } from './ai-lore.service';
import { AiController } from './ai.controller';
import { WorldModule } from '../world/world.module';
import { NpcsModule } from '../npcs/npcs.module';

@Module({
  imports: [WorldModule, NpcsModule],
  providers: [AiService, AiAgentService, AiGuardService, AiSimulatedPlayerService, AiLoreService],
  controllers: [AiController],
  exports: [AiService, AiAgentService, AiGuardService, AiSimulatedPlayerService, AiLoreService],
})
export class AiModule {}
