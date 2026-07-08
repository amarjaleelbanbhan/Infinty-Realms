import { useState } from 'react';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';

const INTERVENTIONS = [
  { id: 'healing_rain', name: 'Healing Rain', icon: '🌧️', desc: 'Restores HP for all players in the realm.' },
  { id: 'gold_blessing', name: 'Midas Touch', desc: 'Showers the land with gold coins.', icon: '💰' },
  { id: 'exp_surge', name: 'Wisdom Surge', desc: 'Grants temporary experience boost to all.', icon: '✨' },
];

export function GodInterventionUI() {
  const [isOpen, setIsOpen] = useState(false);
  const { player, castGodIntervention } = useGameStore();

  useState(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('ir:open_intervention', handleOpen);
    return () => window.removeEventListener('ir:open_intervention', handleOpen);
  });

  if (!isOpen || !player) return null;

  const isAscended = (player.ascensions || 0) > 0;

  const handleCast = (type: string) => {
    castGodIntervention(type);
    setIsOpen(false);
    useUIStore.getState().addToast(`You cast ${type.replace('_', ' ')}!`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass p-8 max-w-2xl w-full border-realm-mana" style={{ boxShadow: '0 0 40px rgba(108, 99, 255, 0.2)' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-game text-3xl text-realm-mana">God Interventions</h2>
          <button onClick={() => setIsOpen(false)} className="text-white hover:text-realm-mana">
            ✕
          </button>
        </div>

        {!isAscended ? (
          <div className="text-center p-6 text-realm-text-muted">
            Only Ascended beings can interfere with the mortal realms.
          </div>
        ) : (
          <>
            <p className="text-realm-text-muted mb-6">
              Use your ascended power to bless the world. These global spells will affect all players in the current realm.
            </p>
            <div className="grid grid-cols-1 gap-4">
              {INTERVENTIONS.map(inv => (
                <div key={inv.id} className="p-4 bg-black/40 border border-realm-border rounded flex justify-between items-center hover:border-realm-mana/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{inv.icon}</div>
                    <div>
                      <h3 className="font-bold text-white">{inv.name}</h3>
                      <p className="text-sm text-realm-text-muted">{inv.desc}</p>
                    </div>
                  </div>
                  <button className="btn-primary text-sm px-4" onClick={() => handleCast(inv.id)}>Cast</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
