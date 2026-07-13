import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Post('equip')
  async equip(
    @Request() req: any,
    @Body() body: { itemId: string; slot: 'weapon' | 'armor' | 'helmet' | 'accessory' },
  ) {
    const playerId: string = req.user.sub;
    return this.inventoryService.equip(playerId, body.itemId, body.slot);
  }

  @Post('unequip')
  async unequip(
    @Request() req: any,
    @Body() body: { slot: 'weapon' | 'armor' | 'helmet' | 'accessory' },
  ) {
    const playerId: string = req.user.sub;
    return this.inventoryService.unequip(playerId, body.slot);
  }

  @Post('consume')
  async consume(
    @Request() req: any,
    @Body() body: { itemId: string },
  ) {
    const playerId: string = req.user.sub;
    return this.inventoryService.consume(playerId, body.itemId);
  }

  @Post('shop-transaction')
  async shopTransaction(
    @Request() req: any,
    @Body() body: { action: 'buy' | 'sell'; itemId: string; quantity: number; biome: string; saturation: number },
  ) {
    const playerId: string = req.user.sub;
    return this.inventoryService.shopTransaction(
      playerId,
      body.action,
      body.itemId,
      body.quantity,
      body.biome,
      body.saturation,
    );
  }

  @Post('harvest-crop')
  async harvestCrop(
    @Request() req: any,
    @Body() body: { biome: string },
  ) {
    const playerId: string = req.user.sub;
    return this.inventoryService.harvestCrop(playerId, body.biome);
  }

  @Post('harvest-leyline')
  async harvestLeyline(
    @Request() req: any,
    @Body() body: { amount: number },
  ) {
    const playerId: string = req.user.sub;
    return this.inventoryService.harvestLeyline(playerId, body.amount);
  }
}
