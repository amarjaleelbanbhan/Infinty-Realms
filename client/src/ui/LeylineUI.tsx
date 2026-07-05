import { useState, useEffect } from 'react';
import { leylineSystem } from '@game/systems/LeylineSystem';
import { useUIStore } from '@stores/useUIStore';
import { useGameStore } from '@stores/useGameStore';
import type { LeylineNode, LeylineNodeType } from '@shared/types';

export function LeylineUI() {
  const { currentScreen, addToast } = useUIStore();
  const { player } = useGameStore();
  const [nodes, setNodes] = useState<LeylineNode[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setNodes([...leylineSystem.getNodes()]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (currentScreen !== 'game') return null;

  const handleBuildNode = (type: LeylineNodeType) => {
    if (!player) return;
    const node = leylineSystem.placeNode(player.x, player.y, type, 'plains');
    if (node) setNodes([...leylineSystem.getNodes()]);
  };

  const handleHarvest = (nodeId: string) => {
    leylineSystem.harvestNode(nodeId);
    setNodes([...leylineSystem.getNodes()]);
  };

  return (
    <>
      {/* HUD Quick Button for Leylines */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-64 z-20 glass px-3 py-1.5 text-xs font-mono text-realm-gold border border-realm-gold/40 hover:bg-realm-gold/10 transition-colors flex items-center gap-1.5"
      >
        <span>⚡ Leyline Nodes ({nodes.length})</span>
      </button>

      {/* Leyline Modal */}
      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div
            className="modal-content glass p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-realm-border pb-3 mb-4">
              <h2 className="font-game text-xl text-white">⚡ Leyline Energy Network</h2>
              <button onClick={() => setIsOpen(false)} className="text-realm-text-muted hover:text-white">✕</button>
            </div>

            <p className="text-xs text-realm-text-muted font-ui mb-4">
              Construct magical nodes to passively extract elemental essence from the realm ley lines.
            </p>

            {/* Build Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { type: 'essence_collector', label: 'Essence Node', rate: '+5/m', cost: 50 },
                { type: 'mana_relay', label: 'Mana Relay', rate: '+10/m', cost: 120 },
                { type: 'elemental_forge', label: 'Arcane Forge', rate: '+20/m', cost: 300 },
              ].map((b) => (
                <button
                  key={b.type}
                  onClick={() => handleBuildNode(b.type as LeylineNodeType)}
                  className="bg-realm-surface border border-realm-border hover:border-realm-gold p-3 rounded-lg text-left transition-all"
                >
                  <div className="text-xs font-game text-white mb-1">{b.label}</div>
                  <div className="font-mono text-xs text-realm-xp">{b.rate}</div>
                  <div className="font-mono text-xs text-realm-gold mt-1">{b.cost}g</div>
                </button>
              ))}
            </div>

            {/* Active Nodes List */}
            <h3 className="font-game text-xs text-realm-text-muted uppercase tracking-wider mb-2">
              Active Nodes ({nodes.length})
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
              {nodes.map((n) => (
                <div key={n.id} className="bg-realm-bg border border-realm-border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="font-game text-xs text-white capitalize">{n.type.replace('_', ' ')}</div>
                    <div className="font-mono text-xs text-realm-xp">Yield: {n.accumulatedEssence} Essence</div>
                  </div>
                  <button
                    onClick={() => handleHarvest(n.id)}
                    disabled={n.accumulatedEssence === 0}
                    className="btn-gold text-xs py-1 px-3 disabled:opacity-40"
                  >
                    Harvest
                  </button>
                </div>
              ))}

              {nodes.length === 0 && (
                <p className="text-xs font-ui text-realm-text-muted text-center py-4">No active leyline nodes. Build one above!</p>
              )}
            </div>

            <button className="btn-secondary w-full text-xs" onClick={() => setIsOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
