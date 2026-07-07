import type { DungeonState, DungeonRoom, BiomeType } from '@shared/types';
import { v4 as uuidv4 } from 'uuid';

function seededRandom(seed: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return function () {
    h += h << 13;
    h ^= h >> 17;
    h += h << 5;
    return (h >>> 0) / 4294967296;
  };
}

export class DungeonGenerator {
  generate(seed: string, biome: BiomeType = 'dungeon'): DungeonState {
    const rng = seededRandom(seed);
    const width = 48;
    const height = 48;

    // Initialize grid with walls (1)
    const grid: number[][] = Array.from({ length: height }, () => Array(width).fill(1));

    const rooms: DungeonRoom[] = [];

    if (biome === 'swamp' || biome === 'forest' || biome === 'snow') {
      // ── Cellular Automata Caves ──
      // Random fill floors (0) and walls (1)
      for (let y = 2; y < height - 2; y++) {
        for (let x = 2; x < width - 2; x++) {
          grid[y][x] = rng() > 0.45 ? 0 : 1;
        }
      }

      // Smooth grid (4 steps)
      for (let step = 0; step < 4; step++) {
        const temp = grid.map((row) => [...row]);
        for (let y = 2; y < height - 2; y++) {
          for (let x = 2; x < width - 2; x++) {
            let wallCount = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (temp[y + dy][x + dx] === 1) wallCount++;
              }
            }
            grid[y][x] = wallCount > 4 ? 1 : 0;
          }
        }
      }

      // Ensure start room is open
      const startX = Math.floor(width / 2);
      const startY = Math.floor(height / 2);
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          grid[startY + dy][startX + dx] = 0;
        }
      }

      grid[startY][startX] = 8; // Player spawn
      grid[startY][startX + 2] = 6; // Portal

      // Spawn some keys, chests, and boss at random distant open spots
      let elements = [7, 5, 5, 4, 4, 4]; // Boss, chests, keys
      for (let y = 4; y < height - 4; y++) {
        for (let x = 4; x < width - 4; x++) {
          if (grid[y][x] === 0 && rng() < 0.05 && elements.length > 0) {
            const item = elements.pop()!;
            grid[y][x] = item;
          }
        }
      }

      rooms.push({
        x: startX - 3,
        y: startY - 3,
        width: 7,
        height: 7,
        type: 'entrance',
        cleared: true,
      });
    } else {
      // ── BSP Dungeon / Stone Crypts ──
      // Define rooms using simple partition cuts
      const horizontalCut1 = Math.floor(height * 0.45) + Math.floor(rng() * 4);
      const verticalCut1 = Math.floor(width * 0.45) + Math.floor(rng() * 4);

      const roomSlices = [
        { x: 3, y: 3, w: verticalCut1 - 5, h: horizontalCut1 - 5 },
        { x: verticalCut1 + 2, y: 3, w: width - verticalCut1 - 5, h: horizontalCut1 - 5 },
        { x: 3, y: horizontalCut1 + 2, w: verticalCut1 - 5, h: height - horizontalCut1 - 5 },
        { x: verticalCut1 + 2, y: horizontalCut1 + 2, w: width - verticalCut1 - 5, h: height - horizontalCut1 - 5 },
      ];

      // Carve slices out as floors (0)
      roomSlices.forEach((slice, idx) => {
        for (let y = slice.y; y < slice.y + slice.h; y++) {
          for (let x = slice.x; x < slice.x + slice.w; x++) {
            grid[y][x] = 0;
          }
        }

        rooms.push({
          x: slice.x,
          y: slice.y,
          width: slice.w,
          height: slice.h,
          type: idx === 0 ? 'entrance' : idx === 3 ? 'boss' : idx === 1 ? 'treasure' : 'hall',
          cleared: idx === 0,
        });
      });

      // Carve connecting hallways
      const midY = Math.floor(horizontalCut1);
      const midX = Math.floor(verticalCut1);

      // Central horizontal hallway
      for (let x = 4; x < width - 4; x++) grid[midY][x] = 0;
      // Central vertical hallway
      for (let y = 4; y < height - 4; y++) grid[y][midX] = 0;

      // Add doors at the entrance of each room slice
      roomSlices.forEach((slice, idx) => {
        if (idx === 0) {
          // Player spawn
          grid[slice.y + 2][slice.x + 2] = 8;
          // Exit portal
          grid[slice.y + 2][slice.x + 4] = 6;
        } else if (idx === 3) {
          // Boss Spawn
          grid[slice.y + Math.floor(slice.h / 2)][slice.x + Math.floor(slice.w / 2)] = 7;
          // Locked door (2)
          grid[slice.y - 1][slice.x + 2] = 2; 
        } else {
          // Regular door (3)
          grid[slice.y - 1][slice.x + 2] = 3;
          // Chest
          grid[slice.y + 1][slice.x + 1] = 5;
          // Key spawn
          grid[slice.y + 2][slice.x + 3] = 4;
        }
      });
    }

    return {
      id: uuidv4(),
      seed,
      name: `Crypt of the ${seed.split('-')[0] ?? 'Forbidden'} Ancient`,
      biome,
      rooms,
      bossAlive: true,
      grid,
    };
  }
}

export const dungeonGenerator = new DungeonGenerator();
