import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { RoomService } from './room.service';
import { MultiplayerController } from './multiplayer.controller';
import { QuestsModule } from '../quests/quests.module';

@Module({
  imports: [QuestsModule],
  controllers: [MultiplayerController],
  providers: [GameGateway, RoomService],
  exports: [GameGateway, RoomService],
})
export class MultiplayerModule {}
