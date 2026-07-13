import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GuildsService } from './guilds.service';

@Controller('guilds')
@UseGuards(JwtAuthGuard)
export class GuildsController {
  constructor(private guildsService: GuildsService) {}

  /** List all guilds (leaderboard style) */
  @Get()
  listGuilds() {
    return this.guildsService.findAll();
  }

  /** Get a specific guild */
  @Get(':id')
  getGuild(@Param('id') id: string) {
    return this.guildsService.findById(id);
  }

  /** Create a new guild — requester becomes leader */
  @Post()
  createGuild(
    @Request() req: any,
    @Body() body: { name: string; tag: string },
  ) {
    const playerId: string = req.user.sub;
    return this.guildsService.create(playerId, body.name, body.tag);
  }

  /** Join an existing guild */
  @Post(':id/join')
  joinGuild(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { playerName: string },
  ) {
    const playerId: string = req.user.sub;
    return this.guildsService.join(id, playerId, body.playerName);
  }

  /** Leave (or disband if leader) */
  @Delete(':id/leave')
  leaveGuild(
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const playerId: string = req.user.sub;
    return this.guildsService.leave(id, playerId);
  }

  /** Kick a member (leader only) */
  @Delete(':id/kick/:targetId')
  kickMember(
    @Request() req: any,
    @Param('id') id: string,
    @Param('targetId') targetId: string,
  ) {
    const playerId: string = req.user.sub;
    return this.guildsService.kick(id, playerId, targetId);
  }
}
