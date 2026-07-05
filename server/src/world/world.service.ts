import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import type { WorldState, Season } from '@infinity-realms/shared/types';

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];

@Injectable()
export class WorldService {
  constructor(private prisma: PrismaService) {}

  async getOrCreate(seed: string): Promise<Partial<WorldState>> {
    let world = await this.prisma.worldState.findUnique({ where: { seed } });

    if (!world) {
      world = await this.prisma.worldState.create({
        data: {
          id: uuidv4(),
          seed,
          season: this.computeSeason(),
          dayTime: 8,
          worldAge: 0,
        },
      });
    }

    return {
      seed: world.seed,
      width: world.width,
      height: world.height,
      cities: JSON.parse(world.citiesJson),
      season: world.season as Season,
      dayTime: world.dayTime,
      worldAge: world.worldAge,
    };
  }

  /** Advance world time (called periodically) */
  async tick(seed: string) {
    const world = await this.prisma.worldState.findUnique({ where: { seed } });
    if (!world) return;

    const newDayTime = (world.dayTime + 0.1) % 24;
    const newWorldAge = newDayTime < world.dayTime ? world.worldAge + 1 : world.worldAge;
    const newSeason = this.computeSeason(newWorldAge);

    await this.prisma.worldState.update({
      where: { seed },
      data: { dayTime: newDayTime, worldAge: newWorldAge, season: newSeason },
    });
  }

  private computeSeason(worldAge = 0): Season {
    const idx = Math.floor(worldAge / 30) % 4;
    return SEASONS[idx];
  }
}
