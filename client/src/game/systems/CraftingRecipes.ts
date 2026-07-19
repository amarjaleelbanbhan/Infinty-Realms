import type { Item } from '@shared/types';

export interface CraftingRecipe {
  id: string;
  name: string;
  ingredients: { itemId: string; name: string; quantity: number }[];
  result: Item;
  resultQuantity: number;
}

export const RECIPES: CraftingRecipe[] = [
  {
    id: 'craft-iron-sword',
    name: 'Iron Sword',
    ingredients: [{ itemId: 'iron-ore', name: 'Iron Ore', quantity: 5 }],
    result: { id: 'iron-sword', name: 'Iron Sword', type: 'weapon', rarity: 'common', value: 50, icon: '🗡️', description: 'A basic iron sword.', stats: { attack: 5 } },
    resultQuantity: 1,
  },
  {
    id: 'craft-health-potion',
    name: 'Health Potion',
    ingredients: [{ itemId: 'herbals', name: 'Mystic Herbs', quantity: 3 }],
    result: { id: 'health-potion-1', name: 'Minor Health Potion', type: 'consumable', rarity: 'common', value: 10, icon: '🧪', description: 'Restores 50 HP.', effect: 'heal_50' },
    resultQuantity: 2,
  },
  {
    id: 'craft-steel-sword',
    name: 'Steel Sword',
    ingredients: [{ itemId: 'iron-ore', name: 'Iron Ore', quantity: 10 }, { itemId: 'leyline-essence', name: 'Leyline Essence', quantity: 2 }],
    result: { id: 'steel-sword', name: 'Steel Sword', type: 'weapon', rarity: 'uncommon', value: 120, icon: '⚔️', description: 'A well-forged steel blade.', stats: { attack: 8 } },
    resultQuantity: 1,
  },
  {
    id: 'craft-leather-armor',
    name: 'Leather Armor',
    ingredients: [{ itemId: 'iron-ore', name: 'Iron Ore', quantity: 3 }, { itemId: 'herbals', name: 'Mystic Herbs', quantity: 2 }],
    result: { id: 'leather-armor', name: 'Leather Armor', type: 'armor', rarity: 'common', value: 40, icon: '🛡️', description: 'Basic leather protection.', stats: { defense: 3, maxHp: 15 } },
    resultQuantity: 1,
  },
  {
    id: 'craft-chain-mail',
    name: 'Chain Mail',
    ingredients: [{ itemId: 'iron-ore', name: 'Iron Ore', quantity: 15 }, { itemId: 'ice-crystal', name: 'Ice Crystal', quantity: 3 }],
    result: { id: 'chain-mail', name: 'Chain Mail', type: 'armor', rarity: 'uncommon', value: 100, icon: '🛡️', description: 'Interlocking metal rings.', stats: { defense: 6, maxHp: 30 } },
    resultQuantity: 1,
  },
];

export function canCraft(recipe: CraftingRecipe, inventory: { item: { id: string }; quantity: number }[]): boolean {
  return recipe.ingredients.every(ing => {
    const slot = inventory.find(s => s.item.id === ing.itemId);
    return slot && slot.quantity >= ing.quantity;
  });
}
