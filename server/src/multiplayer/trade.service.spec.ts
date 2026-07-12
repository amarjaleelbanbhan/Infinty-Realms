import { TradeService } from './trade.service';
import type { TradeOffer } from '@infinity-realms/shared/types';

function makeItem(id: string, name = id) {
  return { id, name, description: '', type: 'material' as const, rarity: 'common' as const, icon: '', value: 1 };
}

function makePlayerRow(overrides: Partial<{ id: string; name: string; gold: number; inventory: Array<{ item: ReturnType<typeof makeItem>; quantity: number }> }>) {
  return {
    id: overrides.id ?? 'p',
    name: overrides.name ?? 'Player',
    gold: overrides.gold ?? 0,
    inventoryJson: JSON.stringify(overrides.inventory ?? []),
  };
}

describe('TradeService', () => {
  let players: Record<string, ReturnType<typeof makePlayerRow>>;
  let prismaMock: { $transaction: jest.Mock; player: { findUnique: jest.Mock; update: jest.Mock } };
  let service: TradeService;

  beforeEach(() => {
    players = {};
    prismaMock = {
      $transaction: jest.fn(async (fn: (tx: any) => Promise<any>) => fn(prismaMock)),
      player: {
        findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => players[id] ?? null),
        update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: any }) => {
          players[id] = { ...players[id], ...data };
          return players[id];
        }),
      },
    };
    service = new TradeService(prismaMock as any);
  });

  it('fails to execute when one side never submitted an offer', async () => {
    players['a'] = makePlayerRow({ id: 'a', gold: 100 });
    players['b'] = makePlayerRow({ id: 'b', gold: 100 });

    const goldOnly: TradeOffer = { items: [], gold: 50 };
    service.recordOffer('a', 'b', goldOnly);
    // 'b' never records an offer, but somehow both get marked locked
    service.recordLock('a', 'b');
    service.recordLock('b', 'a');

    const result = await service.executeTrade('a', 'b');
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/missing an offer/i);
  });

  it('executes a valid gold-only trade atomically', async () => {
    players['a'] = makePlayerRow({ id: 'a', name: 'Alice', gold: 100 });
    players['b'] = makePlayerRow({ id: 'b', name: 'Bob', gold: 50 });

    service.recordOffer('a', 'b', { items: [], gold: 30 });
    service.recordOffer('b', 'a', { items: [], gold: 10 });

    const result = await service.executeTrade('a', 'b');

    expect(result.success).toBe(true);
    expect(result.results?.get('a')).toEqual({ gold: 80, inventory: [] }); // 100 - 30 + 10
    expect(result.results?.get('b')).toEqual({ gold: 70, inventory: [] }); // 50 - 10 + 30
    expect(players['a'].gold).toBe(80);
    expect(players['b'].gold).toBe(70);
  });

  it('rejects a trade where a player offers more gold than they have', async () => {
    players['a'] = makePlayerRow({ id: 'a', name: 'Alice', gold: 10 });
    players['b'] = makePlayerRow({ id: 'b', name: 'Bob', gold: 50 });

    service.recordOffer('a', 'b', { items: [], gold: 999 });
    service.recordOffer('b', 'a', { items: [], gold: 5 });

    const result = await service.executeTrade('a', 'b');

    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/does not have the offered gold/i);
    // Nothing should have been mutated
    expect(players['a'].gold).toBe(10);
    expect(players['b'].gold).toBe(50);
  });

  it('rejects a trade where a player offers an item they do not actually hold', async () => {
    const sword = makeItem('sword-1');
    players['a'] = makePlayerRow({ id: 'a', name: 'Alice', gold: 0, inventory: [] });
    players['b'] = makePlayerRow({ id: 'b', name: 'Bob', gold: 0 });

    service.recordOffer('a', 'b', { items: [{ item: sword, quantity: 1 }], gold: 0 });
    service.recordOffer('b', 'a', { items: [], gold: 0 });

    const result = await service.executeTrade('a', 'b');

    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/does not have the offered item/i);
  });

  it('rejects a trade where a player offers more of an item than they hold', async () => {
    const potion = makeItem('potion-1');
    players['a'] = makePlayerRow({ id: 'a', name: 'Alice', inventory: [{ item: potion, quantity: 2 }] });
    players['b'] = makePlayerRow({ id: 'b', name: 'Bob' });

    service.recordOffer('a', 'b', { items: [{ item: potion, quantity: 5 }], gold: 0 });
    service.recordOffer('b', 'a', { items: [], gold: 0 });

    const result = await service.executeTrade('a', 'b');

    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/does not have the offered item/i);
  });

  it('correctly swaps items between two valid inventories', async () => {
    const sword = makeItem('sword-1');
    const potion = makeItem('potion-1');
    players['a'] = makePlayerRow({ id: 'a', name: 'Alice', inventory: [{ item: sword, quantity: 1 }] });
    players['b'] = makePlayerRow({ id: 'b', name: 'Bob', inventory: [{ item: potion, quantity: 3 }] });

    service.recordOffer('a', 'b', { items: [{ item: sword, quantity: 1 }], gold: 0 });
    service.recordOffer('b', 'a', { items: [{ item: potion, quantity: 2 }], gold: 0 });

    const result = await service.executeTrade('a', 'b');

    expect(result.success).toBe(true);
    expect(result.results?.get('a')?.inventory).toEqual([{ item: potion, quantity: 2 }]);
    expect(result.results?.get('b')?.inventory).toEqual([
      { item: potion, quantity: 1 },
      { item: sword, quantity: 1 },
    ]);
  });

  it('clears the session after execution so a stale re-lock cannot replay the trade', async () => {
    players['a'] = makePlayerRow({ id: 'a', gold: 100 });
    players['b'] = makePlayerRow({ id: 'b', gold: 100 });

    service.recordOffer('a', 'b', { items: [], gold: 10 });
    service.recordOffer('b', 'a', { items: [], gold: 10 });
    await service.executeTrade('a', 'b');

    // No new offers recorded — re-executing should find no session and fail closed.
    const secondResult = await service.executeTrade('a', 'b');
    expect(secondResult.success).toBe(false);
  });

  describe('recordLock', () => {
    it('returns false until both sides have locked', () => {
      service.recordOffer('a', 'b', { items: [], gold: 0 });
      service.recordOffer('b', 'a', { items: [], gold: 0 });
      expect(service.recordLock('a', 'b')).toBe(false);
      expect(service.recordLock('b', 'a')).toBe(true);
    });

    it('returns false if there is no session at all', () => {
      expect(service.recordLock('x', 'y')).toBe(false);
    });

    it('un-locks a player if they change their offer after locking', () => {
      service.recordOffer('a', 'b', { items: [], gold: 5 });
      service.recordOffer('b', 'a', { items: [], gold: 5 });
      service.recordLock('a', 'b');
      service.recordOffer('a', 'b', { items: [], gold: 50 }); // changed mind after locking
      expect(service.recordLock('b', 'a')).toBe(false); // 'a' should need to re-lock
    });
  });
});
