import { useGameStore } from '@stores/useGameStore';
import { useQuestStore } from '@stores/useQuestStore';
import { BookOpen, X, Star, CheckCircle, Zap } from 'lucide-react';

export function WorldJournalUI({ onClose }: { onClose: () => void }) {
  const { worldState, player } = useGameStore();
  const { quests } = useQuestStore();

  const completedQuests = quests.filter((q) => q.status === 'completed');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-realm-border pb-3 mb-4">
          <h2 className="font-game text-xl text-white flex items-center gap-2"><BookOpen className="w-5 h-5 text-realm-accent" /> Realm Chronicle</h2>
          <button onClick={onClose} className="text-realm-text-muted hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* World summary */}
        <div className="bg-realm-surface border border-realm-border rounded-xl p-4 mb-4">
          <div className="text-xs font-mono text-realm-gold mb-1">SEED: {worldState?.seed ?? 'Unknown'}</div>
          <div className="font-game text-lg text-white mb-2">Age of Discovery</div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-realm-bg rounded p-2">
              <span className="text-realm-text-muted">Season: </span>
              <span className="text-realm-xp capitalize">{worldState?.season ?? 'Spring'}</span>
            </div>
            <div className="bg-realm-bg rounded p-2">
              <span className="text-realm-text-muted">World Age: </span>
              <span className="text-white">{worldState?.worldAge ?? 1} Days</span>
            </div>
          </div>
        </div>

        {/* Chronicle History Log */}
        <h3 className="font-game text-xs text-realm-text-muted uppercase tracking-wider mb-2">Histories & Milestones</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto mb-4 text-xs font-ui">
          <div className="bg-realm-bg border border-realm-border rounded-lg p-3">
            <span className="text-realm-gold font-mono flex items-center gap-1"><Star className="w-4 h-4" /> Day 1: </span>
            <span className="text-gray-200 mt-1 block">Adventurer {player?.name ?? 'Hero'} awakened in the {player?.worldSeed} realm.</span>
          </div>

          {completedQuests.map((q) => (
            <div key={q.id} className="bg-realm-bg border border-realm-border rounded-lg p-3">
              <span className="text-realm-xp font-mono flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Quest: </span>
              <span className="text-gray-200 mt-1 block">Completed "{q.title}". Reward: +{q.rewards.gold}g.</span>
            </div>
          ))}

          <div className="bg-realm-bg border border-realm-border rounded-lg p-3">
            <span className="text-realm-accent font-mono flex items-center gap-1"><Zap className="w-4 h-4" /> Leylines: </span>
            <span className="text-gray-200 mt-1 block">Arcane energy nodes established across the terrain.</span>
          </div>
        </div>

        <button className="btn-secondary w-full text-xs" onClick={onClose}>
          Close Chronicle
        </button>
      </div>
    </div>
  );
}
