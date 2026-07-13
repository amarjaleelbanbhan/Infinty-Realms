import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ─── Authoritative reward table ───────────────────────────────
// The server owns these values. No client input can override them.
// If the client sends an enemy type the server doesn't recognise,
// the claim is rejected.
const ENEMY_REWARDS: Record<string, { xp: number; gold: number; xpVariance: number; goldVariance: number }> = {
  skeleton:     { xp: 20,  gold: 8,   xpVariance: 5,  goldVariance: 3  },
  goblin:       { xp: 15,  gold: 6,   xpVariance: 4,  goldVariance: 2  },
  orc:          { xp: 35,  gold: 14,  xpVariance: 8,  goldVariance: 4  },
  troll:        { xp: 60,  gold: 22,  xpVariance: 12, goldVariance: 6  },
  wolf:         { xp: 18,  gold: 5,   xpVariance: 4,  goldVariance: 2  },
  bandit:       { xp: 25,  gold: 12,  xpVariance: 6,  goldVariance: 4  },
  slime:        { xp: 10,  gold: 4,   xpVariance: 3,  goldVariance: 1  },
  golem:        { xp: 80,  gold: 30,  xpVariance: 15, goldVariance: 8  },
  vampire:      { xp: 55,  gold: 20,  xpVariance: 10, goldVariance: 5  },
  dragon:       { xp: 500, gold: 150, xpVariance: 50, goldVariance: 25 },
  dungeon_mob:  { xp: 40,  gold: 15,  xpVariance: 8,  goldVariance: 4  },
};

// Minimum time between kill claims — prevents bursty spamming even within the rate window.
const MIN_KILL_INTERVAL_MS = 300;

// Maximum kills allowed per rolling 60-second window.
const MAX_KILLS_PER_MINUTE = 60;

interface KillRecord {
  timestamps: number[];
  lastKillAt: number;
  violationCount: number;
}

@Injectable()
export class CombatService {
  constructor(private prisma: PrismaService) {}

  // In-memory per-player kill tracking (resets on server restart).
  private killTracker = new Map<string, KillRecord>();

  private getTracker(playerId: string): KillRecord {
    if (!this.killTracker.has(playerId)) {
      this.killTracker.set(playerId, { timestamps: [], lastKillAt: 0, violationCount: 0 });
    }
    return this.killTracker.get(playerId)!;
  }

  /**
   * Validate a kill claim and award server-computed rewards.
   *
   * Security model:
   * 1. Enemy type must exist in ENEMY_REWARDS — unknown types are rejected.
   * 2. Minimum interval between kills (300ms) — prevents scripted spam.
   * 3. Rolling 60s kill cap (60 kills/min) — flags impossible grind rates.
   * 4. Server computes the actual reward; client input rewards are ignored.
   * 5. XP and gold are written to DB here, not in the next 60s save flush.
   */
  async claimKill(
    playerId: string,
    enemyType: string,
    enemyLevel: number,
  ): Promise<{ xpAwarded: number; goldAwarded: number; totalXp: number; totalGold: number }> {
    const normalizedType = enemyType.toLowerCase().trim();
    const template = ENEMY_REWARDS[normalizedType];

    if (!template) {
      throw new BadRequestException(`Unknown enemy type: "${enemyType}"`);
    }

    const now = Date.now();
    const tracker = this.getTracker(playerId);

    // Minimum interval guard
    if (now - tracker.lastKillAt < MIN_KILL_INTERVAL_MS) {
      tracker.violationCount += 1;
      console.warn(`[Combat] Player ${playerId} kill spam detected (${tracker.violationCount} violations)`);
      if (tracker.violationCount >= 10) {
        throw new ForbiddenException('Kill rate violation — account flagged.');
      }
      throw new BadRequestException('Kill claims too frequent.');
    }

    // Rolling 60s window cap
    const windowStart = now - 60_000;
    tracker.timestamps = tracker.timestamps.filter(t => t > windowStart);
    if (tracker.timestamps.length >= MAX_KILLS_PER_MINUTE) {
      tracker.violationCount += 1;
      console.warn(`[Combat] Player ${playerId} exceeded kill rate limit (${tracker.violationCount} violations)`);
      throw new ForbiddenException('Kill rate limit exceeded.');
    }

    tracker.timestamps.push(now);
    tracker.lastKillAt = now;

    // Level scaling: higher enemy level = proportionally higher reward (capped at 3x)
    const levelMultiplier = Math.min(3, 1 + (Math.max(0, enemyLevel - 1) * 0.1));

    // Deterministic server-side variance (not client-controlled)
    const xpVariance = Math.floor((Math.random() * 2 - 1) * template.xpVariance);
    const goldVariance = Math.floor((Math.random() * 2 - 1) * template.goldVariance);

    const xpAwarded = Math.max(1, Math.round((template.xp + xpVariance) * levelMultiplier));
    const goldAwarded = Math.max(0, Math.round((template.gold + goldVariance) * levelMultiplier));

    // Persist directly — don't wait for the 60s save flush
    const updated = await this.prisma.player.update({
      where: { id: playerId },
      data: {
        experience: { increment: xpAwarded },
        gold: { increment: goldAwarded },
        updatedAt: new Date(),
      },
      select: { experience: true, gold: true },
    });

    return {
      xpAwarded,
      goldAwarded,
      totalXp: updated.experience,
      totalGold: updated.gold,
    };
  }

  getViolationCount(playerId: string): number {
    return this.killTracker.get(playerId)?.violationCount ?? 0;
  }
}
