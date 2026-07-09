import { useGameStore } from '@stores/useGameStore';
import { useQuestStore } from '@stores/useQuestStore';
import { useUIStore } from '@stores/useUIStore';
import { Heart, Droplet, Star, Coins, Sword, Shield, FlaskConical, Navigation, Gem, CheckCircle2, Circle } from 'lucide-react';

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
      <div className="absolute top-4 left-4 z-10 select-none pointer-events-none">
        <div className="glass p-5 min-w-[240px] rounded-2xl">
          {/* Name + level */}
          <div className="flex items-center justify-between mb-3">
            <span className="font-game text-sm text-white tracking-wide">
              {player.name}
            </span>
            <div className="flex gap-1">
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
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-mono text-realm-hp flex items-center gap-1"><Heart className="w-3 h-3" /> HP</span>
              <span className="text-xs font-mono text-white/70">{hp}/{maxHp}</span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill bar-hp"
                style={{ width: `${(hp / maxHp) * 100}%` }}
              />
            </div>
          </div>

          {/* Mana bar */}
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-mono text-realm-mana flex items-center gap-1"><Droplet className="w-3 h-3" /> MP</span>
              <span className="text-xs font-mono text-white/70">{mana}/{maxMana}</span>
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
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-mono text-realm-xp flex items-center gap-1"><Star className="w-3 h-3" /> XP</span>
              <span className="text-xs font-mono text-white/70">{experience ?? 0}/{xpToLevel}</span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill bar-xp"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          {/* Gold */}
          <div className="mt-3 pt-3 border-t border-realm-border flex items-center gap-2">
            <Coins className="w-4 h-4 text-realm-gold" />
            <span className="font-mono text-sm text-realm-gold">{gold ?? 0}</span>
            <span className="text-xs text-realm-text-muted">gold</span>
          </div>
        </div>
      </div>

      {/* ── Bottom-left: Hotbar ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
        <div className="flex items-center gap-4 glass px-6 py-3 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/10">
          {[Sword, Shield, FlaskConical, Navigation, Gem].map((Icon, i) => (
            <button
              key={i}
              onClick={() => {
                if (i === 3) {
                  import('@game/systems/MountSystem').then(m => m.MountSystem.toggleMount());
                }
              }}
              className="w-14 h-14 bg-white/5 flex items-center justify-center text-white/80 rounded-full border border-white/10 hover:border-realm-accent hover:text-realm-accent hover:bg-realm-accent/20 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_20px_rgba(108,99,255,0.4)] active:scale-95"
              data-tooltip={['Attack', 'Block', 'Heal', 'Mount', 'Gem'][i]}
            >
              <Icon className="w-6 h-6" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Top-right: Active quest ── */}
      {activeQuest && (
        <div className="absolute top-24 right-6 z-10 pointer-events-none select-none">
          <div className="glass px-4 py-3 max-w-[240px] rounded-2xl shadow-lg border-white/10">
            <div className="text-xs font-mono text-realm-accent mb-1 uppercase tracking-wider">Active Quest</div>
            <div className="font-game text-sm text-white mb-2">{activeQuest.title}</div>
            {activeQuest.objectives.slice(0, 2).map((obj, i) => (
              <div key={i} className={`text-xs font-ui ${obj.current >= obj.quantity ? 'quest-objective-done text-realm-xp' : 'text-realm-text-muted'} flex items-center gap-2 mb-1`}>
                {obj.current >= obj.quantity ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                <span>{obj.description} ({obj.current}/{obj.quantity})</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
    </>
  );
}
