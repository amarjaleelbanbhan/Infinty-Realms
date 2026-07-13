import { useState, useEffect } from 'react';
import { useGuildStore } from '@stores/useGuildStore';
import { Castle, Users, Search, Loader, X } from 'lucide-react';
import { GuildWarUI } from './GuildWarUI';

export function GuildUI({ onClose }: { onClose: () => void }) {
  const { guild, guilds, isLoading, createGuild, joinGuild, leaveGuild, loadGuilds } = useGuildStore();
  const [activeTab, setActiveTab] = useState<'info' | 'browse' | 'warfare'>('info');
  const [nameInput, setNameInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (activeTab === 'browse') loadGuilds();
  }, [activeTab, loadGuilds]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !tagInput.trim()) return;
    createGuild(nameInput.trim(), tagInput.trim());
  };

  const filtered = guilds.filter(
    g => g.name.toLowerCase().includes(searchInput.toLowerCase()) ||
      g.tag.toLowerCase().includes(searchInput.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <h2 className="font-game text-2xl text-white flex items-center gap-3">
            <Castle className="w-6 h-6 text-realm-accent" /> Guild Hall
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 mb-5">
          {!guild && (
            <button
              className={`px-3 py-1 text-xs font-game tracking-wider rounded ${activeTab === 'browse' ? 'bg-realm-accent text-white' : 'bg-black/30 text-realm-text-muted'}`}
              onClick={() => setActiveTab('browse')}
            >
              Browse Guilds
            </button>
          )}
          {guild && (
            <>
              <button
                className={`px-3 py-1 text-xs font-game tracking-wider rounded ${activeTab === 'info' ? 'bg-realm-accent text-white' : 'bg-black/30 text-realm-text-muted'}`}
                onClick={() => setActiveTab('info')}
              >
                My Guild
              </button>
              <button
                className={`px-3 py-1 text-xs font-game tracking-wider rounded ${activeTab === 'warfare' ? 'bg-realm-hp/80 text-white' : 'bg-black/30 text-realm-text-muted'}`}
                onClick={() => setActiveTab('warfare')}
              >
                Warfare
              </button>
            </>
          )}
        </div>

        {/* My Guild Info */}
        {guild && activeTab === 'info' && (
          <div>
            <div className="bg-realm-surface border border-realm-accent/40 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-realm-gold font-bold bg-realm-gold/10 px-2 py-0.5 rounded border border-realm-gold/30 mr-2">
                    [{guild.tag}]
                  </span>
                  <span className="font-game text-lg text-white">{guild.name}</span>
                  <div className="text-xs text-realm-text-muted mt-1">Level {guild.level} Guild</div>
                </div>
              </div>
            </div>

            <button
              onClick={leaveGuild}
              disabled={isLoading}
              className="btn-secondary w-full text-xs text-realm-hp border-realm-hp/30 hover:bg-realm-hp/10 mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader className="w-3 h-3 animate-spin" /> : null}
              Leave Guild
            </button>
          </div>
        )}

        {/* Warfare Tab */}
        {guild && activeTab === 'warfare' && (
          <GuildWarUI guildId={guild.id} />
        )}

        {/* Browse Guilds */}
        {!guild && activeTab === 'browse' && (
          <div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-realm-text-muted" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search guilds…"
                className="w-full bg-realm-bg border border-realm-border rounded-lg pl-9 pr-3 py-2 font-ui text-sm text-white focus:outline-none focus:border-realm-accent"
              />
            </div>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-realm-accent" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-realm-text-muted text-sm py-8 font-ui">No guilds found. Create one!</p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar">
                {filtered.map(g => (
                  <div key={g.id} className="flex items-center justify-between bg-realm-surface border border-realm-border rounded-lg px-3 py-2">
                    <div>
                      <span className="font-mono text-xs text-realm-gold mr-2">[{g.tag}]</span>
                      <span className="font-ui text-sm text-white">{g.name}</span>
                      <div className="text-xs text-realm-text-muted">Lv.{g.level}</div>
                    </div>
                    <button
                      onClick={() => joinGuild(g.id)}
                      disabled={isLoading}
                      className="btn-primary text-xs py-1 px-3 flex items-center gap-1"
                    >
                      <Users className="w-3 h-3" /> Join
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Guild form (shown when no guild AND browsing) */}
        {!guild && activeTab === 'browse' && (
          <form onSubmit={handleCreate} className="space-y-3 mt-5 border-t border-white/10 pt-5">
            <p className="text-xs text-realm-text-muted font-ui">Or found your own:</p>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Guild name (min 3 chars)"
              maxLength={30}
              className="w-full bg-realm-bg border border-realm-border rounded-lg px-3 py-2 font-ui text-sm text-white focus:outline-none focus:border-realm-accent"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value.toUpperCase())}
                placeholder="TAG"
                maxLength={5}
                className="w-24 bg-realm-bg border border-realm-border rounded-lg px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-realm-accent"
              />
              <button
                type="submit"
                disabled={isLoading || !nameInput.trim() || !tagInput.trim()}
                className="btn-gold flex-1 text-sm py-2 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                🏰 Form Guild
              </button>
            </div>
          </form>
        )}

        {/* No guild, default to create view */}
        {!guild && activeTab === 'info' && (
          <div className="text-center text-realm-text-muted py-8">
            <Castle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-ui text-sm">You are not in a guild.</p>
            <button className="mt-3 text-realm-accent text-xs underline" onClick={() => setActiveTab('browse')}>
              Browse or create one →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
