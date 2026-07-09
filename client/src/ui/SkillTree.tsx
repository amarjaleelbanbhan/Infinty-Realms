import { useState } from 'react';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';
import type { SkillNode, SubclassType } from '@shared/types';

const MOCK_SKILLS: SkillNode[] = [
  { id: 's1', name: 'Arcane Strike', description: 'Deals basic magic damage.', tier: 1, cost: 1, prerequisites: [], icon: '🔮' },
  { id: 's2', name: 'Frost Nova', description: 'Freezes enemies in an area.', tier: 2, cost: 2, prerequisites: ['s1'], icon: '❄️' },
  { id: 's3', name: 'Fireball', description: 'Massive AoE fire damage.', tier: 2, cost: 2, prerequisites: ['s1'], icon: '🔥' },
  { id: 's4', name: 'Meteor Swarm', description: 'Devastating ultimate ability.', tier: 3, cost: 5, prerequisites: ['s3'], icon: '☄️' },
];

export function SkillTree() {
  const { isSkillTreeOpen, closeSkillTree } = useUIStore();
  const { player } = useGameStore();
  const [selectedSubclass, setSelectedSubclass] = useState<SubclassType | null>(player?.subclass ?? null);

  if (!isSkillTreeOpen) return null;

  return (
    <div className="modal-overlay" onClick={closeSkillTree}>
      <div
        className="modal-content glass w-full max-w-4xl mx-4 h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-realm-border bg-realm-surface/50">
          <div>
            <h2 className="font-game text-2xl text-white tracking-widest animate-pulse">🌟 Constellation</h2>
            <p className="text-sm font-ui text-realm-text-muted mt-1">Unlock your true potential.</p>
          </div>
          <button onClick={closeSkillTree} className="text-realm-text-muted hover:text-white text-xl">✕</button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Subclass Selection sidebar */}
          <div className="w-64 border-r border-realm-border p-4 overflow-y-auto">
            <h3 className="font-game text-sm text-realm-gold uppercase mb-4 tracking-widest">Paths</h3>
            {['Elementalist', 'Necromancer', 'Paladin', 'Berserker', 'Assassin'].map(sub => (
              <button
                key={sub}
                onClick={() => setSelectedSubclass(sub as SubclassType)}
                className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-all font-game tracking-wider text-sm border ${
                  selectedSubclass === sub
                    ? 'border-realm-accent bg-realm-accent/20 text-white shadow-[0_0_15px_rgba(108,99,255,0.3)]'
                    : 'border-transparent text-realm-text-muted hover:bg-realm-surface hover:text-white'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Skill Canvas */}
          <div className="flex-1 bg-black/40 relative overflow-hidden p-8 flex items-center justify-center">
            {/* Background stars effect */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            
            {selectedSubclass ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center gap-12">
                {/* Mock Tree visualization */}
                <div className="flex justify-center w-full">
                  <SkillNodeUI node={MOCK_SKILLS[0]} unlocked={true} />
                </div>
                <div className="flex justify-center gap-24 w-full relative">
                  {/* Connecting lines mocked */}
                  <div className="absolute top-[-3rem] left-1/2 w-px h-12 bg-realm-accent/50 origin-top -rotate-[35deg]"></div>
                  <div className="absolute top-[-3rem] left-1/2 w-px h-12 bg-realm-accent/50 origin-top rotate-[35deg]"></div>
                  
                  <SkillNodeUI node={MOCK_SKILLS[1]} unlocked={false} />
                  <SkillNodeUI node={MOCK_SKILLS[2]} unlocked={false} />
                </div>
                <div className="flex justify-center w-full relative">
                  <div className="absolute top-[-3rem] left-[65%] w-px h-12 bg-realm-border origin-top -rotate-[20deg]"></div>
                  <div className="ml-48">
                    <SkillNodeUI node={MOCK_SKILLS[3]} unlocked={false} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center font-game text-realm-text-muted text-lg animate-pulse">
                Select a path to view its constellation.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillNodeUI({ node, unlocked }: { node: SkillNode, unlocked: boolean }) {
  return (
    <div 
      className={`relative rounded-full w-16 h-16 flex items-center justify-center text-3xl cursor-pointer transition-all duration-300 group
        ${unlocked 
          ? 'bg-realm-accent/20 border-2 border-realm-accent shadow-[0_0_20px_rgba(108,99,255,0.6)]' 
          : 'bg-realm-surface border border-realm-border hover:border-white/50 opacity-60'}`}
    >
      {node.icon}
      
      {/* Tooltip */}
      <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-48 bg-realm-card border border-realm-border rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
        <div className="font-game text-white text-sm mb-1">{node.name}</div>
        <div className="text-xs font-ui text-realm-text-muted mb-2">{node.description}</div>
        <div className="text-xs font-mono text-realm-gold">Cost: {node.cost} SP</div>
      </div>
    </div>
  );
}
