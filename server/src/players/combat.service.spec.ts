import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CombatService } from './combat.service';

describe('CombatService.claimKill', () => {
  let players: Record<string, any>;
  let prismaMock: { player: { update: jest.Mock } };
  let service: CombatService;

  beforeEach(() => {
    players = {
      p1: { id: 'p1', gold: 100, experience: 0 },
    };
    prismaMock = {
      player: {
        update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: any }) => {
          if (data.experience?.increment) {
            players[id].experience += data.experience.increment;
          }
          if (data.gold?.increment) {
            players[id].gold += data.gold.increment;
          }
          return players[id];
        }),
      },
    };
    service = new CombatService(prismaMock as any);
  });

  it('rejects an unknown enemy type', async () => {
    await expect(service.claimKill('p1', 'super_boss_9999', 1)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('awards experience and gold within expected range for a valid enemy type', async () => {
    const res = await service.claimKill('p1', 'skeleton', 1);
    expect(res.xpAwarded).toBeGreaterThanOrEqual(15); // skeleton base xp 20, var 5 -> 15-25
    expect(res.xpAwarded).toBeLessThanOrEqual(25);
    expect(res.goldAwarded).toBeGreaterThanOrEqual(5); // skeleton base gold 8, var 3 -> 5-11
    expect(res.goldAwarded).toBeLessThanOrEqual(11);

    expect(players['p1'].experience).toBe(res.xpAwarded);
    expect(players['p1'].gold).toBe(100 + res.goldAwarded);
  });

  it('applies level multiplier correctly', async () => {
    // Level 10 enemy gets multiplier 1.9x
    const res = await service.claimKill('p1', 'goblin', 10);
    // goblin base: xp 15, var 4 -> range 11-19. 11*1.9=20.9 (rounded 21), 19*1.9=36.1 (rounded 36)
    expect(res.xpAwarded).toBeGreaterThanOrEqual(20);
    expect(res.xpAwarded).toBeLessThanOrEqual(37);
  });

  it('throttles rapid sequential claims (MIN_KILL_INTERVAL_MS)', async () => {
    await service.claimKill('p1', 'slime', 1);
    await expect(service.claimKill('p1', 'slime', 1)).rejects.toThrow(BadRequestException);
  });

  it('flags player and throws ForbiddenException after 10 violation increments', async () => {
    const tracker = (service as any).getTracker('p_flag');
    tracker.lastKillAt = Date.now();

    for (let i = 0; i < 9; i++) {
      await expect(service.claimKill('p_flag', 'slime', 1)).rejects.toThrow(BadRequestException);
    }
    // 10th time throws ForbiddenException
    await expect(service.claimKill('p_flag', 'slime', 1)).rejects.toThrow(ForbiddenException);
    expect(service.getViolationCount('p_flag')).toBe(10);
  });
});
