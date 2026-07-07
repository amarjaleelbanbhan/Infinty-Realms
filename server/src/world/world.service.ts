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

  async triggerDmEvent(dto: {
    playerLevel: number;
    playerGold: number;
    currentBiome: string;
    currentSeason: string;
  }) {
    let eventType = 'meteor_strike';
    let title = '☄️ Starfall over the Plains';
    let description = 'A glowing meteor has struck nearby! Rare star minerals are scatter-dropped in the region.';
    let effects = 'Double Gold & Gem drops from all enemies!';
    let duration = 300;

    if (dto.playerLevel < 3) {
      eventType = 'acid_rain';
      title = '🌧️ Acid Mist Storm';
      description = 'A toxic cloud sweeps across the biome, reducing vision and corroding metal gear.';
      effects = 'Vision reduced, but spell casting speed increased by +50%!';
      duration = 200;
    } else if (dto.playerGold > 500) {
      eventType = 'bandit_siege';
      title = '⚔️ Outlaw Blockade';
      description = 'A ruthless gang of bandits blockades local pathways, hunting down rich seekers.';
      effects = 'Enemy damage increased by +30%, but they drop massive gold payouts!';
      duration = 240;
    } else if (dto.playerLevel >= 5) {
      eventType = 'abyssal_rift';
      title = '🌌 Abyssal Void Rift';
      description = 'A massive tear in the leyline fabric opens up! Corruption spreads rapidly.';
      effects = 'Dungeon monsters invade the surface! Double XP active!';
      duration = 360;
    }

    return {
      id: `event-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      type: eventType,
      title,
      description,
      duration,
      effects,
      startTime: Date.now(),
    };
  }
}
