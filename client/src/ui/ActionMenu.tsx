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
        className="fixed top-8 right-8 z-40 w-14 h-14 premium-glass premium-border flex items-center justify-center hover:bg-realm-accent/20 transition-all hover:scale-110 shadow-lg text-white"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* ── Modal Grid ── */}
      {isOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center animate-in fade-in bg-black/80 backdrop-blur-md" onClick={() => setIsOpen(false)}>
          <div 
            className="premium-glass premium-border p-8 rounded-3xl shadow-[0_0_50px_rgba(108,99,255,0.15)] max-w-2xl w-full animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-game text-4xl text-center text-transparent bg-clip-text bg-gradient-to-r from-white via-realm-accent to-white mb-8 tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
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
                  className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-black/40 border border-white/10 hover:border-realm-accent hover:bg-realm-accent/20 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_20px_rgba(108,99,255,0.4)] text-white/50 hover:text-white group relative overflow-hidden"
                >
                  <item.icon className="w-10 h-10 mb-1 group-hover:scale-110 transition-transform duration-300" strokeWidth={1} />
                  <span className="font-mono text-[10px] text-white/80 group-hover:text-realm-accent font-bold uppercase tracking-[0.2em]">{item.label}</span>
                  <div className="absolute inset-0 bg-gradient-to-t from-realm-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
