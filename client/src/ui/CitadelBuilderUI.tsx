import React, { useState } from 'react';
import { useUIStore } from '@stores/useUIStore';
import { useGameStore } from '@stores/useGameStore';
import type { CitadelStructureType } from '@shared/types';
import { citadelSystem } from '@game/systems/CitadelSystem';

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

  const types: {type: CitadelStructureType, label: string, icon: string}[] = [
    { type: 'wall', label: 'Stone Wall', icon: '🧱' },
    { type: 'gate', label: 'Iron Gate', icon: '🚪' },
    { type: 'turret', label: 'Ballista', icon: '🏹' },
    { type: 'energy_hub', label: 'Energy Hub', icon: '🔮' },
    { type: 'shield', label: 'Force Shield', icon: '🛡️' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 150,
        right: 20,
        background: 'rgba(20, 20, 25, 0.95)',
        border: '2px solid #5a5a6e',
        borderRadius: '8px',
        padding: '10px',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'auto',
        fontFamily: 'Cinzel, serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold' }}>Citadel Builder</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => citadelSystem.triggerSiege()}
            style={{
              background: '#8a2be2',
              border: 'none',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'Cinzel, serif',
              fontWeight: 'bold',
            }}
          >
            Trigger Siege
          </button>
          <button
            onClick={handleToggleBuildMode}
            style={{
              background: buildMode ? '#ff4444' : '#44ff44',
              border: 'none',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'Cinzel, serif',
              fontWeight: 'bold',
            }}
          >
            {buildMode ? 'Exit Build Mode' : 'Enter Build Mode'}
          </button>
        </div>
      </div>

      {buildMode && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          {types.map((t) => (
            <div
              key={t.type}
              onClick={() => handleSelectType(t.type)}
              style={{
                padding: '8px',
                background: selectedType === t.type ? '#5a5a6e' : '#2a2a35',
                border: selectedType === t.type ? '1px solid #ffd700' : '1px solid #444',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '60px'
              }}
            >
              <span style={{ fontSize: '24px' }}>{t.icon}</span>
              <span style={{ fontSize: '10px', textAlign: 'center', marginTop: '4px' }}>{t.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
