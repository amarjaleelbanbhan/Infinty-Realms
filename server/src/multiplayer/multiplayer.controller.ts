import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RoomService } from './room.service';

@ApiTags('multiplayer')
@Controller('multiplayer')
export class MultiplayerController {
  constructor(private roomService: RoomService) {}

  @Get('rooms')
  @ApiOperation({ summary: 'Get list of active public multiplayer rooms' })
  getPublicRooms() {
    return this.roomService.getPublicRooms();
  }
}
