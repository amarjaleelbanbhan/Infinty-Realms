import { useRef, useEffect, useState } from 'react';
import { useGameStore } from '@stores/useGameStore';
import { BIOME_COLORS, type GeneratedWorld } from '@game/systems/WorldGenerator';
import { leylineSystem } from '@game/systems/LeylineSystem';
import type { BiomeType } from '@shared/types';
import { Waves, Umbrella, Leaf, TreePine, Sun, Snowflake, Flame, Droplets, Skull, Map, X } from 'lucide-react';

const BIOME_ICON: Partial<Record<BiomeType, React.ElementType>> = {
  ocean: Waves, beach: Umbrella, plains: Leaf, forest: TreePine,
  desert: Sun, snow: Snowflake, volcano: Flame, swamp: Droplets, dungeon: Skull,
};

const LEGEND_BIOMES: BiomeType[] = ['ocean', 'beach', 'plains', 'forest', 'desert', 'snow', 'volcano', 'swamp'];

// Render world tiles onto a canvas for crisp, pixel-accurate display
function useBiomeCanvas(world: GeneratedWorld | null) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !world) return;

    const GRID = 128;
    canvas.width = GRID;
    canvas.height = GRID;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = ctx.createImageData(GRID, GRID);

    for (let y = 0; y < world.height; y++) {
      for (let x = 0; x < world.width; x++) {
        const biome = world.tiles[y]?.[x]?.biome ?? 'ocean';
        const hex = BIOME_COLORS[biome as BiomeType] ?? 0x1a3a6a;
        const r = (hex >> 16) & 0xff;
        const g = (hex >> 8) & 0xff;
        const b = hex & 0xff;
        const idx = (y * GRID + x) * 4;
        img.data[idx] = r;
        img.data[idx + 1] = g;
        img.data[idx + 2] = b;
        img.data[idx + 3] = 255;
      }
    }

    ctx.putImageData(img, 0, 0);
  }, [world]);

  return canvasRef;
}

export function WorldMapUI({ onClose }: { onClose: () => void }) {
  const { worldState, player } = useGameStore();
  const [world, setWorld] = useState<GeneratedWorld | null>(null);

  // Access world data exposed from WorldScene
  useEffect(() => {
    const w = (window as Window & { __worldData?: GeneratedWorld }).__worldData;
    if (w) setWorld(w);
  }, []);

  const canvasRef = useBiomeCanvas(world);
  const nodes = leylineSystem.getNodes();

  const mapW = world?.width ?? 128;
  const mapH = world?.height ?? 128;
  const cities = world?.cities ?? [];
  const dungeons = world?.dungeonTiles ?? [];

  // Player tile position (from store: px/py are pixel coords)
  const playerPixelX = player?.x ?? 0;
  const playerPixelY = player?.y ?? 0;
  const playerTileX = Math.floor(playerPixelX / 32);
  const playerTileY = Math.floor(playerPixelY / 32);

  // Percentage positions for overlay pins on the 128×128 canvas rendered in CSS
  const pctX = (playerTileX / mapW) * 100;
  const pctY = (playerTileY / mapH) * 100;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="world-map-panel" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="world-map-header">
          <div className="flex items-center gap-3">
            <Map className="w-8 h-8 text-realm-accent" />
            <div>
              <h2 className="font-game text-base text-white leading-tight tracking-widest uppercase">
                Infinity Realm Map
              </h2>
              <p className="font-mono text-[10px] text-realm-gold mt-0.5 tracking-widest">
                SEED · {worldState?.seed ?? '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">Position</div>
              <div className="font-mono text-xs text-white">
                {playerTileX.toString().padStart(3, '0')} / {playerTileY.toString().padStart(3, '0')}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-realm-border flex items-center justify-center text-gray-500 hover:text-white hover:border-realm-accent transition-colors text-sm"
              aria-label="Close map"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Map Canvas + Pins ── */}
        <div className="world-map-canvas-wrap">
          {/* Pixel canvas — 128×128 scaled via CSS to fill container */}
          <canvas
            ref={canvasRef}
            className="world-map-canvas"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* Overlay layer for pins */}
          <div className="world-map-pins">
            {/* Player dot */}
            <div
              className="map-pin player-pin"
              style={{ left: `${pctX}%`, top: `${pctY}%` }}
              title={`You (${playerTileX}, ${playerTileY})`}
            />

            {/* Cities */}
            {cities.map((city, i) => (
              <div
                key={`city-${i}`}
                className="map-pin city-pin"
                style={{
                  left: `${(city.x / mapW) * 100}%`,
                  top: `${(city.y / mapH) * 100}%`,
                }}
                title={`City: ${city.name}`}
              />
            ))}

            {/* Dungeons */}
            {dungeons.map((d, i) => (
              <div
                key={`dungeon-${i}`}
                className="map-pin dungeon-pin"
                style={{
                  left: `${(d.x / mapW) * 100}%`,
                  top: `${(d.y / mapH) * 100}%`,
                }}
                title="Dungeon"
              />
            ))}

            {/* Leyline nodes */}
            {nodes.map((n, i) => {
              const nx = Math.floor(n.x / 32);
              const ny = Math.floor(n.y / 32);
              return (
                <div
                  key={`ley-${i}`}
                  className="map-pin leyline-pin"
                  style={{
                    left: `${(nx / mapW) * 100}%`,
                    top: `${(ny / mapH) * 100}%`,
                  }}
                  title={`Leyline Node`}
                />
              );
            })}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="world-map-footer">
          {/* Pin legend */}
          <div className="flex items-center gap-4">
            {[
              { label: 'You',      color: '#ffffff', shadow: '#ffffff' },
              { label: 'City',     color: '#ffd700', shadow: '#ffd700' },
              { label: 'Dungeon',  color: '#6c63ff', shadow: '#6c63ff' },
              { label: 'Leyline',  color: '#5de88b', shadow: '#5de88b' },
            ].map(({ label, color, shadow }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${shadow}` }} />
                <span className="font-mono text-[10px] text-gray-400">{label}</span>
              </div>
            ))}
          </div>

          {/* Biome colour legend */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 ml-auto">
            {LEGEND_BIOMES.map((b) => {
              const hex = BIOME_COLORS[b] ?? 0x0a0a1a;
              const color = `#${hex.toString(16).padStart(6, '0')}`;
              return (
                <div key={b} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm border border-black/20" style={{ backgroundColor: color }} />
                  <span className="font-mono text-[9px] text-gray-500 capitalize flex items-center gap-1">
                  {BIOME_ICON[b] && (() => {
                    const Icon = BIOME_ICON[b] as React.ElementType;
                    return <Icon className="w-3 h-3" />;
                  })()} {b}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Season & time */}
        {worldState && (
          <div className="world-map-season-bar">
            <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">
              {worldState.season?.toUpperCase()} · Day {worldState.worldAge ?? 0}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
