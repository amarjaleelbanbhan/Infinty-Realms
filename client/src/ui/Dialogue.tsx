import { useState } from 'react';
import { useUIStore } from '@stores/useUIStore';
import { useGameStore } from '@stores/useGameStore';
import { questSystem } from '@game/systems/QuestSystem';

export function Dialogue() {
  const { isDialogueOpen, closeDialogue, dialogueNpc, dialogueText, dialogueOptions, addToast } = useUIStore();
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

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
      questSystem.generateQuest({ npcName: dialogueNpc?.name });
      addToast('Quest offered!', 'success');
    }
    closeDialogue();
    setTypedText('');
  };

  const roleIcon: Record<string, string> = {
    merchant: '🏪', quest_giver: '❗', guard: '⚔️', villager: '👤', innkeeper: '🍺',
    blacksmith: '⚒️', mage: '🔮', healer: '💊', thief: '🗡️',
  };

  return (
    <div
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 w-full max-w-lg px-4 animate-slide-up"
      style={{ pointerEvents: 'auto' }}
    >
      {/* NPC Portrait + Name */}
      <div className="flex items-center gap-3 mb-2 ml-2">
        <div className="w-12 h-12 rounded-full glass flex items-center justify-center text-2xl border border-realm-accent/30">
          {roleIcon[dialogueNpc?.role ?? ''] ?? '🧙'}
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

        {!isTyping && dialogueOptions.length === 0 && (
          <button
            className="btn-secondary text-xs py-2 px-4 mt-4"
            onClick={() => { closeDialogue(); setTypedText(''); }}
          >
            Farewell
          </button>
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
