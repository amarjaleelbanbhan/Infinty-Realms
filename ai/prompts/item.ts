import type { ItemGenerationRequest } from '@infinity-realms/shared/types';

export const ITEM_SYSTEM_PROMPT = `You are creating custom RPG items for Infinity Realms, a top-down fantasy RPG.
Each item should have a name, icon, description, rarity, value, and stats (attack, defense, hp) matched appropriately to the description and item type.
Always respond with valid JSON. Keep descriptions evocative but under 2 sentences.`;

export function buildItemPrompt(req: ItemGenerationRequest): string {
  return `Create a custom item based on this description: "${req.prompt}".
Creator level is ${req.creatorLevel}.

Respond with this exact JSON structure:
{
  "name": "Evocative Item Name",
  "description": "Flavor text describing the item.",
  "type": "weapon|armor|helmet|accessory",
  "rarity": "common|uncommon|rare|epic|legendary",
  "icon": "One emoji icon (e.g. 🗡️, 👕, 🪖, 📿)",
  "value": 100,
  "stats": {
    "attack": 10,
    "defense": 0,
    "hp": 0
  }
}`;
}
