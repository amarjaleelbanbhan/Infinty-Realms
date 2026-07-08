import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiAgentService } from './ai-agent.service';
import { AiController } from './ai.controller';
import { WorldModule } from '../world/world.module';
import { NpcsModule } from '../npcs/npcs.module';

@Module({
  imports: [WorldModule, NpcsModule],
  providers: [AiService, AiAgentService],
  controllers: [AiController],
  exports: [AiService, AiAgentService],
})
export class AiModule {}
