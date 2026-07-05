import { useGameStore } from '@stores/useGameStore';
import { leylineSystem } from '@game/systems/LeylineSystem';
import { BIOME_COLORS } from '@game/systems/WorldGenerator';
import type { BiomeType } from '@shared/types';

export function WorldMapUI({ onClose }: { onClose: () => void }) {
  const { worldState, player } = useGameStore();
  const leylineNodes = leylineSystem.getNodes();

  const cities = worldState?.cities ?? [];
  const width = worldState?.width ?? 128;
  const height = worldState?.height ?? 128;

  const playerX = player?.x ? Math.floor(player.x / 32) : Math.floor(width / 2);
  const playerY = player?.y ? Math.floor(player.y / 32) : Math.floor(height / 2);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass p-6 w-full max-w-2xl mx-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-realm-border pb-3 mb-4">
          <h2 className="font-game text-xl text-white">🗺️ Realm World Map</h2>
          <button onClick={onClose} className="text-realm-text-muted hover:text-white">✕</button>
        </div>

        {/* Map View Box */}
        <div className="relative w-full aspect-video bg-realm-bg border border-realm-border rounded-xl overflow-hidden mb-4 flex items-center justify-center">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#6c63ff_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Map Legend & Overlay Pins */}
          <div className="relative z-10 w-full h-full p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start text-xs font-mono">
              <span className="bg-realm-surface/80 px-2.5 py-1 rounded border border-realm-border text-realm-gold">
                SEED: {worldState?.seed ?? 'Unknown'}
              </span>
              <span className="bg-realm-surface/80 px-2.5 py-1 rounded border border-realm-border text-white">
                POS: X:{playerX} Y:{playerY}
              </span>
            </div>

            {/* Simulated city and node markers */}
            <div className="absolute inset-0 flex items-center justify-center">
              {cities.map((city) => (
                <div
                  key={city.id}
                  className="absolute flex flex-col items-center pointer-events-auto cursor-pointer group"
                  style={{
                    left: `${(city.x / width) * 100}%`,
                    top: `${(city.y / height) * 100}%`,
                  }}
                >
                  <span className="text-lg">🏰</span>
                  <span className="text-[10px] font-game text-realm-gold bg-black/60 px-1.5 py-0.5 rounded opacity-80 group-hover:opacity-100">
                    {city.name}
                  </span>
                </div>
              ))}

              {leylineNodes.map((node) => (
                <div
                  key={node.id}
                  className="absolute text-sm pointer-events-auto"
                  style={{
                    left: `${(node.x / (width * 32)) * 100}%`,
                    top: `${(node.y / (height * 32)) * 100}%`,
                  }}
                  title={`Leyline Node (${node.type})`}
                >
                  ⚡
                </div>
              ))}

              {/* Player Pin */}
              <div
                className="absolute text-xl font-bold animate-bounce"
                style={{
                  left: `${(playerX / width) * 100}%`,
                  top: `${(playerY / height) * 100}%`,
                }}
              >
                📍
              </div>
            </div>

            {/* Biome Legend */}
            <div className="flex flex-wrap gap-2 text-[10px] font-mono justify-center bg-black/60 backdrop-blur p-2 rounded-lg">
              {(['ocean', 'beach', 'plains', 'forest', 'desert', 'snow', 'volcano', 'swamp'] as BiomeType[]).map((biome) => (
                <div key={biome} className="flex items-center gap-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: '#' + BIOME_COLORS[biome].toString(16).padStart(6, '0') }}
                  />
                  <span className="capitalize text-gray-300">{biome}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button className="btn-secondary w-full text-xs" onClick={onClose}>
          Close Map
        </button>
      </div>
    </div>
  );
}
