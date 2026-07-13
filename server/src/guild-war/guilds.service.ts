import { Injectable, BadRequestException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GuildsService {
  constructor(private prisma: PrismaService) {}

  async create(leaderId: string, name: string, tag: string) {
    const trimmedName = name.trim();
    const trimmedTag = tag.trim().toUpperCase().slice(0, 5);

    if (!trimmedName || trimmedName.length < 3) {
      throw new BadRequestException('Guild name must be at least 3 characters.');
    }
    if (!trimmedTag || trimmedTag.length < 2) {
      throw new BadRequestException('Guild tag must be 2-5 characters.');
    }

    // Check if player already in a guild
    const existing = await this.prisma.guild.findFirst({
      where: { leaderId },
    });
    if (existing) {
      throw new ConflictException('You already lead a guild. Leave it first.');
    }

    try {
      const guild = await this.prisma.guild.create({
        data: {
          name: trimmedName,
          tag: trimmedTag,
          leaderId,
          bankJson: '[]',
        },
      });
      return guild;
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException('A guild with that name or tag already exists.');
      }
      throw e;
    }
  }

  async findAll() {
    return this.prisma.guild.findMany({
      orderBy: { level: 'desc' },
      take: 50,
    });
  }

  async findById(id: string) {
    const guild = await this.prisma.guild.findUnique({ where: { id } });
    if (!guild) throw new NotFoundException('Guild not found');
    return guild;
  }

  /** A player joins an existing guild by ID.
   * The Guild schema doesn't have a members table yet (memberIdsJson would be added),
   * so we store it in the bankJson field for now as a workaround pending migration.
   * Better: add a guildId column to the Player table.
   */
  async join(guildId: string, playerId: string, playerName: string) {
    const guild = await this.prisma.guild.findUnique({ where: { id: guildId } });
    if (!guild) throw new NotFoundException('Guild not found');

    // Parse member list from bankJson (temporary — bankJson will be separate)
    let memberIds: string[] = [];
    try {
      const bank = JSON.parse(guild.bankJson);
      // We store members as { memberIds: string[], bank: Item[] } 
      if (Array.isArray(bank.memberIds)) memberIds = bank.memberIds;
    } catch {
      memberIds = [];
    }

    if (memberIds.includes(playerId)) {
      throw new ConflictException('Already a member of this guild.');
    }

    memberIds.push(playerId);

    let bankData: any;
    try {
      bankData = JSON.parse(guild.bankJson);
      if (!Array.isArray(bankData.memberIds)) bankData = { memberIds: [playerId], bank: [] };
      else bankData.memberIds = memberIds;
    } catch {
      bankData = { memberIds, bank: [] };
    }

    await this.prisma.guild.update({
      where: { id: guildId },
      data: { bankJson: JSON.stringify(bankData) },
    });

    return { success: true, guildId, playerName };
  }

  async leave(guildId: string, playerId: string) {
    const guild = await this.prisma.guild.findUnique({ where: { id: guildId } });
    if (!guild) throw new NotFoundException('Guild not found');

    if (guild.leaderId === playerId) {
      // If leader leaves, disband the guild
      await this.prisma.guild.delete({ where: { id: guildId } });
      return { disbanded: true };
    }

    let bankData: any;
    try {
      bankData = JSON.parse(guild.bankJson);
      if (Array.isArray(bankData.memberIds)) {
        bankData.memberIds = bankData.memberIds.filter((id: string) => id !== playerId);
      }
    } catch {
      bankData = { memberIds: [], bank: [] };
    }

    await this.prisma.guild.update({
      where: { id: guildId },
      data: { bankJson: JSON.stringify(bankData) },
    });

    return { success: true };
  }

  async kick(guildId: string, leaderId: string, targetPlayerId: string) {
    const guild = await this.prisma.guild.findUnique({ where: { id: guildId } });
    if (!guild) throw new NotFoundException('Guild not found');
    if (guild.leaderId !== leaderId) throw new ForbiddenException('Only the leader can kick members.');

    return this.leave(guildId, targetPlayerId);
  }
}
