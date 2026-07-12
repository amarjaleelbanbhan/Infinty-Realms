import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PlayersService } from './players.service';

function makePlayerRow(overrides: Partial<{
  id: string; gold: number; experience: number; level: number; updatedAt: Date;
}> = {}) {
  return {
    id: overrides.id ?? 'p1',
    name: 'Player',
    gold: overrides.gold ?? 100,
    experience: overrides.experience ?? 0,
    level: overrides.level ?? 1,
    ascensions: 0,
    posX: 0,
    posY: 0,
    playtime: 0,
    statsJson: '{}',
    inventoryJson: '[]',
    equipmentJson: '{}',
    skillsJson: '[]',
    reputationJson: '{}',
    titlesJson: '[]',
    updatedAt: overrides.updatedAt ?? new Date(Date.now() - 10_000), // 10s ago by default
  };
}

describe('PlayersService.saveState (anti-cheat)', () => {
  let players: Record<string, ReturnType<typeof makePlayerRow>>;
  let prismaMock: { player: { findUnique: jest.Mock; update: jest.Mock } };
  let service: PlayersService;

  beforeEach(() => {
    players = {};
    prismaMock = {
      player: {
        findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => players[id] ?? null),
        update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: any }) => {
          players[id] = { ...players[id], ...data };
          return players[id];
        }),
      },
    };
    service = new PlayersService(prismaMock as any);
  });

  it('throws NotFoundException for an unknown player', async () => {
    await expect(service.saveState('ghost', { gold: 100 })).rejects.toThrow(NotFoundException);
  });

  it('accepts a gold delta within the allowed rate', async () => {
    players['p1'] = makePlayerRow({ gold: 100, updatedAt: new Date(Date.now() - 10_000) }); // 10s elapsed, allows +1000
    const result = await service.saveState('p1', { gold: 500 });
    expect(result.gold).toBe(500);
  });

  it('rejects (throws) rather than silently dropping a gold delta that exceeds the allowed rate', async () => {
    players['p1'] = makePlayerRow({ gold: 100, updatedAt: new Date(Date.now() - 1_000) }); // 1s elapsed, allows +100
    await expect(service.saveState('p1', { gold: 100_000 })).rejects.toThrow(ForbiddenException);
    // The bad value must never be persisted.
    expect(players['p1'].gold).toBe(100);
  });

  it('rejects an experience delta that exceeds the allowed rate', async () => {
    players['p1'] = makePlayerRow({ experience: 0, updatedAt: new Date(Date.now() - 1_000) }); // allows +500
    await expect(service.saveState('p1', { experience: 999_999 })).rejects.toThrow(ForbiddenException);
    expect(players['p1'].experience).toBe(0);
  });

  it('does not reject a gold decrease (spending gold is always allowed)', async () => {
    players['p1'] = makePlayerRow({ gold: 1000, updatedAt: new Date(Date.now() - 1_000) });
    const result = await service.saveState('p1', { gold: 10 });
    expect(result.gold).toBe(10);
  });

  it('tracks a violation count per player and increments across repeated offenses', async () => {
    players['p1'] = makePlayerRow({ gold: 100, updatedAt: new Date(Date.now() - 1_000) });

    expect(service.getViolationCount('p1')).toBe(0);

    await expect(service.saveState('p1', { gold: 999_999 })).rejects.toThrow(ForbiddenException);
    expect(service.getViolationCount('p1')).toBe(1);

    // Re-fetch simulates the client retrying with another bad value on the same stale row.
    await expect(service.saveState('p1', { gold: 999_999 })).rejects.toThrow(ForbiddenException);
    expect(service.getViolationCount('p1')).toBe(2);
  });

  it('does not let a rejected gold/xp field block other legitimate fields from being silently accepted alongside a bad one — it rejects the whole save', async () => {
    players['p1'] = makePlayerRow({ gold: 100, level: 1, updatedAt: new Date(Date.now() - 1_000) });

    await expect(service.saveState('p1', { gold: 999_999, level: 50 })).rejects.toThrow(ForbiddenException);
    // Conservative: reject the whole batch rather than partially apply it.
    expect(players['p1'].level).toBe(1);
  });
});
