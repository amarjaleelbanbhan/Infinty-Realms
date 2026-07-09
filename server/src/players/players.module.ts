import { Module } from '@nestjs/common';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { PrismaModule } from '../prisma/prisma.module';
import { Web3Service } from './web3.service';

@Module({
  imports: [PrismaModule],
  controllers: [PlayersController],
  providers: [PlayersService, Web3Service],
  exports: [PlayersService, Web3Service],
})
export class PlayersModule {}
