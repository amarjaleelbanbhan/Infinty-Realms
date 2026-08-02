import { useState, useEffect } from 'react';
import { useCodexStore } from '@stores/useCodexStore';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';
import { X, BookOpen, Trophy, Shield, Gift, CheckCircle, Sparkles } from 'lucide-react';

export function CodexUI() {
  const { isCodexOpen, closeCodex, toggleCodex, achievements, bestiary, claimAchievementReward } = useCodexStore();
  const { addGold, addExperience } = useGameStore();
  const { addToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<'achievements' | 'bestiary'>('achievements');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' || e.key === 'K') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        toggleCodex();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCodex]);

  if (!isCodexOpen) return null;

  const handleClaim = (id: string) => {
    const reward = claimAchievementReward(id);
    if (reward) {
      addGold(reward.gold);
      addExperience(reward.xp);
      addToast(`🎉 Claimed Reward: +${reward.gold} Gold, +${reward.xp} XP!`, 'success');
    }
  };

  const bestiaryList = Object.values(bestiary);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#12111d]/90 border border-[#a855f7]/30 rounded-2xl max-w-3xl w-full p-6 shadow-[0_0_50px_rgba(168,85,247,0.15)] relative overflow-hidden text-white flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-950/60 border border-purple-500/40 rounded-xl text-purple-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-200 to-indigo-300">
                Realm Codex & Bestiary
              </h2>
              <p className="text-xs text-white/50 font-mono">Knowledge, Trophies & World Intelligence</p>
            </div>
          </div>
          <button
            onClick={closeCodex}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-3 my-4 font-mono text-xs">
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'achievements'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-900/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" /> Achievements ({achievements.filter((a) => a.unlocked).length}/{achievements.length})
          </button>
          <button
            onClick={() => setActiveTab('bestiary')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'bestiary'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-900/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" /> Monster Bestiary ({bestiaryList.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {activeTab === 'achievements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {achievements.map((ach) => {
                const percent = Math.min(100, Math.floor((ach.progress / ach.maxProgress) * 100));
                return (
                  <div
                    key={ach.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      ach.claimed
                        ? 'bg-purple-950/20 border-purple-900/30 opacity-75'
                        : ach.unlocked
                        ? 'bg-gradient-to-br from-purple-950/60 to-indigo-950/40 border-purple-500/50 shadow-md shadow-purple-950/50'
                        : 'bg-[#0a0914]/80 border-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{ach.icon}</span>
                          <h3 className="font-semibold text-sm text-white">{ach.title}</h3>
                        </div>
                        {ach.claimed ? (
                          <span className="text-emerald-400 text-xs flex items-center gap-1 font-mono">
                            <CheckCircle className="w-4 h-4" /> Claimed
                          </span>
                        ) : ach.unlocked ? (
                          <span className="text-amber-300 text-xs flex items-center gap-1 font-mono font-bold animate-pulse">
                            <Sparkles className="w-4 h-4" /> Ready
                          </span>
                        ) : (
                          <span className="text-white/40 font-mono text-xs">
                            {ach.progress}/{ach.maxProgress}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed mb-3">{ach.description}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      {!ach.unlocked && (
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      )}

                      {ach.unlocked && !ach.claimed && (
                        <button
                          onClick={() => handleClaim(ach.id)}
                          className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold font-mono text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                        >
                          <Gift className="w-4 h-4" /> Claim Reward (+{ach.rewardGold}g, +{ach.rewardXp} XP)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'bestiary' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bestiaryList.map((mon) => (
                <div
                  key={mon.id}
                  className="bg-[#0f0e1a]/90 border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:border-purple-500/40 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-3xl flex-shrink-0">
                      {mon.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-white">{mon.name}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40">
                          {mon.biome}
                        </span>
                      </div>
                      <p className="text-xs text-white/50 mt-1">{mon.description}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/10 text-xs font-mono grid grid-cols-2 gap-2 text-white/70">
                    <div>
                      <span className="text-white/40 block text-[10px]">TOTAL KILLS</span>
                      <span className="text-purple-300 font-bold">{mon.kills}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px]">WEAKNESS</span>
                      <span className="text-amber-400 font-bold">{mon.weakness}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
