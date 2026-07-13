import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CombatService } from './combat.service';

@Controller('combat')
@UseGuards(JwtAuthGuard)
export class CombatController {
  constructor(private combat: CombatService) {}

  /**
   * Client posts a kill claim when an enemy reaches 0 HP.
   * Server validates, computes rewards from its own table, persists to DB,
   * and returns the authoritative values. The client applies these, not its own.
   */
  @Post('kill-claim')
  async claimKill(
    @Request() req: any,
    @Body() body: { enemyType: string; enemyLevel?: number },
  ) {
    const playerId: string = req.user.sub;
    const enemyLevel = Math.max(1, Math.min(100, Math.floor(body.enemyLevel ?? 1)));
    return this.combat.claimKill(playerId, body.enemyType, enemyLevel);
  }
}
