import { Module } from '@nestjs/common';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { CombatController } from './combat.controller';
import { CombatService } from './combat.service';
import { PrismaModule } from '../prisma/prisma.module';
import { Web3Service } from './web3.service';

@Module({
  imports: [PrismaModule],
  controllers: [PlayersController, CombatController],
  providers: [PlayersService, CombatService, Web3Service],
  exports: [PlayersService, CombatService, Web3Service],
})
export class PlayersModule {}
