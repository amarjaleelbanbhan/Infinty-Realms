import { useState } from 'react';
import { useGuildStore } from '@stores/useGuildStore';
import { useUIStore } from '@stores/useUIStore';

export function GuildUI({ onClose }: { onClose: () => void }) {
  const { guild, createGuild, depositVault, leaveGuild } = useGuildStore();
  const [nameInput, setNameInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [depositAmount, setDepositAmount] = useState(50);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !tagInput.trim()) return;
    createGuild(nameInput.trim(), tagInput.trim());
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-realm-border pb-3 mb-4">
          <h2 className="font-game text-xl text-white">🏰 Guild Hall</h2>
          <button onClick={onClose} className="text-realm-text-muted hover:text-white">✕</button>
        </div>

        {guild ? (
          <div>
            {/* Header info */}
            <div className="bg-realm-surface border border-realm-accent/40 rounded-xl p-4 mb-4 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs text-realm-gold font-bold bg-realm-gold/10 px-2 py-0.5 rounded border border-realm-gold/30 mr-2">
                  [{guild.tag}]
                </span>
                <span className="font-game text-lg text-white">{guild.name}</span>
                <div className="text-xs text-realm-text-muted mt-1">Level {guild.level} Guild</div>
              </div>
              <div className="text-right font-mono text-xs">
                <div className="text-realm-gold font-bold">💰 {guild.vaultGold}g</div>
                <div className="text-realm-text-muted">Vault</div>
              </div>
            </div>

            {/* Perks */}
            <div className="mb-4">
              <h3 className="font-game text-xs text-realm-text-muted uppercase tracking-wider mb-2">Guild Perks</h3>
              <div className="flex flex-wrap gap-2">
                {guild.perks.map((p, i) => (
                  <span key={i} className="bg-realm-bg border border-realm-xp/30 text-realm-xp font-mono text-xs px-2.5 py-1 rounded-full">
                    ✨ {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Members */}
            <div className="mb-4">
              <h3 className="font-game text-xs text-realm-text-muted uppercase tracking-wider mb-2">Members ({guild.members.length})</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {guild.members.map((m) => (
                  <div key={m.playerId} className="flex items-center justify-between bg-realm-bg rounded px-3 py-1.5 text-xs font-ui">
                    <span className="text-white">{m.name}</span>
                    <span className="font-mono capitalize text-realm-accent">{m.role}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Deposit Vault */}
            <div className="p-3 bg-realm-surface rounded-lg border border-realm-border mb-4 flex items-center gap-2">
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-24 bg-realm-bg border border-realm-border rounded px-2 py-1 font-mono text-xs text-white"
              />
              <button
                onClick={() => depositVault(depositAmount)}
                className="btn-gold text-xs py-1.5 flex-1"
              >
                Deposit to Vault
              </button>
            </div>

            <button onClick={leaveGuild} className="btn-secondary w-full text-xs text-realm-hp border-realm-hp/30 hover:bg-realm-hp/10">
              Leave Guild
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-realm-text-muted uppercase mb-1">Guild Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Knights of the Leyline"
                maxLength={30}
                className="w-full bg-realm-bg border border-realm-border rounded-lg px-3 py-2 font-ui text-sm text-white focus:outline-none focus:border-realm-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-realm-text-muted uppercase mb-1">Guild Tag (3-4 Chars)</label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value.toUpperCase())}
                placeholder="LEY"
                maxLength={4}
                className="w-full bg-realm-bg border border-realm-border rounded-lg px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-realm-accent"
              />
            </div>

            <button type="submit" className="btn-gold w-full text-sm py-2.5">
              🏰 Form Guild
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
