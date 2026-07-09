import { useState } from 'react';
import { useUIStore } from '@stores/useUIStore';
import { Map, BookOpen, Castle, Home, Store, Landmark, Sparkles, Star, Cloudy, Crown, Swords, Gem, Palette, Menu, X } from 'lucide-react';

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
    { label: 'Map', icon: Map, action: props.onOpenMap },
    { label: 'Journal', icon: BookOpen, action: props.onOpenJournal },
    { label: 'Guild', icon: Castle, action: props.onOpenGuild },
    { label: 'Housing', icon: Home, action: props.onOpenHousing },
    { label: 'Bazaar', icon: Store, action: props.onOpenMarket },
    { label: 'Auction', icon: Landmark, action: () => useUIStore.getState().openAuctionHouse() },
    { label: 'Spells', icon: Sparkles, action: props.onOpenSpells },
    { label: 'Skills', icon: Star, action: () => useUIStore.getState().openSkillTree() },
    { label: 'God Spells', icon: Cloudy, action: () => window.dispatchEvent(new CustomEvent('ir:open_intervention')) },
    { label: 'Ascend', icon: Crown, action: () => window.dispatchEvent(new CustomEvent('ir:open_ascension')) },
    { label: 'Arena', icon: Swords, action: () => window.dispatchEvent(new CustomEvent('ir:open_arena')) },
    { label: 'Shop', icon: Gem, action: props.onOpenShop },
    { label: 'Architect', icon: Palette, action: props.onOpenCreator },
  ];

  return (
    <>
      {/* ── Floating Menu Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 right-8 z-40 w-14 h-14 glass flex items-center justify-center rounded-full hover:bg-realm-accent/20 transition-all hover:scale-110 shadow-lg text-white"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-realm-accent hover:bg-realm-accent/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_5px_15px_rgba(108,99,255,0.4)] text-white/70 hover:text-white"
                >
                  <item.icon className="w-8 h-8 mb-1" strokeWidth={1.5} />
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
