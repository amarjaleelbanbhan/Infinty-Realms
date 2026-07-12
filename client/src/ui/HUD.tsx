import { useGameStore } from '@stores/useGameStore';
import { useQuestStore } from '@stores/useQuestStore';
import { useUIStore } from '@stores/useUIStore';
import { Heart, Droplet, Star, Coins, Sword, Shield, FlaskConical, Navigation, Gem, CheckCircle2, Circle } from 'lucide-react';
import { PerformanceStats } from './PerformanceStats';

export function HUD() {
  const { player } = useGameStore();
  const { quests } = useQuestStore();
  const { currentScreen, addToast } = useUIStore();

  if (!player || currentScreen !== 'game') return null;

  const { stats, level, experience, gold } = player;
  const hp = stats?.hp ?? 0;
  const maxHp = stats?.maxHp ?? 100;
  const mana = stats?.mana ?? 0;
  const maxMana = stats?.maxMana ?? 50;
  const xpToLevel = (level ?? 1) * 100;
  const xpPercent = ((experience ?? 0) / xpToLevel) * 100;
  const activeQuest = quests.find((q) => q.status === 'active');

  return (
    <>
      {/* ── Top-left: Player stats ── */}
      <div className="absolute top-4 left-4 z-10 select-none pointer-events-none animate-float-gentle">
        <div className="premium-glass premium-border p-5 min-w-[260px]">
          {/* Name + level */}
          <div className="flex items-center justify-between mb-4 border-b border-realm-border/50 pb-2">
            <span className="font-game text-lg text-white tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {player.name}
            </span>
            <div className="flex gap-2 drop-shadow-md">
              {player.ascensions ? (
                <span className="font-game text-xs text-realm-accent bg-realm-accent/10 px-2 py-0.5 rounded-full border border-realm-accent/30" title="Ascension Level">
                  ⭐{player.ascensions}
                </span>
              ) : null}
              <span className="font-game text-xs text-realm-gold bg-realm-gold/10 px-2 py-0.5 rounded-full border border-realm-gold/30">
                Lv.{level}
              </span>
            </div>
          </div>

          {/* HP bar */}
          <div className={`mb-3 ${hp / maxHp < 0.25 ? 'animate-pulse-slow' : ''}`}>
            <div className="flex justify-between items-center mb-1 drop-shadow-md">
              <span className="font-mono text-realm-hp flex items-center gap-1 font-bold text-xs"><Heart className="w-4 h-4" /> HP</span>
              <span className="font-mono text-white/90 text-xs font-bold">{hp}/{maxHp}</span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill bar-hp"
                style={{ width: `${(hp / maxHp) * 100}%` }}
              />
            </div>
          </div>

          {/* Mana bar */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1 drop-shadow-md">
              <span className="font-mono text-realm-mana flex items-center gap-1 font-bold text-xs"><Droplet className="w-4 h-4" /> MP</span>
              <span className="font-mono text-white/90 text-xs font-bold">{mana}/{maxMana}</span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill bar-mana"
                style={{ width: `${(mana / maxMana) * 100}%` }}
              />
            </div>
          </div>

          {/* XP bar */}
          <div>
            <div className="flex justify-between items-center mb-1 drop-shadow-md">
              <span className="font-mono text-realm-xp flex items-center gap-1 font-bold text-xs"><Star className="w-4 h-4" /> XP</span>
              <span className="font-mono text-white/90 text-xs font-bold">{experience ?? 0}/{xpToLevel}</span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill bar-xp"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          {/* Gold */}
          <div className="mt-4 pt-3 border-t border-realm-border/50 flex items-center gap-2 drop-shadow-md bg-black/20 rounded px-3 py-2">
            <Coins className="w-5 h-5 text-realm-gold" />
            <span className="font-game text-base text-realm-gold">{gold ?? 0}</span>
            <span className="font-mono text-xs text-realm-text-muted uppercase tracking-widest mt-1">gold</span>
          </div>
        </div>
      </div>

      {/* ── Bottom-left: Hotbar ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
        <div className="flex items-center gap-3 premium-glass premium-border px-5 py-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          {[Sword, Shield, FlaskConical, Navigation, Gem].map((Icon, i) => (
            <button
              key={i}
              className="w-14 h-14 bg-black/60 border border-white/20 rounded-xl flex items-center justify-center text-white/50 hover:text-realm-accent hover:border-realm-accent hover:bg-realm-accent/20 transition-all hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(108,99,255,0.4)] relative overflow-hidden group"
            >
              <Icon strokeWidth={1.5} className="w-7 h-7 relative z-10" />
              <span className="absolute bottom-1 right-2 font-mono text-[10px] text-white/40 group-hover:text-realm-accent font-bold">{i + 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Top-right: Active quest & Home ── */}
      <div className="absolute top-24 right-6 z-10 pointer-events-auto flex flex-col gap-4 items-end">
        <button
          className="glass px-4 py-2 rounded-2xl shadow-lg border-white/10 hover:bg-white/10 transition-colors flex items-center gap-2 text-white/90"
          onClick={() => window.dispatchEvent(new CustomEvent('enter-house'))}
        >
          <span>🏕️ Return Home</span>
        </button>

        {activeQuest && (
          <div className="glass px-4 py-3 max-w-[240px] rounded-2xl shadow-lg border-white/10 select-none pointer-events-none">
            <div className="text-xs font-mono text-realm-accent mb-1 uppercase tracking-wider">Active Quest</div>
            <div className="font-game text-sm text-white mb-2">{activeQuest.title}</div>
            {activeQuest.objectives.slice(0, 2).map((obj, i) => (
              <div key={i} className={`text-xs font-ui ${obj.current >= obj.quantity ? 'quest-objective-done text-realm-xp' : 'text-realm-text-muted'} flex items-center gap-2 mb-1`}>
                {obj.current >= obj.quantity ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                <span>{obj.description} ({obj.current}/{obj.quantity})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Top-center: Controls hint ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="glass-dark px-3 py-1.5 text-xs font-mono text-realm-text-muted flex gap-4">
          <span>WASD Move</span>
          <span>SPACE Attack</span>
          <span>1-4 Spells</span>
          <span>E Interact</span>
          <span>I Inventory</span>
          <span>Q Quests</span>
        </div>
      </div>
      
      {/* ── Performance & Anti-Cheat Monitor ── */}
      <PerformanceStats />
    </>
  );
}
