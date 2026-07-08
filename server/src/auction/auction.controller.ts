import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuctionService } from './auction.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsNumber, IsObject } from 'class-validator';

class CreateAuctionDto {
  @IsObject() item!: Record<string, any>;
  @IsNumber() buyoutPrice!: number;
}

@ApiTags('auction')
@Controller('auction')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuctionController {
  constructor(private auction: AuctionService) {}

  @Get()
  @ApiOperation({ summary: 'List active auction items' })
  async list() {
    return this.auction.listItems();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new auction listing' })
  async create(
    @Body() dto: CreateAuctionDto,
    @Request() req: { user: { playerId: string; playerName: string } },
  ) {
    return this.auction.createAuction({
      sellerId: req.user.playerId,
      sellerName: req.user.playerName,
      itemJson: JSON.stringify(dto.item),
      buyoutPrice: dto.buyoutPrice,
    });
  }

  @Post(':id/buy')
  @ApiOperation({ summary: 'Buyout an auction item' })
  async buyout(
    @Param('id') id: string,
    @Request() req: { user: { playerId: string } },
  ) {
    return this.auction.buyout(id, req.user.playerId);
  }
}
