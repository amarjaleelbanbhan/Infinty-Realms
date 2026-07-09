import React, { useState } from 'react';
import { useUIStore } from '@stores/useUIStore';
import { useGameStore } from '@stores/useGameStore';
import type { CitadelStructureType } from '@shared/types';
import { citadelSystem } from '@game/systems/CitadelSystem';
import { BrickWall, DoorOpen, Crosshair, Sparkles, Shield, Castle } from 'lucide-react';

export const CitadelBuilderUI: React.FC = () => {
  const { player } = useGameStore();
  const { addToast } = useUIStore();

  const [buildMode, setBuildMode] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<CitadelStructureType>('wall');

  // For sandbox, we assume the player is in a guild or can just build freely for testing
  const guildId = player?.guildId || 'test-guild';

  const handleToggleBuildMode = () => {
    setBuildMode(!buildMode);
    
    // Dispatch event to let WorldScene know we are in build mode
    window.dispatchEvent(new CustomEvent('ir:citadel_build_mode', { detail: { active: !buildMode, selectedType, guildId } }));
  };

  const handleSelectType = (type: CitadelStructureType) => {
    setSelectedType(type);
    if (buildMode) {
      window.dispatchEvent(new CustomEvent('ir:citadel_build_mode', { detail: { active: true, selectedType: type, guildId } }));
    }
  };

  const types: {type: CitadelStructureType, label: string, icon: React.ElementType}[] = [
    { type: 'wall', label: 'Stone Wall', icon: BrickWall },
    { type: 'gate', label: 'Iron Gate', icon: DoorOpen },
    { type: 'turret', label: 'Ballista', icon: Crosshair },
    { type: 'energy_hub', label: 'Energy Hub', icon: Sparkles },
    { type: 'shield', label: 'Force Shield', icon: Shield },
  ];

  return (
    <div className="absolute bottom-[150px] right-5 z-20 pointer-events-auto">
      <div className="glass p-4 rounded-xl border border-white/10 flex flex-col gap-3 shadow-2xl min-w-[300px]">
        <div className="flex justify-between items-center pb-2 border-b border-white/10">
          <span className="font-game text-sm text-white flex items-center gap-2">
            <Castle className="w-4 h-4 text-realm-accent" /> Citadel Builder
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => citadelSystem.triggerSiege()}
              className="px-2.5 py-1 text-[10px] font-game tracking-widest bg-realm-hp/80 hover:bg-realm-hp text-white rounded transition-colors"
            >
              Trigger Siege
            </button>
            <button
              onClick={handleToggleBuildMode}
              className={`px-2.5 py-1 text-[10px] font-game tracking-widest text-white rounded transition-colors ${buildMode ? 'bg-red-500/80 hover:bg-red-500' : 'bg-realm-accent/80 hover:bg-realm-accent'}`}
            >
              {buildMode ? 'Exit Build Mode' : 'Enter Build Mode'}
            </button>
          </div>
        </div>

        {buildMode && (
          <div className="flex gap-2 mt-2">
            {types.map((t) => (
              <div
                key={t.type}
                onClick={() => handleSelectType(t.type)}
                className={`flex-1 p-2 flex flex-col items-center gap-2 rounded-lg cursor-pointer border transition-all ${selectedType === t.type ? 'bg-realm-accent/20 border-realm-accent text-white shadow-glow' : 'bg-black/30 border-white/10 text-white/50 hover:bg-black/50 hover:text-white'}`}
              >
                <t.icon className="w-6 h-6" />
                <span className="text-[9px] font-ui text-center leading-tight">{t.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
