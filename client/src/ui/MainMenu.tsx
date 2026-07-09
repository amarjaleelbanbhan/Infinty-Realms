import { useState } from 'react';
import { useGameStore } from '@stores/useGameStore';
import { startWorld } from '@game/PhaserGame';
import { saveSystem } from '@game/systems/SaveSystem';

import { MultiplayerMenu } from './MultiplayerMenu';
import { SettingsUI } from './SettingsUI';
import { CreatorToolsUI } from './CreatorToolsUI';

interface MainMenuProps {
  onStart: () => void;
}

const HERO_CLASSES = [
  { id: 'warrior', name: 'Warrior', icon: '⚔️', desc: 'Mighty strength, iron will', bonus: '+Attack +HP' },
  { id: 'mage', name: 'Mage', icon: '🔮', desc: 'Ancient knowledge, arcane power', bonus: '+Mana +Speed' },
  { id: 'rogue', name: 'Rogue', icon: '🗡️', desc: 'Swift shadows, deadly precision', bonus: '+Speed +Luck' },
  { id: 'ranger', name: 'Ranger', icon: '🏹', desc: 'Nature\'s child, far-seeing eye', bonus: '+Defense +Luck' },
];

export function MainMenu({ onStart }: MainMenuProps) {
  const [screen, setScreen] = useState<'main' | 'new' | 'class'>('main');
  const [playerName, setPlayerName] = useState('');
  const [selectedClass, setSelectedClass] = useState('warrior');
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [loading, setLoading] = useState(false);
  const { startSession } = useGameStore();
  const saveMeta = saveSystem.getSaveMeta();

  const handleNewGame = async () => {
    const name = playerName.trim() || 'Hero';
    setLoading(true);
    try {
      await startSession(name);
      const worldSeed = useGameStore.getState().worldState?.seed ?? 'default';
      startWorld(worldSeed);
      onStart();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    const save = saveSystem.load();
    if (save) {
      saveSystem.restoreFromSave(save);
      startWorld(save.world.seed);
      onStart();
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Particle overlay — handled by Phaser, this is just the React menu */}

      {screen === 'main' && (
        <div className="flex flex-col items-center gap-10 animate-slide-up bg-black/40 p-12 rounded-3xl backdrop-blur-md border border-white/10 shadow-2xl">
          {/* Title */}
          <div className="text-center mb-2">
            <h1 className="font-game text-6xl md:text-8xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-realm-accent mb-4 animate-pulse"
              style={{ filter: 'drop-shadow(0 0 30px rgba(108,99,255,0.6))' }}>
              INFINITY REALMS
            </h1>
            <p className="font-ui text-realm-accent-light tracking-[0.25em] text-sm uppercase font-semibold">
              Every session is different. Every decision changes your story.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-5 w-80">
            <button
              className="btn-gold text-lg py-4 shadow-[0_0_40px_rgba(255,215,0,0.5)] hover:scale-105 transition-transform duration-300 rounded-xl"
              onClick={() => setScreen('new')}
            >
              ✨ NEW ADVENTURE
            </button>

            {saveMeta && (
              <button className="btn-primary text-base py-3 rounded-xl shadow-lg hover:shadow-realm-accent/50 transition-all duration-300" onClick={handleContinue}>
                ▶️ CONTINUE
                <span className="text-xs text-white/80 ml-2 tracking-widest font-mono">
                  {saveMeta.playerName} LV.{saveMeta.level}
                </span>
              </button>
            )}

            <button
              className="btn-secondary text-sm py-3 rounded-xl hover:bg-white/5 transition-colors duration-300 border-white/20 hover:border-realm-accent"
              onClick={() => setShowMultiplayer(true)}
            >
              👥 MULTIPLAYER REALM
            </button>

            <div className="flex gap-4">
              <button
                className="btn-secondary flex-1 text-sm py-3 rounded-xl hover:bg-white/5 transition-colors duration-300 border-white/20 hover:border-realm-accent"
                onClick={() => setShowSettings(true)}
              >
                ⚙️ Settings
              </button>

              <button
                className="btn-secondary flex-1 text-sm py-3 rounded-xl hover:bg-white/5 transition-colors duration-300 border-white/20 hover:border-realm-accent"
                onClick={() => setShowCreator(true)}
              >
                🎨 CREATOR TOOLS
              </button>
            </div>

            <a
              href="https://github.com/amarjaleelbanbhan/Infinty-Realms"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-sm py-3 rounded-xl hover:bg-white/5 transition-colors duration-300 border-white/20 hover:border-realm-accent mt-2 text-center"
            >
              ⭐ GITHUB
            </a>
          </div>

          {/* Footer info */}
          <div className="text-center text-xs text-realm-border mt-4">
            <p>🌍 Procedurally generated • 🤖 AI-powered • ♾️ Infinite replayability</p>
          </div>
        </div>
      )}

      {screen === 'new' && (
        <div className="glass p-8 w-full max-w-sm mx-4 animate-slide-up">
          <h2 className="font-game text-3xl text-transparent bg-clip-text bg-gradient-to-r from-white to-realm-accent mb-6 text-center animate-pulse glow-accent" style={{ textShadow: '0 0 10px rgba(108, 99, 255, 0.5)' }}>Your Hero</h2>

          {/* Name input */}
          <div className="mb-6">
            <label className="block font-ui text-xs text-realm-text-muted mb-2 uppercase tracking-widest font-bold">
              Hero Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
              placeholder="Enter your name..."
              maxLength={20}
              className="w-full bg-realm-bg/50 border-2 border-realm-border rounded-lg px-4 py-3 text-white font-ui text-sm focus:outline-none focus:border-realm-accent transition-all duration-300 focus:shadow-[0_0_15px_rgba(108,99,255,0.4)]"
              onKeyDown={(e) => e.key === 'Enter' && setScreen('class')}
            />
          </div>

          <div className="flex gap-3">
            <button className="btn-secondary flex-1 text-sm font-bold" onClick={() => setScreen('main')}>
              ← Back
            </button>
            <button
              className="btn-primary flex-1 text-sm shadow-[0_0_20px_rgba(108,99,255,0.5)]"
              onClick={() => setScreen('class')}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {screen === 'class' && (
        <div className="glass p-8 w-full max-w-lg mx-4 animate-slide-up">
          <h2 className="font-game text-2xl text-white mb-6 text-center">Choose Your Path</h2>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {HERO_CLASSES.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls.id)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                  selectedClass === cls.id
                    ? 'border-realm-accent bg-realm-accent/10 shadow-glow'
                    : 'border-realm-border bg-realm-surface hover:border-realm-accent/50'
                }`}
              >
                <div className="text-2xl mb-2">{cls.icon}</div>
                <div className="font-game text-sm text-white mb-1">{cls.name}</div>
                <div className="font-ui text-xs text-realm-text-muted mb-2">{cls.desc}</div>
                <div className="font-mono text-xs text-realm-xp">{cls.bonus}</div>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button className="btn-secondary flex-1 text-sm" onClick={() => setScreen('new')} disabled={loading}>
              ← Back
            </button>
            <button className="btn-gold flex-1 text-sm disabled:opacity-50" onClick={handleNewGame} disabled={loading}>
              {loading ? 'Connecting to Realm...' : 'Begin Journey ✨'}
            </button>
          </div>
        </div>
      )}

      {showMultiplayer && <MultiplayerMenu onClose={() => setShowMultiplayer(false)} />}
      {showSettings && <SettingsUI onClose={() => setShowSettings(false)} />}
      {showCreator && <CreatorToolsUI onClose={() => setShowCreator(false)} />}
    </div>
  );
}
