import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import type { InventorySlot, Equipment, PlayerStats } from '@infinity-realms/shared/types';

function makePlayerRow(overrides: Partial<{
  id: string;
  gold: number;
  inventoryJson: string;
  equipmentJson: string;
  statsJson: string;
}> = {}) {
  return {
    id: overrides.id ?? 'p1',
    name: 'Player',
    gold: overrides.gold ?? 100,
    experience: 0,
    level: 1,
    ascensions: 0,
    posX: 0,
    posY: 0,
    playtime: 0,
    statsJson: overrides.statsJson ?? JSON.stringify({ hp: 100, maxHp: 100, attack: 10, defense: 5 }),
    inventoryJson: overrides.inventoryJson ?? '[]',
    equipmentJson: overrides.equipmentJson ?? '{}',
    skillsJson: '[]',
    reputationJson: '{}',
    titlesJson: '[]',
    updatedAt: new Date(),
  };
}

describe('InventoryService', () => {
  let players: Record<string, any>;
  let prismaMock: { player: { findUnique: jest.Mock; update: jest.Mock } };
  let service: InventoryService;

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
    service = new InventoryService(prismaMock as any);
  });

  describe('equip', () => {
    it('throws NotFoundException for unknown player', async () => {
      await expect(service.equip('ghost', 'iron-sword', 'weapon')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if item is not in inventory', async () => {
      players['p1'] = makePlayerRow();
      await expect(service.equip('p1', 'iron-sword', 'weapon')).rejects.toThrow(BadRequestException);
    });

    it('equips compatible item and modifies player stats', async () => {
      players['p1'] = makePlayerRow({
        inventoryJson: JSON.stringify([
          {
            item: { id: 'iron-sword', name: 'Iron Sword', type: 'weapon', rarity: 'common', value: 50 },
            quantity: 1,
          },
        ]),
      });

      const res = await service.equip('p1', 'iron-sword', 'weapon');
      expect(res.equipment.weapon?.id).toBe('iron-sword');
      expect(res.inventory.length).toBe(0);
      expect(res.stats.attack).toBe(15); // base 10 + 5 from sword
    });

    it('throws BadRequestException if trying to equip in incompatible slot', async () => {
      players['p1'] = makePlayerRow({
        inventoryJson: JSON.stringify([
          {
            item: { id: 'iron-sword', name: 'Iron Sword', type: 'weapon', rarity: 'common', value: 50 },
            quantity: 1,
          },
        ]),
      });

      await expect(service.equip('p1', 'iron-sword', 'armor')).rejects.toThrow(BadRequestException);
    });
  });

  describe('unequip', () => {
    it('unequips item and restores stats', async () => {
      players['p1'] = makePlayerRow({
        equipmentJson: JSON.stringify({
          weapon: { id: 'iron-sword', name: 'Iron Sword', type: 'weapon', rarity: 'common', value: 50 },
        }),
        statsJson: JSON.stringify({ hp: 100, maxHp: 100, attack: 15, defense: 5 }), // stats already boosted
      });

      const res = await service.unequip('p1', 'weapon');
      expect(res.equipment.weapon).toBeUndefined();
      expect(res.inventory.find(s => s.item.id === 'iron-sword')?.quantity).toBe(1);
      expect(res.stats.attack).toBe(10); // restored back to base
    });
  });

  describe('consume', () => {
    it('consumes potion and heals player HP up to maxHp', async () => {
      players['p1'] = makePlayerRow({
        inventoryJson: JSON.stringify([
          {
            item: { id: 'health-potion-1', name: 'Minor Health Potion', type: 'consumable', rarity: 'common', value: 10 },
            quantity: 2,
          },
        ]),
        statsJson: JSON.stringify({ hp: 40, maxHp: 100, attack: 10, defense: 5 }),
      });

      const res = await service.consume('p1', 'health-potion-1');
      expect(res.stats.hp).toBe(90); // +50 HP
      expect(res.inventory[0].quantity).toBe(1); // 1 consumed
    });
  });

  describe('shopTransaction', () => {
    it('handles buy transaction correctly', async () => {
      players['p1'] = makePlayerRow({ gold: 100 });

      const res = await service.shopTransaction('p1', 'buy', 'iron-ore', 2, 'plains', 0);
      expect(res.gold).toBe(80); // 100 - (10 * 2)
      expect(res.inventory.find(s => s.item.id === 'iron-ore')?.quantity).toBe(2);
    });

    it('rejects buy if player lacks gold', async () => {
      players['p1'] = makePlayerRow({ gold: 5 });
      await expect(service.shopTransaction('p1', 'buy', 'iron-ore', 1, 'plains', 0)).rejects.toThrow(BadRequestException);
    });

    it('handles sell transaction correctly with saturation price drop', async () => {
      players['p1'] = makePlayerRow({
        gold: 10,
        inventoryJson: JSON.stringify([
          {
            item: { id: 'iron-ore', name: 'Iron Ore', type: 'material', rarity: 'common', value: 10 },
            quantity: 3,
          },
        ]),
      });

      // Sell 1 iron ore with saturation 2 (prices drop 8% * 2 = 16% -> value 10 * 0.84 = 8g)
      const res = await service.shopTransaction('p1', 'sell', 'iron-ore', 1, 'plains', 2);
      expect(res.gold).toBe(18); // 10 + 8
      expect(res.inventory[0].quantity).toBe(2);
    });
  });
});
