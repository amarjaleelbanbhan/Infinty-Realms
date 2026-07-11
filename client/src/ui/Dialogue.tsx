import { useState } from 'react';
import { useUIStore } from '@stores/useUIStore';
import { useGameStore } from '@stores/useGameStore';
import { questSystem } from '@game/systems/QuestSystem';
import { Store, AlertCircle, Sword, User, Beer, Hammer, Wand2, HeartHandshake, Crosshair, HelpCircle } from 'lucide-react';

export function Dialogue() {
  const { isDialogueOpen, closeDialogue, dialogueNpc, dialogueText, dialogueOptions, addToast, openDialogue } = useUIStore();
  const { playerToken, player } = useGameStore();
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);

  // Type out the text character by character
  const startTyping = (text: string) => {
    setIsTyping(true);
    setTypedText('');
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(text.slice(0, ++i));
      if (i >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 25);
  };

  // Start typing when dialogue opens
  if (isDialogueOpen && typedText === '' && !isTyping && dialogueText) {
    startTyping(dialogueText);
  }

  if (!isDialogueOpen) return null;

  const handleOption = (action: string) => {
    if (action === 'quest') {
      questSystem.generateQuest({ 
        npcName: dialogueNpc?.name,
        npcRole: dialogueNpc?.role,
        npcPersonality: dialogueNpc?.personality,
        npcMemory: dialogueNpc?.memory?.map(m => m.event),
      });
      addToast('Quest offered!', 'success');
    } else if (action === 'trade') {
      if (dialogueNpc?.id) {
        useUIStore.getState().openMerchantShop(dialogueNpc.id, dialogueNpc.biome ?? 'plains');
      }
    } else if (action === 'close') {
      closeDialogue();
    }
    setTypedText('');
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !dialogueNpc || !playerToken || !player) return;

    setIsWaiting(true);
    setChatInput('');
    setTypedText('');

    try {
      const res = await fetch('/api/npcs/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${playerToken}`,
        },
        body: JSON.stringify({
          npcId: dialogueNpc.id,
          name: dialogueNpc.name,
          role: dialogueNpc.role,
          biome: dialogueNpc.biome,
          worldSeed: player.worldSeed,
          playerLevel: player.level,
          playerName: player.name,
          playerMessage: chatInput,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        openDialogue(dialogueNpc, data.dialogue, data.options);
        setIsTyping(false); // reset typing to trigger startTyping effect
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsWaiting(false);
    }
  };

  const renderRoleIcon = (role?: string) => {
    switch (role) {
      case 'merchant': return <Store className="w-6 h-6 text-yellow-400" />;
      case 'quest_giver': return <AlertCircle className="w-6 h-6 text-orange-400" />;
      case 'guard': return <Sword className="w-6 h-6 text-gray-300" />;
      case 'villager': return <User className="w-6 h-6 text-blue-300" />;
      case 'innkeeper': return <Beer className="w-6 h-6 text-orange-300" />;
      case 'blacksmith': return <Hammer className="w-6 h-6 text-slate-400" />;
      case 'mage': return <Wand2 className="w-6 h-6 text-purple-400" />;
      case 'healer': return <HeartHandshake className="w-6 h-6 text-red-400" />;
      case 'thief': return <Crosshair className="w-6 h-6 text-gray-400" />;
      default: return <HelpCircle className="w-6 h-6 text-white/50" />;
    }
  };

  return (
    <div
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 w-full max-w-lg px-4 animate-slide-up"
      style={{ pointerEvents: 'auto' }}
    >
      {/* NPC Portrait + Name */}
      <div className="flex items-center gap-3 mb-2 ml-2">
        <div className="w-12 h-12 rounded-full glass flex items-center justify-center text-2xl border border-realm-accent/30 bg-black/50">
          {renderRoleIcon(dialogueNpc?.role)}
        </div>
        <div>
          <p className="font-game text-sm text-realm-gold">{dialogueNpc?.name ?? 'Stranger'}</p>
          <p className="text-xs text-realm-text-muted capitalize">{dialogueNpc?.role?.replace('_', ' ') ?? 'Unknown'}</p>
        </div>
      </div>

      {/* Dialogue box */}
      <div className="dialogue-box">
        <p className="font-ui text-sm text-white leading-relaxed min-h-[3rem]">
          "{typedText}"
          {isTyping && <span className="animate-pulse">|</span>}
        </p>

        {/* Options */}
        {!isTyping && dialogueOptions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {dialogueOptions.map((opt, i) => (
              <button
                key={i}
                className="btn-secondary text-xs py-2 px-4"
                onClick={() => handleOption(opt.action)}
              >
                {opt.text}
              </button>
            ))}
          </div>
        )}

        {!isTyping && !isWaiting && dialogueOptions.length === 0 && (
          <button
            className="btn-secondary text-xs py-2 px-4 mt-4"
            onClick={() => { closeDialogue(); setTypedText(''); }}
          >
            Farewell
          </button>
        )}

        {/* Freeform Chat */}
        {!isTyping && !isWaiting && (
          <form onSubmit={handleChatSubmit} className="mt-4 flex gap-2 border-t border-realm-border/50 pt-4">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Say something to ${dialogueNpc?.name}...`}
              className="flex-1 bg-black/50 border border-realm-border rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-realm-accent"
            />
            <button type="submit" className="btn-primary text-xs px-4">
              Speak
            </button>
          </form>
        )}
        
        {isWaiting && (
          <div className="mt-4 text-xs text-realm-gold animate-pulse text-center">
            {dialogueNpc?.name} is thinking...
          </div>
        )}

        {/* Skip typing */}
        {isTyping && (
          <button
            className="text-xs text-realm-text-muted mt-2 hover:text-white"
            onClick={() => {
              setTypedText(dialogueText);
              setIsTyping(false);
            }}
          >
            [Click to skip]
          </button>
        )}
      </div>
    </div>
  );
}
