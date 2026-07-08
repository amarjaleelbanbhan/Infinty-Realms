import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { RoomService } from './room.service';
import { MultiplayerController } from './multiplayer.controller';

@Module({
  controllers: [MultiplayerController],
  providers: [GameGateway, RoomService],
  exports: [RoomService],
})
export class MultiplayerModule {}
