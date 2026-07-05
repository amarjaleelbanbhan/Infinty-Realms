// ============================================================
// World Generator — Procedural terrain from a seed
// Uses simplex noise for heightmap + moisture map
// Then assigns biomes, places cities, dungeons, rivers
// ============================================================

import { createNoise2D } from 'simplex-noise';
import type { BiomeType, WorldTile, City, StructureType } from '@shared/types';

// ─── Seeded PRNG ──────────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function stringToSeed(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ─── Biome Color Map ──────────────────────────────────────────
export const BIOME_COLORS: Record<BiomeType, number> = {
  ocean:   0x1a3a6a,
  beach:   0xd4b483,
  plains:  0x4a7c40,
  forest:  0x2d5a27,
  desert:  0xc8a84b,
  snow:    0xe8e8f0,
  volcano: 0x8b2500,
  swamp:   0x3a5a2a,
  dungeon: 0x2a2a3a,
};

export const BIOME_TILE_COLOR: Record<BiomeType, { base: number; accent: number }> = {
  ocean:   { base: 0x1a3a6a, accent: 0x2a4a8a },
  beach:   { base: 0xd4b483, accent: 0xc8a46a },
  plains:  { base: 0x4a7c40, accent: 0x5a8c50 },
  forest:  { base: 0x2d5a27, accent: 0x1d4a17 },
  desert:  { base: 0xc8a84b, accent: 0xe0b855 },
  snow:    { base: 0xe0e0f0, accent: 0xf0f0ff },
  volcano: { base: 0x8b2500, accent: 0xc03500 },
  swamp:   { base: 0x3a5a2a, accent: 0x4a6a3a },
  dungeon: { base: 0x2a2a3a, accent: 0x1a1a2a },
};

// ─── Biome Assignment ─────────────────────────────────────────
function getBiome(elevation: number, moisture: number): BiomeType {
  if (elevation < 0.25) return 'ocean';
  if (elevation < 0.3)  return 'beach';
  if (elevation > 0.85) return elevation > 0.92 ? 'volcano' : 'snow';
  if (moisture < 0.2)   return 'desert';
  if (moisture < 0.35)  return 'plains';
  if (moisture < 0.6)   return elevation > 0.5 ? 'forest' : 'plains';
  if (moisture > 0.8 && elevation < 0.45) return 'swamp';
  return 'forest';
}

// ─── City Name Generation ─────────────────────────────────────
const CITY_PREFIXES = ['Iron', 'Stone', 'Gold', 'Ember', 'Frost', 'Shadow', 'Dawn', 'Dusk', 'Storm', 'Silver'];
const CITY_SUFFIXES = ['haven', 'hold', 'ford', 'bridge', 'gate', 'reach', 'watch', 'fall', 'peak', 'vale'];

function cityName(rng: () => number): string {
  const p = CITY_PREFIXES[Math.floor(rng() * CITY_PREFIXES.length)];
  const s = CITY_SUFFIXES[Math.floor(rng() * CITY_SUFFIXES.length)];
  return p + s;
}

// ─── Poisson Disk Sampling (simplified) ───────────────────────
function poissonSample(width: number, height: number, minDist: number, rng: () => number, count: number): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  let attempts = 0;
  while (points.length < count && attempts < count * 30) {
    attempts++;
    const x = Math.floor(rng() * width);
    const y = Math.floor(rng() * height);
    const ok = points.every(([px, py]) => {
      const dx = px - x, dy = py - y;
      return Math.sqrt(dx * dx + dy * dy) >= minDist;
    });
    if (ok) points.push([x, y]);
  }
  return points;
}

// ─── Main Generator ───────────────────────────────────────────

export interface GeneratedWorld {
  width: number;
  height: number;
  seed: string;
  tiles: WorldTile[][];
  cities: City[];
  dungeonTiles: Array<{ x: number; y: number }>;
  spawnX: number;
  spawnY: number;
}

export function generateWorld(seed: string, width = 128, height = 128): GeneratedWorld {
  const numericSeed = stringToSeed(seed);
  const rng = mulberry32(numericSeed);

  // Create seeded noise functions using a custom random source
  const noise2D_elevation = createNoise2D(rng);
  const noise2D_moisture  = createNoise2D(rng);
  const noise2D_detail    = createNoise2D(rng);

  // ── Build tile grid ──
  const tiles: WorldTile[][] = [];
  let spawnX = Math.floor(width / 2);
  let spawnY = Math.floor(height / 2);

  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      // Multi-octave noise for elevation
      const nx = x / width - 0.5;
      const ny = y / height - 0.5;

      const elevation = (
        0.6  * noise2D_elevation(nx * 3,   ny * 3) +
        0.25 * noise2D_detail(nx * 8,    ny * 8) +
        0.15 * noise2D_detail(nx * 20,   ny * 20)
      ) * 0.5 + 0.5;

      const moisture = (
        0.7 * noise2D_moisture(nx * 4 + 100, ny * 4 + 100) +
        0.3 * noise2D_detail(nx * 10 + 200, ny * 10 + 200)
      ) * 0.5 + 0.5;

      // Distance from center falloff (makes oceans at edges)
      const distX = 2 * Math.abs(nx);
      const distY = 2 * Math.abs(ny);
      const dist = Math.max(distX, distY);
      const adjustedElev = elevation * (1 - 0.6 * Math.pow(dist, 2));

      const biome = getBiome(Math.max(0, Math.min(1, adjustedElev)), Math.max(0, Math.min(1, moisture)));

      tiles[y][x] = {
        x, y,
        biome,
        elevation: adjustedElev,
        moisture,
        walkable: biome !== 'ocean',
      };
    }
  }

  // ── Find spawn point (plains/beach near center) ──
  for (let r = 0; r < 40; r++) {
    const cx = Math.floor(width / 2) + Math.floor(rng() * 20 - 10);
    const cy = Math.floor(height / 2) + Math.floor(rng() * 20 - 10);
    if (cx >= 0 && cx < width && cy >= 0 && cy < height) {
      const b = tiles[cy][cx].biome;
      if (b === 'plains' || b === 'beach' || b === 'forest') {
        spawnX = cx; spawnY = cy;
        break;
      }
    }
  }

  // ── Place cities ──
  const cityCount = Math.floor(6 + rng() * 6);
  const candidatePositions = poissonSample(width, height, 20, rng, cityCount * 3);
  const cities: City[] = [];

  for (const [cx, cy] of candidatePositions) {
    if (cities.length >= cityCount) break;
    const tile = tiles[cy]?.[cx];
    if (!tile || !tile.walkable) continue;
    if (tile.biome === 'ocean' || tile.biome === 'beach') continue;

    const city: City = {
      id: `city-${seed}-${cx}-${cy}`,
      name: cityName(rng),
      x: cx, y: cy,
      biome: tile.biome,
      population: Math.floor(100 + rng() * 900),
      prosperity: Math.floor(30 + rng() * 70),
      destroyed: false,
    };
    cities.push(city);
    tiles[cy][cx].structure = 'city';
  }

  // ── Place dungeons ──
  const dungeonCount = Math.floor(3 + rng() * 4);
  const dungeonTiles: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < dungeonCount * 20 && dungeonTiles.length < dungeonCount; i++) {
    const dx = Math.floor(rng() * width);
    const dy = Math.floor(rng() * height);
    const tile = tiles[dy]?.[dx];
    if (!tile || !tile.walkable || tile.structure) continue;
    if (tile.biome === 'ocean' || tile.biome === 'beach') continue;

    tiles[dy][dx].structure = 'dungeon';
    dungeonTiles.push({ x: dx, y: dy });
  }

  return { width, height, seed, tiles, cities, dungeonTiles, spawnX, spawnY };
}
