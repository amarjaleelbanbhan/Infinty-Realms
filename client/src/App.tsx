import { useState, useEffect } from 'react';
import { GameCanvas } from '@game/GameCanvas';
import { HUD } from '@ui/HUD';
import { MainMenu } from '@ui/MainMenu';
import { QuestLog } from '@ui/QuestLog';
import { Inventory } from '@ui/Inventory';
import { Dialogue } from '@ui/Dialogue';
import { PauseMenu } from '@ui/PauseMenu';
import { ToastSystem } from '@ui/ToastSystem';
import { MobileControls } from '@ui/MobileControls';
import { Chat } from '@ui/Chat';
import { LeylineUI } from '@ui/LeylineUI';
import { GuildUI } from '@ui/GuildUI';
import { MarketplaceUI } from '@ui/MarketplaceUI';
import { WorldJournalUI } from '@ui/WorldJournalUI';
import { MerchantShopUI } from '@ui/MerchantShopUI';
import { EventBanner } from '@ui/EventBanner';
import { SkillUI } from '@ui/SkillUI';
import { WorldMapUI } from '@ui/WorldMapUI';
import { KeybindPanel } from '@ui/KeybindPanel';
import { eventSystem } from '@game/systems/EventSystem';
import { useUIStore } from '@stores/useUIStore';

export default function App() {
  const { currentScreen, setScreen } = useUIStore();
  const [gameStarted, setGameStarted] = useState(false);
  const [showGuild, setShowGuild] = useState(false);
  const [showMarket, setShowMarket] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    // Check mobile screen size
    const checkMobile = () => {
      useUIStore.getState().setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Start world event engine
    eventSystem.start();

    // M key from WorldScene toggles map
    const onToggleMap = () => setShowMap((v) => !v);
    window.addEventListener('ir:togglemap', onToggleMap);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('ir:togglemap', onToggleMap);
      eventSystem.stop();
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-realm-bg select-none">
      {/* Phaser Canvas */}
      <GameCanvas />

      {/* React UI Overlay Layer */}
      <div id="ui-layer">
        {!gameStarted || currentScreen === 'menu' ? (
          <MainMenu onStart={() => setGameStarted(true)} />
        ) : (
          <>
            <HUD />
            <EventBanner />
            <QuestLog />
            <Inventory />
            <Dialogue />
            <MerchantShopUI />
            <PauseMenu />
            <MobileControls />
            <Chat />
            <LeylineUI />

            {/* Quick action buttons for Guild, Market, & Journal */}
            <div className="fixed top-4 left-[420px] z-20 flex gap-2">
              <button
                onClick={() => setShowGuild(true)}
                className="glass px-3 py-1.5 text-xs font-mono text-realm-accent border border-realm-accent/40 hover:bg-realm-accent/10 transition-colors flex items-center gap-1"
              >
                🏰 Guild
              </button>
              <button
                onClick={() => setShowMarket(true)}
                className="glass px-3 py-1.5 text-xs font-mono text-realm-gold border border-realm-gold/40 hover:bg-realm-gold/10 transition-colors flex items-center gap-1"
              >
                🏪 Bazaar
              </button>
              <button
                onClick={() => setShowJournal(true)}
                className="glass px-3 py-1.5 text-xs font-mono text-realm-xp border border-realm-xp/40 hover:bg-realm-xp/10 transition-colors flex items-center gap-1"
              >
                📖 Chronicle
              </button>
              <button
                onClick={() => setShowSkills(true)}
                className="glass px-3 py-1.5 text-xs font-mono text-realm-mana border border-realm-mana/40 hover:bg-realm-mana/10 transition-colors flex items-center gap-1"
              >
                🔮 Spells
              </button>
              <button
                onClick={() => setShowMap(true)}
                className="glass px-3 py-1.5 text-xs font-mono text-realm-gold border border-realm-gold/40 hover:bg-realm-gold/10 transition-colors flex items-center gap-1"
              >
                🗺️ Map
              </button>
            </div>

            {showGuild && <GuildUI onClose={() => setShowGuild(false)} />}
            {showMarket && <MarketplaceUI onClose={() => setShowMarket(false)} />}
            {showJournal && <WorldJournalUI onClose={() => setShowJournal(false)} />}
            {showSkills && <SkillUI onClose={() => setShowSkills(false)} />}
            {showMap && <WorldMapUI onClose={() => setShowMap(false)} />}

            {/* Keyboard controls legend */}
            <KeybindPanel />
          </>
        )}

        <ToastSystem />
      </div>
    </div>
  );
}
