import { useState } from 'react';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';
import { Swords, X } from 'lucide-react';

export function ArenaUI() {
  const [isOpen, setIsOpen] = useState(false);
  const { player } = useGameStore();
  const [log, setLog] = useState<string[]>([]);
  const [result, setResult] = useState<'win' | 'loss' | null>(null);

  // Hook to open arena from outside
  useState(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('ir:open_arena', handleOpen);
    return () => window.removeEventListener('ir:open_arena', handleOpen);
  });

  if (!isOpen || !player || !player.stats) return null;

  const handleFight = () => {
    // Generate a random ghost based on player level
    const pLevel = player.level || 1;
    const ghostLevel = Math.max(1, pLevel + Math.floor(Math.random() * 3) - 1);
    const ghostHp = ghostLevel * 100;
    const ghostAttack = ghostLevel * 10;
    const ghostDefense = ghostLevel * 5;

    let myHp = player.stats!.maxHp;
    let enemyHp = ghostHp;
    const combatLog: string[] = [];
    combatLog.push(`Challenged Ghost Hero Lv.${ghostLevel}!`);

    let turn = 0;
    while (myHp > 0 && enemyHp > 0 && turn < 20) {
      turn++;
      // My attack
      const myDmg = Math.max(1, player.stats!.attack - ghostDefense);
      enemyHp -= myDmg;
      combatLog.push(`You dealt ${myDmg} damage to the Ghost.`);

      if (enemyHp <= 0) break;

      // Enemy attack
      const enemyDmg = Math.max(1, ghostAttack - player.stats!.defense);
      myHp -= enemyDmg;
      combatLog.push(`Ghost dealt ${enemyDmg} damage to you.`);
    }

    setLog(combatLog);
    if (myHp > 0) {
      setResult('win');
      useGameStore.getState().addGold(ghostLevel * 50);
      useGameStore.getState().addExperience(ghostLevel * 100);
      useUIStore.getState().addToast(`You won! +${ghostLevel * 50} Gold`, 'success');
    } else {
      setResult('loss');
      useUIStore.getState().addToast('You were defeated by the Ghost.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass p-8 max-w-2xl w-full border-realm-gold">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-game text-3xl text-realm-gold flex items-center gap-3"><Swords className="w-8 h-8" /> Arena of Spirits</h2>
          <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-realm-text-muted mb-6">
          Challenge the ghosts of other heroes in asynchronous combat.
          Your current power level is {player.level}.
        </p>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="p-4 bg-black/40 rounded border border-realm-border">
            <h3 className="font-game text-xl text-white mb-2">Your Hero</h3>
            <ul className="space-y-1 text-sm font-mono text-realm-text-muted">
              <li>HP: {player.stats!.maxHp}</li>
              <li>ATK: {player.stats!.attack}</li>
              <li>DEF: {player.stats!.defense}</li>
            </ul>
          </div>

          <div className="p-4 bg-black/40 rounded border border-realm-gold/50 flex flex-col justify-center items-center">
            <button
              className="btn-gold w-full text-lg py-4 flex items-center justify-center gap-3"
              onClick={handleFight}
            >
              <Swords className="w-5 h-5" /> Find Opponent
            </button>
          </div>
        </div>

        {log.length > 0 && (
          <div className="p-4 bg-black/60 rounded border border-realm-border h-48 overflow-y-auto mb-4 font-mono text-sm">
            {log.map((l, i) => (
              <div key={i} className="text-realm-text-muted mb-1">
                {l}
              </div>
            ))}
          </div>
        )}

        {result && (
          <div className={`p-4 text-center font-bold text-xl rounded ${result === 'win' ? 'bg-realm-xp/20 text-realm-xp' : 'bg-red-900/40 text-red-400'}`}>
            {result === 'win' ? 'VICTORY!' : 'DEFEAT'}
          </div>
        )}
      </div>
    </div>
  );
}
