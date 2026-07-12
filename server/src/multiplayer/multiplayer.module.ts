import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { RoomService } from './room.service';
import { TradeService } from './trade.service';
import { MultiplayerController } from './multiplayer.controller';
import { QuestsModule } from '../quests/quests.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, QuestsModule],
  controllers: [MultiplayerController],
  providers: [GameGateway, RoomService, TradeService],
  exports: [GameGateway, RoomService, TradeService],
})
export class MultiplayerModule {}
