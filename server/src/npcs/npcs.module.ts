import { Module } from '@nestjs/common';
import { NpcsController } from './npcs.controller';
import { NpcsService } from './npcs.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [NpcsController],
  providers: [NpcsService],
  exports: [NpcsService],
})
export class NpcsModule {}
