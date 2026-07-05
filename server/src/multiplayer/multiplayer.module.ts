import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { RoomService } from './room.service';

@Module({
  providers: [GameGateway, RoomService],
  exports: [RoomService],
})
export class MultiplayerModule {}
