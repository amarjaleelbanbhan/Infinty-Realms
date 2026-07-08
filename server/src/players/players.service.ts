import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Player, OfflineReport } from '@infinity-realms/shared/types';

@Injectable()
export class PlayersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const p = await this.prisma.player.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Player not found');
    
    // Calculate Offline Progress
    let offlineReport: OfflineReport | null = null;
    const now = new Date();
    const timeOfflineMs = now.getTime() - p.lastSeenAt.getTime();
    
    if (timeOfflineMs > 60000) { // More than 1 minute offline
      const minutesOffline = Math.floor(timeOfflineMs / 60000);
      const goldEarned = minutesOffline * (p.level || 1);
      const expEarned = minutesOffline * (p.level || 1) * 2;
      
      offlineReport = {
        timeOfflineMs,
        goldEarned,
        expEarned,
        essenceEarned: Math.floor(minutesOffline / 10),
        itemsGathered: []
      };
      
      await this.prisma.player.update({
        where: { id },
        data: {
          gold: p.gold + goldEarned,
          experience: p.experience + expEarned,
          lastSeenAt: now
        }
      });
      p.gold += goldEarned;
      p.experience += expEarned;
    } else {
      await this.prisma.player.update({
        where: { id },
        data: { lastSeenAt: now }
      });
    }

    return {
      player: this.deserialize(p),
      offlineReport
    };
  }

  async savePosition(playerId: string, x: number, y: number) {
    return this.prisma.player.update({
      where: { id: playerId },
      data: { posX: x, posY: y, lastSeenAt: new Date() },
    });
  }

  async saveState(playerId: string, partial: Partial<Player>) {
    const data: Record<string, unknown> = { updatedAt: new Date() };
    if (partial.stats) data.statsJson = JSON.stringify(partial.stats);
    if (partial.inventory) data.inventoryJson = JSON.stringify(partial.inventory);
    if (partial.equipment) data.equipmentJson = JSON.stringify(partial.equipment);
    if (partial.gold !== undefined) data.gold = partial.gold;
    if (partial.experience !== undefined) data.experience = partial.experience;
    if (partial.level !== undefined) data.level = partial.level;
    if (partial.x !== undefined) data.posX = partial.x;
    if (partial.y !== undefined) data.posY = partial.y;
    if (partial.playtime !== undefined) data.playtime = partial.playtime;

    return this.prisma.player.update({ where: { id: playerId }, data });
  }

  private deserialize(p: {
    id: string; name: string; worldSeed: string; posX: number; posY: number;
    statsJson: string; level: number; experience: number; gold: number;
    inventoryJson: string; equipmentJson: string; skillsJson: string;
    reputationJson: string; titlesJson: string; playtime: number;
  }): Partial<Player> {
    return {
      id: p.id,
      name: p.name,
      worldSeed: p.worldSeed,
      x: p.posX,
      y: p.posY,
      stats: JSON.parse(p.statsJson),
      level: p.level,
      experience: p.experience,
      gold: p.gold,
      inventory: JSON.parse(p.inventoryJson),
      equipment: JSON.parse(p.equipmentJson),
      skills: JSON.parse(p.skillsJson),
      reputation: JSON.parse(p.reputationJson),
      titles: JSON.parse(p.titlesJson),
      playtime: p.playtime,
    };
  }
}
