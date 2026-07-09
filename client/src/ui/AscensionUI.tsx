import { useState } from 'react';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';
import { GOD_PERKS } from '@shared/types';
import { Crown, X } from 'lucide-react';

export function AscensionUI() {
  const [isOpen, setIsOpen] = useState(false);
  const { player, ascend } = useGameStore();

  // Hook to open from outside
  useState(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('ir:open_ascension', handleOpen);
    return () => window.removeEventListener('ir:open_ascension', handleOpen);
  });

  if (!isOpen || !player) return null;

  const canAscend = player.level! >= 50;

  const handleAscend = (perkId: string) => {
    ascend(perkId);
    setIsOpen(false);
    
    // Dynamically import saveSystem to avoid circular dependency
    import('@game/systems/SaveSystem').then(({ saveSystem }) => {
      saveSystem.save();
      useUIStore.getState().addToast('You have Ascended to Godhood! The realm resets...', 'success');
      
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass p-8 max-w-3xl w-full border-realm-gold" style={{ boxShadow: '0 0 50px rgba(255, 215, 0, 0.2)' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-game text-4xl text-realm-gold tracking-widest text-center w-full flex items-center justify-center gap-4">
            <Crown className="w-10 h-10" /> ASCENSION
          </h2>
          <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors absolute right-8 top-8">
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-realm-text-muted text-center mb-8">
          Reaching the pinnacle of mortal capability allows you to transcend. 
          By ascending, you will be reborn into a new realm, leaving your possessions and mortal power behind. 
          In exchange, you will claim a permanent God Perk.
        </p>

        {!canAscend ? (
          <div className="text-center p-6 bg-red-900/20 border border-red-500/50 rounded text-red-400">
            You must reach Level 50 to Ascend. (Current Level: {player.level})
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {GOD_PERKS.map(perk => {
              const alreadyOwned = player.godPerks?.includes(perk.id);
              return (
                <div 
                  key={perk.id} 
                  className={`p-4 rounded border transition-colors ${alreadyOwned ? 'bg-realm-gold/20 border-realm-gold' : 'bg-black/40 border-realm-border hover:border-realm-gold/50 cursor-pointer'}`}
                  onClick={() => !alreadyOwned && handleAscend(perk.id)}
                >
                  <h3 className="font-game text-xl text-white mb-2">{perk.name}</h3>
                  <p className="text-sm text-realm-text-muted">{perk.desc}</p>
                  {alreadyOwned && <p className="text-xs text-realm-gold mt-2 font-bold uppercase tracking-wider">Already Owned</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
