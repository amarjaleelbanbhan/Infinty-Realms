import { useState } from 'react';
import { useUIStore } from '@stores/useUIStore';
import { useQuestStore } from '@stores/useQuestStore';
import { X, Sparkles, MapPin, Plus, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function CreatorEditorUI() {
  const { addToast } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'quest' | 'npc' | 'dungeon'>('quest');

  // Custom Quest State
  const [questTitle, setQuestTitle] = useState('');
  const [questDesc, setQuestDesc] = useState('');
  const [questRewardGold, setQuestRewardGold] = useState(50);
  const [questRewardXp, setQuestRewardXp] = useState(100);

  // Custom NPC State
  const [npcName, setNpcName] = useState('');
  const [npcRole, setNpcRole] = useState('villager');
  const [npcPersonality, setNpcPersonality] = useState('friendly');

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-30 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-3 py-2 rounded-xl shadow-lg border border-purple-400/30 flex items-center gap-2 font-mono text-xs cursor-pointer"
      >
        <Sparkles className="w-4 h-4 text-purple-300" /> Creator Tools
      </button>
    );
  }

  const handleSaveQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questTitle.trim()) return;

    useQuestStore.getState().addQuest({
      id: uuidv4(),
      title: questTitle,
      description: questDesc || 'Custom community-crafted quest.',
      type: 'kill',
      lore: 'Created via Infinity Realms Creator Studio.',
      status: 'available',
      objectives: [{ description: 'Complete custom objective', targetType: 'enemy', targetId: 'mob', quantity: 3, current: 0 }],
      rewards: { gold: Number(questRewardGold), experience: Number(questRewardXp), items: [] },
      aiGenerated: false,
    });

    addToast(`Published Quest: "${questTitle}"!`, 'success');
    setQuestTitle('');
    setQuestDesc('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#181524] border border-purple-500/30 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-white">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300 font-bold">
            Creator Studio & Mod Engine
          </h2>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 mb-6 gap-4 font-mono text-xs">
          <button
            onClick={() => setTab('quest')}
            className={`pb-2 border-b-2 transition-colors ${tab === 'quest' ? 'border-purple-400 text-purple-400 font-bold' : 'border-transparent text-white/50 hover:text-white'}`}
          >
            Quest Architect
          </button>
          <button
            onClick={() => setTab('npc')}
            className={`pb-2 border-b-2 transition-colors ${tab === 'npc' ? 'border-purple-400 text-purple-400 font-bold' : 'border-transparent text-white/50 hover:text-white'}`}
          >
            NPC Designer
          </button>
        </div>

        {tab === 'quest' && (
          <form onSubmit={handleSaveQuest} className="space-y-4 text-xs font-ui">
            <div>
              <label className="block text-white/70 mb-1 font-mono">Quest Title</label>
              <input
                type="text"
                value={questTitle}
                onChange={(e) => setQuestTitle(e.target.value)}
                placeholder="e.g. The Forgotten Relic"
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block text-white/70 mb-1 font-mono">Description</label>
              <textarea
                value={questDesc}
                onChange={(e) => setQuestDesc(e.target.value)}
                placeholder="Describe the objective and lore..."
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-400"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-white/70 mb-1 font-mono">Gold Reward</label>
                <input
                  type="number"
                  value={questRewardGold}
                  onChange={(e) => setQuestRewardGold(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>
              <div className="flex-1">
                <label className="block text-white/70 mb-1 font-mono">XP Reward</label>
                <input
                  type="number"
                  value={questRewardXp}
                  onChange={(e) => setQuestRewardXp(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-bold font-mono flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Save className="w-4 h-4" /> Publish Custom Quest
            </button>
          </form>
        )}

        {tab === 'npc' && (
          <div className="space-y-4 text-xs font-ui">
            <div>
              <label className="block text-white/70 mb-1 font-mono">NPC Name</label>
              <input
                type="text"
                value={npcName}
                onChange={(e) => setNpcName(e.target.value)}
                placeholder="e.g. Master Elion"
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-400"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-white/70 mb-1 font-mono">Role</label>
                <select
                  value={npcRole}
                  onChange={(e) => setNpcRole(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="merchant">Merchant</option>
                  <option value="guard">Guard</option>
                  <option value="mage">Mage</option>
                  <option value="blacksmith">Blacksmith</option>
                  <option value="villager">Villager</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-white/70 mb-1 font-mono">Personality</label>
                <select
                  value={npcPersonality}
                  onChange={(e) => setNpcPersonality(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="friendly">Friendly</option>
                  <option value="grumpy">Grumpy</option>
                  <option value="mysterious">Mysterious</option>
                  <option value="brave">Brave</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => {
                if (!npcName.trim()) return;
                addToast(`Spawned Custom NPC: "${npcName}" (${npcRole})!`, 'success');
                setNpcName('');
              }}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-bold font-mono flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Spawn NPC in Realm
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
