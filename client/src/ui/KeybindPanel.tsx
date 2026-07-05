import { useState } from 'react';

const CONTROLS = [
  { keys: ['W', 'A', 'S', 'D'], label: 'Move', icon: '🧭' },
  { keys: ['↑', '←', '↓', '→'], label: 'Move (arrows)', icon: '🧭' },
  { keys: ['F'], label: 'Sprint / Walk toggle', icon: '💨' },
  { keys: ['SPACE'], label: 'Attack', icon: '⚔️' },
  { keys: ['E'], label: 'Interact / Talk', icon: '💬' },
  { keys: ['I'], label: 'Inventory', icon: '🎒' },
  { keys: ['Q'], label: 'Quest Log', icon: '📜' },
  { keys: ['M'], label: 'World Map', icon: '🗺️' },
  { keys: ['ESC'], label: 'Pause', icon: '⏸️' },
];

export function KeybindPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-20 flex flex-col items-end gap-2">
      {open && (
        <div className="glass-dark border border-realm-border rounded-xl p-4 w-60 animate-slide-up shadow-xl">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-realm-border">
            <span className="text-sm select-none">⌨️</span>
            <h3 className="font-game text-[11px] text-white uppercase tracking-widest">Controls</h3>
          </div>
          <div className="space-y-2">
            {CONTROLS.map((c) => (
              <div key={c.label} className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-ui text-realm-text-muted shrink-0">
                  {c.icon} {c.label}
                </span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {c.keys.map((k) => (
                    <kbd key={k}>{k}</kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-realm-border">
            <p className="font-mono text-[9px] text-gray-600 text-center">
              Leyline Seeker · Infinity Realms
            </p>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="glass px-3 py-1.5 text-[11px] font-mono text-realm-text-muted border border-realm-border hover:text-white hover:border-realm-accent transition-all duration-200 flex items-center gap-1.5 rounded-lg"
        title="Show keyboard controls"
      >
        <span className="text-xs">⌨️</span>
        {open ? 'Hide Keys' : 'Controls'}
      </button>
    </div>
  );
}
