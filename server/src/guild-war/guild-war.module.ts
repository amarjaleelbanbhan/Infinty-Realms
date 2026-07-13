import { Module } from '@nestjs/common';
import { GuildWarController } from './guild-war.controller';
import { GuildWarService } from './guild-war.service';
import { GuildsController } from './guilds.controller';
import { GuildsService } from './guilds.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GuildWarController, GuildsController],
  providers: [GuildWarService, GuildsService],
  exports: [GuildWarService, GuildsService],
})
export class GuildWarModule {}
