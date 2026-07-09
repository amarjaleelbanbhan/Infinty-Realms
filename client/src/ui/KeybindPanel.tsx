import { useState } from 'react';
import { Compass, FastForward, Sword, Sparkles, MessageCircle, Backpack, BookOpen, Map, Pause, Keyboard } from 'lucide-react';

const CONTROLS = [
  { keys: ['W', 'A', 'S', 'D'], label: 'Move', icon: Compass },
  { keys: ['↑', '←', '↓', '→'], label: 'Move (arrows)', icon: Compass },
  { keys: ['F'], label: 'Sprint / Walk toggle', icon: FastForward },
  { keys: ['SPACE'], label: 'Attack', icon: Sword },
  { keys: ['1', '2', '3', '4'], label: 'Cast Spells 1-4', icon: Sparkles },
  { keys: ['E'], label: 'Interact / Talk', icon: MessageCircle },
  { keys: ['I'], label: 'Inventory', icon: Backpack },
  { keys: ['Q'], label: 'Quest Log', icon: BookOpen },
  { keys: ['M'], label: 'World Map', icon: Map },
  { keys: ['ESC'], label: 'Pause', icon: Pause },
];

export function KeybindPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-20 flex flex-col items-end gap-2">
      {open && (
        <div className="glass border border-white/10 rounded-2xl p-5 w-64 animate-slide-up shadow-2xl">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
            <Keyboard className="w-4 h-4 text-realm-accent" />
            <h3 className="font-game text-xs text-white uppercase tracking-widest">Controls</h3>
          </div>
          <div className="space-y-3">
            {CONTROLS.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-ui text-white/60 shrink-0 flex items-center gap-2">
                  <c.icon className="w-3 h-3 text-white/40" /> {c.label}
                </span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {c.keys.map((k) => (
                    <kbd key={k}>{k}</kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="font-mono text-[9px] text-white/30 text-center">
              Infinity Realms
            </p>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="glass px-3 py-1.5 text-xs font-mono text-white/50 border border-white/10 hover:text-white hover:border-realm-accent transition-all duration-200 flex items-center gap-2 rounded-xl shadow-lg"
        title="Show keyboard controls"
      >
        <Keyboard className="w-4 h-4" />
        {open ? 'Hide Keys' : 'Controls'}
      </button>
    </div>
  );
}
