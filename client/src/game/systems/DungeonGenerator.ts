import type { DungeonState, DungeonRoom, BiomeType } from '@shared/types';
import { v4 as uuidv4 } from 'uuid';

export class DungeonGenerator {
  generate(seed: string, biome: BiomeType = 'dungeon'): DungeonState {
    const rooms: DungeonRoom[] = [];
    const roomCount = 5 + Math.floor(Math.random() * 4);

    // Entrance room
    rooms.push({
      x: 2,
      y: 2,
      width: 8,
      height: 8,
      type: 'entrance',
      cleared: true,
    });

    // Hallways & Monster rooms
    for (let i = 1; i < roomCount - 1; i++) {
      rooms.push({
        x: 12 + i * 10,
        y: 2 + (i % 2) * 6,
        width: 7 + Math.floor(Math.random() * 4),
        height: 7 + Math.floor(Math.random() * 4),
        type: i % 2 === 0 ? 'treasure' : 'hall',
        cleared: false,
      });
    }

    // Boss room
    rooms.push({
      x: 12 + roomCount * 10,
      y: 4,
      width: 12,
      height: 12,
      type: 'boss',
      cleared: false,
    });

    return {
      id: uuidv4(),
      seed,
      name: `Crypt of the ${seed.split('-')[0] ?? 'Forbidden'} Ancient`,
      biome,
      rooms,
      bossAlive: true,
    };
  }
}

export const dungeonGenerator = new DungeonGenerator();
