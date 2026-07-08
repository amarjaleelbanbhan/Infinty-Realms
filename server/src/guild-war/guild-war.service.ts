import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GuildWarService {
  constructor(private prisma: PrismaService) {}

  async listActiveWars() {
    return this.prisma.guildWar.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async declareWar(challengerId: string, defenderId: string, targetCityId: string) {
    if (challengerId === defenderId) {
      throw new BadRequestException('Cannot declare war on your own guild');
    }

    const existingWar = await this.prisma.guildWar.findFirst({
      where: {
        status: 'active',
        OR: [
          { challengerId, defenderId },
          { challengerId: defenderId, defenderId: challengerId },
        ],
      },
    });

    if (existingWar) {
      throw new BadRequestException('Already at war with this guild');
    }

    const endsAt = new Date();
    endsAt.setHours(endsAt.getHours() + 24);

    return this.prisma.guildWar.create({
      data: {
        challengerId,
        defenderId,
        targetCityId,
        endsAt,
      },
    });
  }

  async contributeSiegePoints(warId: string, guildId: string, points: number) {
    const war = await this.prisma.guildWar.findUnique({ where: { id: warId } });
    if (!war || war.status !== 'active') {
      throw new NotFoundException('Active war not found');
    }

    if (war.endsAt < new Date()) {
      // Resolve war
      await this.prisma.guildWar.update({
        where: { id: warId },
        data: { status: 'resolved' },
      });
      throw new BadRequestException('War has already ended');
    }

    if (guildId === war.challengerId) {
      return this.prisma.guildWar.update({
        where: { id: warId },
        data: { challengerPoints: { increment: points } },
      });
    } else if (guildId === war.defenderId) {
      return this.prisma.guildWar.update({
        where: { id: warId },
        data: { defenderPoints: { increment: points } },
      });
    } else {
      throw new BadRequestException('Your guild is not part of this war');
    }
  }
}
