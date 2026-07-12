import { useState } from 'react';
import { useGameStore } from '@stores/useGameStore';
import { useI18nStore } from '@stores/useI18nStore';
import { startWorld } from '@game/PhaserGame';
import { saveSystem } from '@game/systems/SaveSystem';
import { Sparkles, Play, Users, Settings, Palette, Star, Globe, Bot, Infinity as InfinityIcon, Sword, Wand2, Crosshair, Target } from 'lucide-react';

import { MultiplayerMenu } from './MultiplayerMenu';
import { SettingsUI } from './SettingsUI';
import { CreatorToolsUI } from './CreatorToolsUI';

interface MainMenuProps {
  onStart: () => void;
}

const HERO_CLASSES = [
  { id: 'warrior', name: 'Warrior', icon: Sword, desc: 'Mighty strength, iron will', bonus: '+Attack +HP' },
  { id: 'mage', name: 'Mage', icon: Wand2, desc: 'Ancient knowledge, arcane power', bonus: '+Mana +Speed' },
  { id: 'rogue', name: 'Rogue', icon: Crosshair, desc: 'Swift shadows, deadly precision', bonus: '+Speed +Luck' },
  { id: 'ranger', name: 'Ranger', icon: Target, desc: 'Nature\'s child, far-seeing eye', bonus: '+Defense +Luck' },
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
  const { t } = useI18nStore();
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
        <div className="flex flex-col items-center gap-10 animate-slide-up premium-glass premium-border p-12 max-w-xl w-full mx-4 text-center">
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
              className="btn-gold text-lg py-4 shadow-[0_0_40px_rgba(255,215,0,0.5)] hover:scale-105 transition-transform duration-300 rounded-xl flex items-center justify-center gap-2"
              onClick={() => setScreen('new')}
            >
              <Sparkles className="w-5 h-5" /> {t('menu.play')}
            </button>

            {saveMeta && (
              <button className="btn-primary text-base py-3 rounded-xl shadow-lg hover:shadow-realm-accent/50 transition-all duration-300 flex items-center justify-center gap-2" onClick={handleContinue}>
                <Play className="w-4 h-4" /> CONTINUE
                <span className="text-xs text-white/80 ml-2 tracking-widest font-mono">
                  {saveMeta.playerName} LV.{saveMeta.level}
                </span>
              </button>
            )}

            <button
              className="btn-secondary text-sm py-3 rounded-xl hover:bg-white/5 transition-colors duration-300 border-white/20 hover:border-realm-accent flex items-center justify-center gap-2"
              onClick={() => setShowMultiplayer(true)}
            >
              <Users className="w-4 h-4" /> MULTIPLAYER REALM
            </button>

            <div className="flex gap-4">
              <button
                className="btn-secondary flex-1 text-sm py-3 rounded-xl hover:bg-white/5 transition-colors duration-300 border-white/20 hover:border-realm-accent flex items-center justify-center gap-2"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="w-4 h-4" /> {t('menu.settings')}
              </button>

              <button
                className="btn-secondary flex-1 text-sm py-3 rounded-xl hover:bg-white/5 transition-colors duration-300 border-white/20 hover:border-realm-accent flex items-center justify-center gap-2"
                onClick={() => setShowCreator(true)}
              >
                <Palette className="w-4 h-4" /> CREATOR TOOLS
              </button>
            </div>

            <a
              href="https://github.com/amarjaleelbanbhan/Infinty-Realms"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-sm py-3 rounded-xl hover:bg-white/5 transition-colors duration-300 border-white/20 hover:border-realm-accent mt-2 text-center flex items-center justify-center gap-2"
            >
              <Star className="w-4 h-4" /> GITHUB
            </a>
          </div>

          {/* Footer info */}
          <div className="text-center text-xs text-realm-border mt-4 flex items-center justify-center gap-3">
            <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Procedurally generated</span> •
            <span className="flex items-center gap-1"><Bot className="w-3 h-3" /> AI-powered</span> •
            <span className="flex items-center gap-1"><InfinityIcon className="w-3 h-3" /> Infinite replayability</span>
          </div>
        </div>
      )}

      {screen === 'new' && (
        <div className="flex flex-col items-center gap-6 animate-slide-up premium-glass premium-border p-12 max-w-xl w-full mx-4 text-center">
          <h2 className="font-game text-3xl text-transparent bg-clip-text bg-gradient-to-r from-white to-realm-accent mb-6 text-center animate-pulse glow-accent" style={{ textShadow: '0 0 10px rgba(108, 99, 255, 0.5)' }}>Your Hero</h2>

          {/* Name input */}
          <div className="mb-6 w-full">
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

          <div className="flex gap-3 w-full">
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
        <div className="premium-glass premium-border p-8 w-full max-w-lg mx-4 animate-slide-up">
          <h2 className="font-game text-2xl text-white mb-6 text-center">Choose Your Path</h2>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {HERO_CLASSES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedClass(c.id)}
                className={`p-6 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${
                  selectedClass === c.id
                    ? 'border-realm-accent bg-realm-accent/20 shadow-[0_0_30px_rgba(108,99,255,0.4)] transform -translate-y-2'
                    : 'border-white/10 bg-black/40 hover:border-white/30 hover:bg-white/5'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-realm-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-4 mb-2 relative z-10">
                  <c.icon className={`w-8 h-8 ${selectedClass === c.id ? 'text-realm-accent' : 'text-white/60'}`} />
                  <span className="font-game text-xl text-white tracking-wider">{c.name}</span>
                </div>
                <div className="font-ui text-xs text-realm-text-muted mb-2">{c.desc}</div>
                <div className="font-mono text-xs text-realm-xp">{c.bonus}</div>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button className="btn-secondary flex-1 text-sm" onClick={() => setScreen('new')} disabled={loading}>
              ← Back
            </button>
            <button className="btn-gold flex-1 text-sm disabled:opacity-50 flex items-center justify-center gap-2" onClick={handleNewGame} disabled={loading}>
              {loading ? 'Connecting to Realm...' : 'Begin Journey'} <Sparkles className="w-4 h-4" />
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
