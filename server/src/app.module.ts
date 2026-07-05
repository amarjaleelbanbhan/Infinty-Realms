import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PlayersModule } from './players/players.module';
import { WorldModule } from './world/world.module';
import { QuestsModule } from './quests/quests.module';
import { AiModule } from './ai/ai.module';
import { PrismaModule } from './prisma/prisma.module';
import { MultiplayerModule } from './multiplayer/multiplayer.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    PlayersModule,
    WorldModule,
    QuestsModule,
    AiModule,
    MultiplayerModule,
  ],
})
export class AppModule {}
