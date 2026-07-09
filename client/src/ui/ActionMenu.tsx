import { useState } from 'react';
import { useUIStore } from '@stores/useUIStore';

interface ActionMenuProps {
  onOpenShop: () => void;
  onOpenHousing: () => void;
  onOpenGuild: () => void;
  onOpenMarket: () => void;
  onOpenJournal: () => void;
  onOpenSpells: () => void;
  onOpenMap: () => void;
  onOpenCreator: () => void;
}

export function ActionMenu(props: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { label: 'Map', icon: '🗺️', action: props.onOpenMap },
    { label: 'Journal', icon: '📖', action: props.onOpenJournal },
    { label: 'Guild', icon: '🏰', action: props.onOpenGuild },
    { label: 'Housing', icon: '🏡', action: props.onOpenHousing },
    { label: 'Bazaar', icon: '🏪', action: props.onOpenMarket },
    { label: 'Auction', icon: '🏛️', action: () => useUIStore.getState().openAuctionHouse() },
    { label: 'Spells', icon: '🔮', action: props.onOpenSpells },
    { label: 'Skills', icon: '🌟', action: () => useUIStore.getState().openSkillTree() },
    { label: 'God Spells', icon: '🌌', action: () => window.dispatchEvent(new CustomEvent('ir:open_intervention')) },
    { label: 'Ascend', icon: '👑', action: () => window.dispatchEvent(new CustomEvent('ir:open_ascension')) },
    { label: 'Arena', icon: '⚔️', action: () => window.dispatchEvent(new CustomEvent('ir:open_arena')) },
    { label: 'Shop', icon: '💎', action: props.onOpenShop },
    { label: 'Architect', icon: '✨', action: props.onOpenCreator },
  ];

  return (
    <>
      {/* ── Floating Menu Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 right-8 z-40 w-14 h-14 glass flex items-center justify-center rounded-full hover:bg-realm-accent/20 transition-all hover:scale-110 shadow-lg"
      >
        <span className="text-2xl">{isOpen ? '✖️' : '☰'}</span>
      </button>

      {/* ── Modal Grid ── */}
      {isOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center animate-in fade-in bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div 
            className="glass p-8 rounded-3xl shadow-2xl max-w-2xl w-full border-white/10 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-game text-3xl text-center text-white mb-8 tracking-widest drop-shadow-[0_0_15px_rgba(108,99,255,0.8)]">
              REALM FEATURES
            </h2>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {actions.map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    item.action();
                    setIsOpen(false);
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-realm-accent hover:bg-realm-accent/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_5px_15px_rgba(108,99,255,0.4)]"
                >
                  <span className="text-3xl">{item.icon}</span>
                  <span className="font-mono text-xs text-white/90 font-bold uppercase tracking-wider">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
