import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlayersService } from './players.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('players')
@Controller('players')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlayersController {
  constructor(private players: PlayersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current player state' })
  async getMe(@Request() req: { user: { playerId: string } }) {
    return this.players.findById(req.user.playerId);
  }

  @Put('save')
  @ApiOperation({ summary: 'Save player state to server' })
  async save(
    @Request() req: { user: { playerId: string } },
    @Body() body: Record<string, unknown>,
  ) {
    await this.players.saveState(req.user.playerId, body as Parameters<PlayersService['saveState']>[1]);
    return { saved: true };
  }
}
