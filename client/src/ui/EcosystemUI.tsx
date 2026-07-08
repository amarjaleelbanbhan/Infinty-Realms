import React from 'react';
import { useGameStore } from '../stores/useGameStore';
import { useUIStore } from '../stores/useUIStore';

export const EcosystemUI: React.FC = () => {
  const currentBiome = useUIStore((s) => s.currentBiome);
  const biomeDepletion = useGameStore((s) => s.worldState?.biomeDepletion);

  if (!currentBiome || !biomeDepletion) return null;
  if (currentBiome === 'dungeon' || currentBiome === 'ocean') return null;

  const health = biomeDepletion[currentBiome as keyof typeof biomeDepletion] ?? 100;
  
  let statusText = "Healthy";
  let color = "bg-green-500";
  if (health < 50) {
    statusText = "Depleted (Low Spawns)";
    color = "bg-yellow-500";
  }
  if (health < 20) {
    statusText = "Barren (Soil Erosion)";
    color = "bg-red-500";
  }

  return (
    <div className="absolute top-20 right-4 w-64 pointer-events-auto">
      <div className="bg-realm-panel/90 backdrop-blur-md border border-realm-border rounded-lg p-3 shadow-xl">
        <h3 className="text-sm font-bold text-realm-text uppercase tracking-wider mb-2">
          {currentBiome} Ecosystem
        </h3>
        
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-realm-text-muted">{statusText}</span>
          <span className="text-xs font-mono text-realm-text">{Math.floor(health)}%</span>
        </div>
        
        <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out ${color}`} 
            style={{ width: `${health}%` }}
          />
        </div>
      </div>
    </div>
  );
};
