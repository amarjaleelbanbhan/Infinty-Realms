import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ITEM_CATALOG } from './items.catalog';
import type { InventorySlot, Equipment, PlayerStats } from '@infinity-realms/shared/types';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  private async getPlayerData(playerId: string) {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Player not found');

    const inventory: InventorySlot[] = JSON.parse(player.inventoryJson);
    const equipment: Equipment = JSON.parse(player.equipmentJson);
    const stats: PlayerStats = JSON.parse(player.statsJson);

    return { player, inventory, equipment, stats };
  }

  private async savePlayerData(
    playerId: string,
    inventory: InventorySlot[],
    equipment: Equipment,
    stats: PlayerStats,
    gold: number,
  ) {
    return this.prisma.player.update({
      where: { id: playerId },
      data: {
        inventoryJson: JSON.stringify(inventory),
        equipmentJson: JSON.stringify(equipment),
        statsJson: JSON.stringify(stats),
        gold,
        updatedAt: new Date(),
      },
    });
  }

  async equip(playerId: string, itemId: string, slot: 'weapon' | 'armor' | 'helmet' | 'accessory') {
    const { player, inventory, equipment, stats } = await this.getPlayerData(playerId);

    const slotIdx = inventory.findIndex(s => s.item.id === itemId && s.quantity > 0);
    if (slotIdx === -1) {
      throw new BadRequestException('Item not found in inventory.');
    }

    const inventorySlot = inventory[slotIdx];
    const itemToEquip = inventorySlot.item;

    // Validate slot type compatibility
    if (itemToEquip.type !== slot) {
      throw new BadRequestException(`Cannot equip item type "${itemToEquip.type}" into slot "${slot}".`);
    }

    // Unequip current item in that slot if it exists
    const currentEquipped = equipment[slot];
    if (currentEquipped) {
      const existingInInventory = inventory.find(s => s.item.id === currentEquipped.id);
      if (existingInInventory) {
        existingInInventory.quantity += 1;
      } else {
        inventory.push({ item: currentEquipped, quantity: 1 });
      }
      // Remove stats modifier of old item
      this.modifyStatsForEquipment(stats, currentEquipped, false);
    }

    // Remove from inventory
    inventorySlot.quantity -= 1;
    if (inventorySlot.quantity <= 0) {
      inventory.splice(slotIdx, 1);
    }

    // Set in equipment
    equipment[slot] = itemToEquip;
    // Add stats modifier of new item
    this.modifyStatsForEquipment(stats, itemToEquip, true);

    await this.savePlayerData(playerId, inventory, equipment, stats, player.gold);

    return { inventory, equipment, stats };
  }

  async unequip(playerId: string, slot: 'weapon' | 'armor' | 'helmet' | 'accessory') {
    const { player, inventory, equipment, stats } = await this.getPlayerData(playerId);

    const itemToUnequip = equipment[slot];
    if (!itemToUnequip) {
      throw new BadRequestException(`No item equipped in slot "${slot}".`);
    }

    // Remove from equipment
    delete equipment[slot];
    // Remove stats modifier
    this.modifyStatsForEquipment(stats, itemToUnequip, false);

    // Add back to inventory
    const existingInInventory = inventory.find(s => s.item.id === itemToUnequip.id);
    if (existingInInventory) {
      existingInInventory.quantity += 1;
    } else {
      inventory.push({ item: itemToUnequip, quantity: 1 });
    }

    await this.savePlayerData(playerId, inventory, equipment, stats, player.gold);

    return { inventory, equipment, stats };
  }

  async consume(playerId: string, itemId: string) {
    const { player, inventory, equipment, stats } = await this.getPlayerData(playerId);

    const slotIdx = inventory.findIndex(s => s.item.id === itemId && s.quantity > 0);
    if (slotIdx === -1) {
      throw new BadRequestException('Item not found in inventory.');
    }

    const inventorySlot = inventory[slotIdx];
    const item = inventorySlot.item;

    if (item.type !== 'consumable') {
      throw new BadRequestException('Item is not consumable.');
    }

    // Apply consumable effects (e.g. Minor Health Potion restores 50 HP)
    if (item.id === 'health-potion-1') {
      stats.hp = Math.min(stats.maxHp, stats.hp + 50);
    } else {
      throw new BadRequestException(`Consumable item behavior for "${item.id}" is not implemented.`);
    }

    // Consume item
    inventorySlot.quantity -= 1;
    if (inventorySlot.quantity <= 0) {
      inventory.splice(slotIdx, 1);
    }

    await this.savePlayerData(playerId, inventory, equipment, stats, player.gold);

    return { inventory, equipment, stats };
  }

  async shopTransaction(
    playerId: string,
    action: 'buy' | 'sell',
    itemId: string,
    quantity: number,
    biome: string,
    saturation: number,
  ) {
    if (quantity <= 0) throw new BadRequestException('Quantity must be positive.');

    const catalogItem = ITEM_CATALOG[itemId];
    if (!catalogItem) {
      throw new BadRequestException(`Item "${itemId}" not found in catalog.`);
    }

    const { player, inventory, equipment, stats } = await this.getPlayerData(playerId);

    // Compute price server-side based on biome multipliers
    let multiplier = 1.0;
    const cheapBiomes = this.getCheapBiomes(itemId);
    const expensiveBiomes = this.getExpensiveBiomes(itemId);

    if (cheapBiomes.includes(biome)) {
      multiplier = 0.5;
    } else if (expensiveBiomes.includes(biome)) {
      multiplier = 2.0;
    }

    const isSelling = action === 'sell';
    const saturationMultiplier = isSelling ? Math.max(0.2, 1.0 - saturation * 0.08) : 1.0;
    const itemPrice = Math.round(catalogItem.value * multiplier * saturationMultiplier);
    const totalCost = itemPrice * quantity;

    if (action === 'buy') {
      if (player.gold < totalCost) {
        throw new BadRequestException('Insufficient gold.');
      }

      // Deduct gold
      const finalGold = player.gold - totalCost;

      // Add to inventory
      const existing = inventory.find(s => s.item.id === itemId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        inventory.push({ item: catalogItem, quantity });
      }

      await this.savePlayerData(playerId, inventory, equipment, stats, finalGold);
      return { inventory, equipment, stats, gold: finalGold };
    } else {
      // Sell
      const idx = inventory.findIndex(s => s.item.id === itemId);
      if (idx === -1 || inventory[idx].quantity < quantity) {
        throw new BadRequestException('Insufficient item stock in inventory.');
      }

      // Deduct from inventory
      inventory[idx].quantity -= quantity;
      if (inventory[idx].quantity <= 0) {
        inventory.splice(idx, 1);
      }

      // Add gold
      const finalGold = player.gold + totalCost;

      await this.savePlayerData(playerId, inventory, equipment, stats, finalGold);
      return { inventory, equipment, stats, gold: finalGold };
    }
  }

  async harvestCrop(playerId: string, biome: string) {
    const { player, inventory, equipment, stats } = await this.getPlayerData(playerId);

    const cropId = `crop-${biome}`;
    const cropItem = ITEM_CATALOG[cropId] ?? ITEM_CATALOG['crop-plains'];

    const existing = inventory.find(s => s.item.id === cropItem.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      inventory.push({ item: cropItem, quantity: 1 });
    }

    await this.savePlayerData(playerId, inventory, equipment, stats, player.gold);

    return { inventory, equipment, stats };
  }

  async harvestLeyline(playerId: string, amount: number) {
    if (amount <= 0) throw new BadRequestException('Harvest amount must be positive.');
    if (amount > 100) throw new BadRequestException('Leyline harvest exceeds maximum allowable limit.');

    const { player, inventory, equipment, stats } = await this.getPlayerData(playerId);

    const essenceItem = ITEM_CATALOG['leyline-essence'];

    const existing = inventory.find(s => s.item.id === essenceItem.id);
    if (existing) {
      existing.quantity += amount;
    } else {
      inventory.push({ item: essenceItem, quantity: amount });
    }

    await this.savePlayerData(playerId, inventory, equipment, stats, player.gold);

    return { inventory, equipment, stats };
  }

  private modifyStatsForEquipment(stats: PlayerStats, item: any, isEquip: boolean) {
    const sign = isEquip ? 1 : -1;
    if (item.id === 'iron-sword') {
      stats.attack += 5 * sign;
    }
  }

  private getCheapBiomes(itemId: string): string[] {
    if (itemId === 'iron-ore') return ['volcano'];
    if (itemId === 'herbals') return ['forest', 'swamp'];
    if (itemId === 'sand-glass') return ['desert'];
    if (itemId === 'ice-crystal') return ['snow'];
    return [];
  }

  private getExpensiveBiomes(itemId: string): string[] {
    if (itemId === 'iron-ore') return ['desert', 'snow'];
    if (itemId === 'herbals') return ['snow', 'desert'];
    if (itemId === 'sand-glass') return ['snow', 'forest'];
    if (itemId === 'ice-crystal') return ['volcano', 'desert'];
    return [];
  }
}
