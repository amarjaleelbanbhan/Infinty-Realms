import { useEffect } from 'react';
import { useRelicStore } from '@stores/useRelicStore';
import { useUIStore } from '@stores/useUIStore';
import { X, Flame, Snowflake, Sparkles, Zap, Shield, ChevronUp, CheckCircle2 } from 'lucide-react';

export function RelicTransmutationUI() {
  const {
    isRelicUIOpen,
    closeRelicUI,
    toggleRelicUI,
    relics,
    activeSocketId,
    essences,
    socketRelic,
    unsocketRelic,
    upgradeRelic,
  } = useRelicStore();
  const { addToast } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        toggleRelicUI();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleRelicUI]);

  if (!isRelicUIOpen) return null;

  const activeRelic = relics.find((r) => r.id === activeSocketId);

  const handleSocket = (id: string) => {
    if (activeSocketId === id) {
      unsocketRelic();
      addToast('Unsocketed Active Relic', 'info');
    } else {
      socketRelic(id);
      const relic = relics.find((r) => r.id === id);
      addToast(`⚡ Socketed Ancient Relic: ${relic?.name}!`, 'success');
    }
  };

  const handleUpgrade = (id: string) => {
    const success = upgradeRelic(id);
    if (success) {
      const relic = relics.find((r) => r.id === id);
      addToast(`✨ Transmuted ${relic?.name} to Level ${relic ? relic.level + 1 : 2}!`, 'success');
    } else {
      addToast('❌ Insufficient Elemental Essences for Transmutation', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0e0c1a]/95 border border-[#38bdf8]/30 rounded-2xl max-w-4xl w-full p-6 shadow-[0_0_60px_rgba(56,189,248,0.15)] relative overflow-hidden text-white flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-950/60 border border-cyan-500/40 rounded-xl text-cyan-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-300">
                Relic Altar & Transmutation
              </h2>
              <p className="text-xs text-white/50 font-mono">Infuse Elemental Essences & Socket Mythic Artifacts</p>
            </div>
          </div>
          <button
            onClick={closeRelicUI}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Essences Bar */}
        <div className="grid grid-cols-3 gap-3 my-4 font-mono text-xs">
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center justify-between">
            <span className="flex items-center gap-2 text-red-400"><Flame className="w-4 h-4" /> Solar Fire</span>
            <span className="font-bold text-white">{essences.fire}</span>
          </div>
          <div className="p-3 bg-sky-950/40 border border-sky-500/30 rounded-xl flex items-center justify-between">
            <span className="flex items-center gap-2 text-sky-400"><Snowflake className="w-4 h-4" /> Glacial Frost</span>
            <span className="font-bold text-white">{essences.frost}</span>
          </div>
          <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl flex items-center justify-between">
            <span className="flex items-center gap-2 text-purple-400"><Sparkles className="w-4 h-4" /> Void Essence</span>
            <span className="font-bold text-white">{essences.void}</span>
          </div>
        </div>

        {/* Relic Grid & Active Chamber */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-y-auto pr-1">
          {/* Active Relic Socket Chamber */}
          <div className="md:col-span-1 bg-[#151226]/90 border border-cyan-500/30 rounded-xl p-4 flex flex-col items-center justify-between text-center relative overflow-hidden">
            <div className="text-xs font-mono text-cyan-400 mb-2 uppercase tracking-wider">Active Socket Chamber</div>

            {activeRelic ? (
              <div className="my-auto flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-cyan-950/80 border-2 border-cyan-400 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(56,189,248,0.4)] animate-pulse">
                  {activeRelic.icon}
                </div>
                <h3 className="font-bold text-lg text-white mt-3">{activeRelic.name}</h3>
                <span className="text-xs font-mono text-cyan-300">Level {activeRelic.level}/{activeRelic.maxLevel}</span>
                <p className="text-xs text-white/70 mt-2 px-2">{activeRelic.description}</p>
              </div>
            ) : (
              <div className="my-auto flex flex-col items-center opacity-40">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center text-3xl">
                  🛡️
                </div>
                <p className="text-xs text-white/50 mt-3 font-mono">No Relic Socketed</p>
              </div>
            )}

            {activeRelic && (
              <button
                onClick={unsocketRelic}
                className="w-full py-2 bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 rounded-lg text-xs font-mono transition-all cursor-pointer mt-4"
              >
                Unsocket Relic
              </button>
            )}
          </div>

          {/* Relic Collection List */}
          <div className="md:col-span-2 space-y-3">
            {relics.map((relic) => {
              const isSocketed = relic.id === activeSocketId;
              const canUpgrade = essences.fire >= 5 && essences.frost >= 5 && essences.void >= 2 && relic.level < relic.maxLevel;

              return (
                <div
                  key={relic.id}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                    isSocketed
                      ? 'bg-cyan-950/30 border-cyan-500/60 shadow-md shadow-cyan-950/40'
                      : 'bg-[#121020]/80 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl p-2.5 bg-white/5 border border-white/10 rounded-xl">
                      {relic.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{relic.name}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50 uppercase">
                          {relic.rarity}
                        </span>
                      </div>
                      <p className="text-xs text-white/60 mt-1">{relic.description}</p>
                      <div className="flex gap-3 text-[11px] font-mono text-cyan-300 mt-2">
                        <span>Level: {relic.level}/{relic.maxLevel}</span>
                        {relic.statBonus.attack && <span>+ {relic.statBonus.attack} ATK</span>}
                        {relic.statBonus.defense && <span>+ {relic.statBonus.defense} DEF</span>}
                        {relic.statBonus.luck && <span>+ {relic.statBonus.luck} LUCK</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[120px]">
                    <button
                      onClick={() => handleSocket(relic.id)}
                      className={`py-2 px-3 rounded-lg font-mono text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSocketed
                          ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/30'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {isSocketed ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                      {isSocketed ? 'Socketed' : 'Socket'}
                    </button>

                    {relic.level < relic.maxLevel && (
                      <button
                        onClick={() => handleUpgrade(relic.id)}
                        disabled={!canUpgrade}
                        className={`py-1.5 px-3 rounded-lg font-mono text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          canUpgrade
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold shadow'
                            : 'bg-white/5 text-white/30 cursor-not-allowed'
                        }`}
                      >
                        <ChevronUp className="w-3.5 h-3.5" /> Transmute
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
