import { Module } from '@nestjs/common';
import { GuildWarController } from './guild-war.controller';
import { GuildWarService } from './guild-war.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GuildWarController],
  providers: [GuildWarService],
  exports: [GuildWarService],
})
export class GuildWarModule {}
