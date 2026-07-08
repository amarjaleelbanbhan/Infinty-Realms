import { useState } from 'react';
import { useUIStore } from '@stores/useUIStore';
import { useGameStore } from '@stores/useGameStore';
import { useQuestStore } from '@stores/useQuestStore';
import type { Quest, Item } from '@shared/types';

export function CreatorPanel({ onClose }: { onClose: () => void }) {
  const { player, addGold, addToInventory } = useGameStore();
  const { addToast } = useUIStore();

  const [activeTab, setActiveTab] = useState<'quest' | 'item'>('quest');
  const [promptInput, setPromptInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedQuest, setGeneratedQuest] = useState<Partial<Quest> | null>(null);
  const [generatedItem, setGeneratedItem] = useState<Partial<Item> | null>(null);

  const token = useGameStore.getState().playerToken;

  const handleGenerateQuest = async () => {
    if (!promptInput.trim()) return;
    setLoading(false);
    setGeneratedQuest(null);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/quest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          worldSeed: player?.worldSeed ?? 'main',
          biome: 'plains',
          season: 'spring',
          playerLevel: player?.level ?? 1,
          prompt: promptInput,
        }),
      });

      if (res.ok) {
        const quest = await res.json();
        setGeneratedQuest(quest);
        addToast('Custom quest layout generated!', 'success');
      } else {
        addToast('Failed to generate quest outline', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error contacting AI architect', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishQuest = () => {
    if (!generatedQuest || !player) return;
    const gold = player.gold ?? 0;
    if (gold < 100) {
      addToast('Requires 100 gold to publish!', 'error');
      return;
    }

    addGold(-100);
    // Add quest via questStore
    useQuestStore.getState().addQuest({
      id: generatedQuest.id ?? `custom-${Date.now()}`,
      title: generatedQuest.title ?? 'Custom Quest',
      description: generatedQuest.description ?? 'Fulfill this custom challenge.',
      type: generatedQuest.type ?? 'explore',
      status: 'available',
      lore: generatedQuest.lore ?? '',
      aiGenerated: generatedQuest.aiGenerated ?? true,
      objectives: generatedQuest.objectives ?? [
        {
          description: 'Explore the region',
          targetType: 'location',
          targetId: 'custom-loc',
          quantity: 1,
          current: 0,
        }
      ],
      rewards: generatedQuest.rewards ?? {
        experience: 100,
        gold: 50,
        items: [],
      },
    });

    addToast('Challenge published! Added to active quests.', 'success');
    setGeneratedQuest(null);
    setPromptInput('');
  };

  const handleGenerateItem = async () => {
    if (!promptInput.trim()) return;
    setLoading(false);
    setGeneratedItem(null);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: promptInput,
          creatorLevel: player?.level ?? 1,
        }),
      });

      if (res.ok) {
        const item = await res.json();
        setGeneratedItem(item);
        addToast('Custom item forged successfully!', 'success');
      } else {
        addToast('Failed to forge item details', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error contacting AI blacksmith', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimItem = () => {
    if (!generatedItem || !player) return;
    const gold = player.gold ?? 0;
    if (gold < 150) {
      addToast('Requires 150 gold to purchase the materials!', 'error');
      return;
    }

    addGold(-150);
    addToInventory({
      id: generatedItem.id ?? `item-${Date.now()}`,
      name: generatedItem.name ?? 'Forged Artifact',
      description: generatedItem.description ?? 'A customized weapon forged from pure leylines.',
      type: generatedItem.type ?? 'weapon',
      rarity: generatedItem.rarity ?? 'rare',
      icon: generatedItem.icon ?? '🗡️',
      value: generatedItem.value ?? 10,
      stats: generatedItem.stats,
    }, 1);

    addToast('Forged item added to your bag!', 'success');
    setGeneratedItem(null);
    setPromptInput('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass p-6 w-full max-w-lg mx-4 flex flex-col max-h-[85vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-realm-border pb-3 mb-4">
          <div>
            <h2 className="font-game text-xl text-white">✨ Creator Architect Panel</h2>
            <p className="text-[10px] text-realm-text-muted">Shape your own legend in real time</p>
          </div>
          <button onClick={onClose} className="text-realm-text-muted hover:text-white">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-realm-border mb-4">
          <button
            onClick={() => {
              setActiveTab('quest');
              setPromptInput('');
              setGeneratedQuest(null);
              setGeneratedItem(null);
            }}
            className={`flex-1 py-2 text-center text-xs font-game transition-colors ${
              activeTab === 'quest' ? 'text-realm-gold border-b-2 border-realm-gold' : 'text-realm-text-muted hover:text-white'
            }`}
          >
            📜 Quest Architect
          </button>
          <button
            onClick={() => {
              setActiveTab('item');
              setPromptInput('');
              setGeneratedQuest(null);
              setGeneratedItem(null);
            }}
            className={`flex-1 py-2 text-center text-xs font-game transition-colors ${
              activeTab === 'item' ? 'text-realm-gold border-b-2 border-realm-gold' : 'text-realm-text-muted hover:text-white'
            }`}
          >
            🗡️ Item Architect
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 text-left">
          {activeTab === 'quest' ? (
            <>
              <p className="text-xs text-realm-text-muted font-ui">
                Draft a custom quest. Provide details of the target or story, and the AI will weave a quest template. Publishing costs <span className="text-realm-gold">100g</span>.
              </p>

              <div className="space-y-2">
                <label className="text-[10px] font-game uppercase tracking-wider text-realm-text-muted">Quest Idea / Prompt</label>
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="e.g. Save the villagers from the Goblin General hoarding magic seeds."
                  rows={3}
                  className="w-full bg-realm-bg border border-realm-border rounded-lg p-3 text-xs text-white placeholder-realm-text-muted focus:outline-none focus:border-realm-gold"
                />
              </div>

              <button
                onClick={handleGenerateQuest}
                disabled={loading || !promptInput.trim()}
                className="btn-primary w-full text-xs py-2 disabled:opacity-40"
              >
                {loading ? 'Drafting Quest via AI...' : 'Draft Custom Quest'}
              </button>

              {generatedQuest && (
                <div className="bg-realm-surface border border-realm-accent/40 rounded-xl p-4 space-y-3">
                  <h3 className="font-game text-sm text-realm-gold border-b border-realm-border/40 pb-1.5">{generatedQuest.title}</h3>
                  <p className="text-xs text-white leading-relaxed">"{generatedQuest.description}"</p>
                  <div className="flex gap-4 text-[10px] font-mono text-realm-xp">
                    <span>Type: <span className="text-white capitalize">{generatedQuest.type}</span></span>
                    <span>Rewards: <span className="text-realm-gold">+{generatedQuest.rewards?.gold ?? 50} Gold</span></span>
                  </div>
                  <button onClick={handlePublishQuest} className="btn-gold w-full text-xs py-2 mt-2">
                    Publish Quest (Costs 100g)
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-xs text-realm-text-muted font-ui">
                Forge a dynamic item from the leylines. State what weapon or relic you wish to design. Purchasing costs <span className="text-realm-gold">150g</span>.
              </p>

              <div className="space-y-2">
                <label className="text-[10px] font-game uppercase tracking-wider text-realm-text-muted">Item Desired / Prompt</label>
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="e.g. Glowing frozen claymore of frost giants"
                  rows={3}
                  className="w-full bg-realm-bg border border-realm-border rounded-lg p-3 text-xs text-white placeholder-realm-text-muted focus:outline-none focus:border-realm-gold"
                />
              </div>

              <button
                onClick={handleGenerateItem}
                disabled={loading || !promptInput.trim()}
                className="btn-primary w-full text-xs py-2 disabled:opacity-40"
              >
                {loading ? 'Forging Item via AI...' : 'Forge Custom Item'}
              </button>

              {generatedItem && (
                <div className="bg-realm-surface border border-realm-gold/40 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3 border-b border-realm-border/40 pb-2">
                    <span className="text-3xl">{generatedItem.icon}</span>
                    <div>
                      <h3 className="font-game text-sm text-white">{generatedItem.name}</h3>
                      <p className="text-[10px] text-realm-gold capitalize">{generatedItem.rarity} {generatedItem.type}</p>
                    </div>
                  </div>
                  <p className="text-xs text-realm-text-muted leading-relaxed">"{generatedItem.description}"</p>
                  {generatedItem.stats && (
                    <div className="bg-realm-bg rounded-lg p-2 font-mono text-[10px] space-y-1 text-realm-xp">
                      {generatedItem.stats.attack ? <div>⚔️ Attack: +{generatedItem.stats.attack}</div> : null}
                      {generatedItem.stats.defense ? <div>🛡️ Defense: +{generatedItem.stats.defense}</div> : null}
                      {generatedItem.stats.hp ? <div>❤️ HP: +{generatedItem.stats.hp}</div> : null}
                    </div>
                  )}
                  <button onClick={handleClaimItem} className="btn-gold w-full text-xs py-2 mt-2">
                    Claim and Spend 150g
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <button className="btn-secondary w-full text-xs" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
