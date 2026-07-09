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
import { CreatorPanel } from '@ui/CreatorPanel';
import { EventBanner } from '@ui/EventBanner';
import { SkillUI } from '@ui/SkillUI';
import { WorldMapUI } from '@ui/WorldMapUI';
import { KeybindPanel } from '@ui/KeybindPanel';
import { EcosystemUI } from '@ui/EcosystemUI';
import { CitadelBuilderUI } from '@ui/CitadelBuilderUI';
import { OfflineProgressUI } from '@ui/OfflineProgressUI';
import { ArenaUI } from '@ui/ArenaUI';
import { AscensionUI } from '@ui/AscensionUI';
import { GodInterventionUI } from '@ui/GodInterventionUI';
import { AuctionHouseUI } from '@ui/AuctionHouseUI';
import { HousingUI } from '@ui/HousingUI';
import { CosmeticShopUI } from '@ui/CosmeticShopUI';
import { CraftingUI } from '@ui/CraftingUI';
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
  const [showCreator, setShowCreator] = useState(false);
  const [showHousing, setShowHousing] = useState(false);
  const [showShop, setShowShop] = useState(false);

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
            <CraftingUI />
            <AuctionHouseUI />

            {/* Quick action buttons for Guild, Market, & Journal */}
            <div className="fixed top-4 left-[420px] z-20 flex gap-2">
              <button
                onClick={() => setShowShop(true)}
                className="glass px-3 py-1.5 text-xs font-mono text-realm-gold border border-realm-gold/40 hover:bg-realm-gold/10 transition-colors flex items-center gap-1"
              >
                💎 Premium Shop
              </button>
              <button
                onClick={() => setShowHousing(true)}
                className="glass px-3 py-1.5 text-xs font-mono text-realm-accent border border-realm-accent/40 hover:bg-realm-accent/10 transition-colors flex items-center gap-1"
              >
                🏡 Housing
              </button>
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
                onClick={() => useUIStore.getState().openAuctionHouse()}
                className="glass px-3 py-1.5 text-xs font-mono text-realm-gold border border-realm-gold/40 hover:bg-realm-gold/10 transition-colors flex items-center gap-1"
              >
                🏛️ Auction
              </button>
              <button
                onClick={() => setShowJournal(true)}
                className="glass px-3 py-1.5 text-xs font-mono text-realm-xp border border-realm-xp/40 hover:bg-realm-xp/10 transition-colors flex items-center gap-1"
              >
                📖 Chronicle
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('ir:open_arena'))}
                className="glass px-3 py-1.5 text-xs font-mono text-red-400 border border-red-400/40 hover:bg-red-400/10 transition-colors flex items-center gap-1"
              >
                ⚔️ Arena
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('ir:open_ascension'))}
                className="glass px-3 py-1.5 text-xs font-mono text-realm-gold border border-realm-gold/40 hover:bg-realm-gold/10 transition-colors flex items-center gap-1 shadow-[0_0_10px_rgba(255,215,0,0.5)]"
              >
                👑 Ascend
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('ir:open_intervention'))}
                className="glass px-3 py-1.5 text-xs font-mono text-realm-mana border border-realm-mana/40 hover:bg-realm-mana/10 transition-colors flex items-center gap-1"
              >
                🌌 God Spells
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
              <button
                onClick={() => setShowCreator(true)}
                className="glass px-3 py-1.5 text-xs font-mono text-realm-accent border border-realm-accent/40 hover:bg-realm-accent/10 transition-colors flex items-center gap-1"
              >
                ✨ Architect
              </button>
            </div>

            {showGuild && <GuildUI onClose={() => setShowGuild(false)} />}
            {showHousing && <HousingUI onClose={() => setShowHousing(false)} />}
            {showShop && <CosmeticShopUI onClose={() => setShowShop(false)} />}
            {showMarket && <MarketplaceUI onClose={() => setShowMarket(false)} />}
            {showJournal && <WorldJournalUI onClose={() => setShowJournal(false)} />}
            {showSkills && <SkillUI onClose={() => setShowSkills(false)} />}
            {showMap && <WorldMapUI onClose={() => setShowMap(false)} />}
            {showCreator && <CreatorPanel onClose={() => setShowCreator(false)} />}

            {/* Keyboard controls legend */}
            <KeybindPanel />
            
            <EcosystemUI />
            <CitadelBuilderUI />
            <OfflineProgressUI />
            <ArenaUI />
            <AscensionUI />
            <GodInterventionUI />
            <AuctionHouseUI />
          </>
        )}

        <ToastSystem />
      </div>
    </div>
  );
}
