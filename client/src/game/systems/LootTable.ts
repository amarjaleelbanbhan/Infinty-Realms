import type { Item } from '@shared/types';

interface LootEntry {
  item: Item;
  weight: number;
  minLevel: number;
}

const LOOT_TABLE: LootEntry[] = [
  { item: { id: 'health-potion-1', name: 'Minor Health Potion', type: 'consumable', rarity: 'common', value: 10, icon: '🧪', description: 'Restores 50 HP.', effect: 'heal_50' }, weight: 30, minLevel: 1 },
  { item: { id: 'iron-ore', name: 'Iron Ore', type: 'material', rarity: 'common', value: 10, icon: '🪨', description: 'Raw iron ore.' }, weight: 20, minLevel: 1 },
  { item: { id: 'herbals', name: 'Mystic Herbs', type: 'material', rarity: 'uncommon', value: 12, icon: '🌿', description: 'Potent herbs used in alchemy.' }, weight: 15, minLevel: 1 },
  { item: { id: 'iron-sword', name: 'Iron Sword', type: 'weapon', rarity: 'common', value: 50, icon: '🗡️', description: 'A basic iron sword.', stats: { attack: 5 } }, weight: 8, minLevel: 1 },
  { item: { id: 'leather-armor', name: 'Leather Armor', type: 'armor', rarity: 'common', value: 40, icon: '🛡️', description: 'Basic leather protection.', stats: { defense: 3, maxHp: 15 } }, weight: 8, minLevel: 1 },
  { item: { id: 'steel-sword', name: 'Steel Sword', type: 'weapon', rarity: 'uncommon', value: 120, icon: '⚔️', description: 'A well-forged steel blade.', stats: { attack: 8 } }, weight: 4, minLevel: 3 },
  { item: { id: 'chain-mail', name: 'Chain Mail', type: 'armor', rarity: 'uncommon', value: 100, icon: '🛡️', description: 'Interlocking metal rings.', stats: { defense: 6, maxHp: 30 } }, weight: 4, minLevel: 3 },
  { item: { id: 'flame-blade', name: 'Flame Blade', type: 'weapon', rarity: 'rare', value: 250, icon: '🔥', description: 'A sword wreathed in eternal flame.', stats: { attack: 14, luck: 2 } }, weight: 2, minLevel: 5 },
  { item: { id: 'lucky-ring', name: 'Lucky Ring', type: 'accessory', rarity: 'rare', value: 200, icon: '💍', description: 'Fortune favors the wearer.', stats: { luck: 5, speed: 10 } }, weight: 2, minLevel: 5 },
];

export function rollLoot(playerLevel: number): Item | null {
  const eligible = LOOT_TABLE.filter(e => e.minLevel <= playerLevel);
  if (eligible.length === 0) return null;

  const totalWeight = eligible.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const entry of eligible) {
    roll -= entry.weight;
    if (roll <= 0) return { ...entry.item };
  }

  return null;
}
