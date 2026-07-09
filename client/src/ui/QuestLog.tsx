import { useQuestStore } from '@stores/useQuestStore';
import { useUIStore } from '@stores/useUIStore';
import { questSystem } from '@game/systems/QuestSystem';
import { BookOpen, Zap, ClipboardList, CheckCircle2, Circle, X, Bot, Coins, Sword, Backpack, Shield, Map, Package, Search, Skull } from 'lucide-react';

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
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="font-game text-2xl text-white flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-realm-accent" /> Quest Log
          </h2>
          <button
            onClick={closeQuestLog}
            className="text-white/50 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
          {/* Active */}
          {activeQuests.length > 0 && (
            <div>
              <h3 className="font-game text-sm text-realm-gold uppercase tracking-wider mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Active ({activeQuests.length})
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
              <h3 className="font-game text-sm text-realm-accent-light uppercase tracking-wider mb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> Available ({availableQuests.length})
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
              <h3 className="font-game text-sm text-realm-xp uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Completed ({completedQuests.length})
              </h3>
              <div className="space-y-2">
                {completedQuests.slice(0, 5).map((q) => (
                  <QuestCard key={q.id} quest={q} statusColor={statusColor} />
                ))}
              </div>
            </div>
          )}

          {quests.length === 0 && (
            <div className="text-center py-10 text-white/40 flex flex-col items-center gap-4">
              <BookOpen className="w-12 h-12" strokeWidth={1} />
              <p className="font-ui text-sm">No quests yet. Talk to an NPC or generate one!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10">
          <button className="btn-primary w-full text-sm flex items-center justify-center gap-2" onClick={handleGenerateQuest}>
            <Bot className="w-4 h-4" /> Generate AI Quest
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
  const TypeIcon = ({ type }: { type: string }) => {
    switch(type) {
      case 'kill': return <Sword className="w-4 h-4" />;
      case 'collect': return <Backpack className="w-4 h-4" />;
      case 'escort': return <Shield className="w-4 h-4" />;
      case 'explore': return <Map className="w-4 h-4" />;
      case 'deliver': return <Package className="w-4 h-4" />;
      case 'mystery': return <Search className="w-4 h-4" />;
      case 'boss': return <Skull className="w-4 h-4" />;
      default: return <ClipboardList className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:border-realm-accent/50 transition-all shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <span className="text-white/70 bg-white/5 p-2 rounded-lg"><TypeIcon type={quest.type} /></span>
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
      <div className="space-y-2 mb-4">
        {quest.objectives.map((obj, i) => (
          <div key={i} className={`text-xs flex items-center gap-2 ${obj.current >= obj.quantity ? 'quest-objective-done text-realm-xp' : 'text-white/60'}`}>
            {obj.current >= obj.quantity ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
            <span>{obj.description} ({obj.current}/{obj.quantity})</span>
          </div>
        ))}
      </div>

      {/* Rewards */}
      <div className="flex items-center gap-4 text-xs font-mono pt-3 border-t border-white/5">
        <span className="text-realm-xp flex items-center gap-1">+{quest.rewards.experience} XP</span>
        <span className="text-realm-gold flex items-center gap-1">+{quest.rewards.gold} <Coins className="w-3 h-3" /></span>
        {quest.aiGenerated && <span className="text-realm-accent flex items-center gap-1 ml-auto"><Bot className="w-3 h-3" /> AI</span>}
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
