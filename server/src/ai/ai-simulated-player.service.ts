import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiSimulatedPlayerService {
  constructor(private prisma: PrismaService) {}

  async runSimulationTick() {
    // A simplified loop for AI players roaming and doing tasks
    const activeBots = await this.prisma.player.findMany({
      where: { isBot: true },
      take: 10,
    });

    for (const bot of activeBots) {
      // Simulate level up or gaining gold randomly
      if (Math.random() > 0.8) {
        await this.prisma.player.update({
          where: { id: bot.id },
          data: {
            gold: { increment: Math.floor(Math.random() * 50) + 10 },
            level: { increment: Math.random() > 0.95 ? 1 : 0 },
          }
        });
      }
    }
    return { success: true, processed: activeBots.length };
  }
}
