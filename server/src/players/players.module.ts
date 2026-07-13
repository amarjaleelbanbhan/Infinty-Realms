import { Module } from '@nestjs/common';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { CombatController } from './combat.controller';
import { CombatService } from './combat.service';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { PrismaModule } from '../prisma/prisma.module';
import { Web3Service } from './web3.service';

@Module({
  imports: [PrismaModule],
  controllers: [PlayersController, CombatController, InventoryController],
  providers: [PlayersService, CombatService, InventoryService, Web3Service],
  exports: [PlayersService, CombatService, InventoryService, Web3Service],
})
export class PlayersModule {}
