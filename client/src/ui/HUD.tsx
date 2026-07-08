import { useGameStore } from '@stores/useGameStore';
import { useQuestStore } from '@stores/useQuestStore';
import { useUIStore } from '@stores/useUIStore';

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
        <div className="glass-dark px-4 py-3 min-w-[200px]">
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
              <span className="text-xs font-mono text-realm-hp">❤️ HP</span>
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
              <span className="text-xs font-mono text-realm-mana">💧 MP</span>
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
              <span className="text-xs font-mono text-realm-xp">⭐ XP</span>
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
            <span className="text-realm-gold text-sm">💰</span>
            <span className="font-mono text-sm text-realm-gold">{gold ?? 0}</span>
            <span className="text-xs text-realm-text-muted">gold</span>
          </div>
        </div>
      </div>

      {/* ── Bottom-left: Hotbar ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
        <div className="flex items-center gap-2">
          {['⚔️', '🛡️', '🧪', '📜', '💎'].map((icon, i) => (
            <button
              key={i}
              className="w-12 h-12 glass flex items-center justify-center text-xl rounded-xl border border-realm-border hover:border-realm-accent transition-all duration-150 active:scale-95"
              data-tooltip={['Attack', 'Block', 'Heal', 'Quest Item', 'Gem'][i]}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* ── Top-right: Active quest ── */}
      {activeQuest && (
        <div className="absolute top-4 right-4 z-10 pointer-events-none select-none" style={{ marginRight: '100px' }}>
          <div className="glass-dark px-4 py-3 max-w-[220px]">
            <div className="text-xs font-mono text-realm-accent mb-1 uppercase tracking-wider">Active Quest</div>
            <div className="font-game text-sm text-white mb-2">{activeQuest.title}</div>
            {activeQuest.objectives.slice(0, 2).map((obj, i) => (
              <div key={i} className={`text-xs font-ui ${obj.current >= obj.quantity ? 'quest-objective-done text-realm-xp' : 'text-realm-text-muted'} flex items-center gap-1`}>
                <span>{obj.current >= obj.quantity ? '✅' : '○'}</span>
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
