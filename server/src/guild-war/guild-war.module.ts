import { Module } from '@nestjs/common';
import { GuildWarController } from './guild-war.controller';
import { GuildWarService } from './guild-war.service';

@Module({
  controllers: [GuildWarController],
  providers: [GuildWarService],
  exports: [GuildWarService],
})
export class GuildWarModule {}
