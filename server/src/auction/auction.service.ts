import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuctionService {
  constructor(private prisma: PrismaService) {}

  async listItems() {
    const items = await this.prisma.auctionItem.findMany({
      where: { status: 'active', expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return items.map((i: { itemJson: string }) => ({
      ...i,
      item: JSON.parse(i.itemJson),
    }));
  }

  async createAuction(dto: { sellerId: string; sellerName: string; itemJson: string; buyoutPrice: number }) {
    if (dto.buyoutPrice <= 0) throw new BadRequestException('Buyout price must be greater than 0');
    
    // Expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const auction = await this.prisma.auctionItem.create({
      data: {
        sellerId: dto.sellerId,
        sellerName: dto.sellerName,
        itemJson: dto.itemJson,
        buyoutPrice: dto.buyoutPrice,
        expiresAt,
      },
    });

    return auction;
  }

  async buyout(auctionId: string, buyerId: string) {
    // Transaction to ensure atomicity
    return this.prisma.$transaction(async (tx: any) => {
      const auction = await tx.auctionItem.findUnique({ where: { id: auctionId } });
      if (!auction || auction.status !== 'active') throw new NotFoundException('Auction not found or not active');
      if (auction.sellerId === buyerId) throw new BadRequestException('Cannot buy your own item');
      if (auction.expiresAt < new Date()) throw new BadRequestException('Auction expired');

      const buyer = await tx.player.findUnique({ where: { id: buyerId } });
      if (!buyer || buyer.gold < auction.buyoutPrice) throw new BadRequestException('Not enough gold');

      // Deduct gold from buyer
      await tx.player.update({
        where: { id: buyerId },
        data: { gold: { decrement: auction.buyoutPrice } },
      });

      // Add gold to seller
      await tx.player.update({
        where: { id: auction.sellerId },
        data: { gold: { increment: auction.buyoutPrice } },
      });

      // Update auction
      const updated = await tx.auctionItem.update({
        where: { id: auctionId },
        data: { status: 'sold', highestBidderId: buyerId },
      });

      return {
        ...updated,
        item: JSON.parse(updated.itemJson),
      };
    });
  }
}
