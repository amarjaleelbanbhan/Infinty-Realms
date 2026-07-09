import { Controller, Get, Put, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlayersService } from './players.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Web3Service } from './web3.service';

@ApiTags('players')
@Controller('players')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlayersController {
  constructor(
    private players: PlayersService,
    private web3: Web3Service
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current player state' })
  async getMe(@Request() req: { user: { playerId: string } }) {
    return this.players.findById(req.user.playerId);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get global leaderboard' })
  async getLeaderboard() {
    return this.players.getLeaderboard();
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

  @Post('daily-login')
  @ApiOperation({ summary: 'Claim daily login reward' })
  async claimDailyLogin(@Request() req: { user: { playerId: string } }) {
    // Basic mock logic for monetization/retention (Phase 33)
    return { claimed: true, reward: { gold: 100, item: 'premium_ticket' } };
  }

  @Post('mint-cosmetic')
  @ApiOperation({ summary: 'Mint an in-game cosmetic as an NFT' })
  async mintCosmetic(
    @Request() req: { user: { playerId: string } },
    @Body() body: { cosmeticId: string, walletAddress: string }
  ) {
    return this.web3.mintCosmeticNFT(req.user.playerId, body.cosmeticId, body.walletAddress);
  }
}
