import { useQuestStore } from '@stores/useQuestStore';
import { useUIStore } from '@stores/useUIStore';
import { questSystem } from '@game/systems/QuestSystem';

export function QuestLog() {
  const { isQuestLogOpen, closeQuestLog, addToast } = useUIStore();
  const { quests, setActiveQuest, updateQuestStatus } = useQuestStore();

  if (!isQuestLogOpen) return null;

  const activeQuests    = quests.filter((q) => q.status === 'active');
  const availableQuests = quests.filter((q) => q.status === 'available');
  const completedQuests = quests.filter((q) => q.status === 'completed');

  const statusColor: Record<string, string> = {
    active: 'text-realm-gold',
    available: 'text-realm-accent-light',
    completed: 'text-realm-xp',
    failed: 'text-realm-hp',
  };

  const handleGenerateQuest = async () => {
    try {
      addToast('Generating quest...', 'info');
      await questSystem.generateQuest();
    } catch {
      addToast('Failed to generate quest', 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={closeQuestLog}>
      <div
        className="modal-content glass w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-realm-border">
          <h2 className="font-game text-xl text-white">📜 Quest Log</h2>
          <button
            onClick={closeQuestLog}
            className="text-realm-text-muted hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
          {/* Active */}
          {activeQuests.length > 0 && (
            <div>
              <h3 className="font-game text-sm text-realm-gold uppercase tracking-wider mb-2">
                ⚡ Active ({activeQuests.length})
              </h3>
              <div className="space-y-2">
                {activeQuests.map((q) => (
                  <QuestCard key={q.id} quest={q} statusColor={statusColor} />
                ))}
              </div>
            </div>
          )}

          {/* Available */}
          {availableQuests.length > 0 && (
            <div>
              <h3 className="font-game text-sm text-realm-accent-light uppercase tracking-wider mb-2">
                📋 Available ({availableQuests.length})
              </h3>
              <div className="space-y-2">
                {availableQuests.map((q) => (
                  <QuestCard
                    key={q.id}
                    quest={q}
                    statusColor={statusColor}
                    onAccept={() => {
                      questSystem.acceptQuest(q.id);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completedQuests.length > 0 && (
            <div>
              <h3 className="font-game text-sm text-realm-xp uppercase tracking-wider mb-2">
                ✅ Completed ({completedQuests.length})
              </h3>
              <div className="space-y-2">
                {completedQuests.slice(0, 5).map((q) => (
                  <QuestCard key={q.id} quest={q} statusColor={statusColor} />
                ))}
              </div>
            </div>
          )}

          {quests.length === 0 && (
            <div className="text-center py-8 text-realm-text-muted">
              <p className="text-4xl mb-3">📜</p>
              <p className="font-ui text-sm">No quests yet. Talk to an NPC or generate one!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-realm-border">
          <button className="btn-primary w-full text-sm" onClick={handleGenerateQuest}>
            🤖 Generate AI Quest
          </button>
        </div>
      </div>
    </div>
  );
}

function QuestCard({
  quest,
  statusColor,
  onAccept,
}: {
  quest: import('@shared/types').Quest;
  statusColor: Record<string, string>;
  onAccept?: () => void;
}) {
  const typeIcon: Record<string, string> = {
    kill: '⚔️', collect: '🎒', escort: '🛡️', explore: '🗺️', deliver: '📦', mystery: '🔍', boss: '💀',
  };

  return (
    <div className="bg-realm-surface rounded-xl p-4 border border-realm-border hover:border-realm-accent/50 transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">{typeIcon[quest.type] ?? '📋'}</span>
          <span className="font-game text-sm text-white">{quest.title}</span>
        </div>
        <span className={`text-xs font-mono capitalize ${statusColor[quest.status]}`}>
          {quest.status}
        </span>
      </div>

      <p className="text-xs text-realm-text-muted font-ui mb-2 line-clamp-2">{quest.description}</p>

      {quest.lore && (
        <p className="text-xs text-realm-accent/70 font-ui italic mb-2 line-clamp-1">"{quest.lore}"</p>
      )}

      {/* Objectives */}
      <div className="space-y-1 mb-3">
        {quest.objectives.map((obj, i) => (
          <div key={i} className={`text-xs flex items-center gap-1 ${obj.current >= obj.quantity ? 'quest-objective-done text-realm-xp' : 'text-realm-text-muted'}`}>
            <span>{obj.current >= obj.quantity ? '✅' : '○'}</span>
            <span>{obj.description} ({obj.current}/{obj.quantity})</span>
          </div>
        ))}
      </div>

      {/* Rewards */}
      <div className="flex items-center gap-3 text-xs font-mono">
        <span className="text-realm-xp">+{quest.rewards.experience} XP</span>
        <span className="text-realm-gold">+{quest.rewards.gold} 💰</span>
        {quest.aiGenerated && <span className="text-realm-accent">🤖 AI</span>}
      </div>

      {onAccept && (
        <button
          className="btn-primary w-full mt-3 text-xs py-2"
          onClick={onAccept}
        >
          Accept Quest
        </button>
      )}
    </div>
  );
}
