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
import { ActionMenu } from '@ui/ActionMenu';
import { SkillUI } from '@ui/SkillUI';
import { SkillTree } from '@ui/SkillTree';
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
import { DungeonEntryUI } from '@ui/DungeonEntryUI';
import { DungeonHUD } from '@ui/DungeonHUD';
import { PartyUI } from '@ui/PartyUI';
import { PartyContextMenu } from '@ui/PartyContextMenu';
import { eventSystem } from '@game/systems/EventSystem';
import { useUIStore } from '@stores/useUIStore';

export default function App() {
  const {
    currentScreen,
    setScreen,
    isInventoryOpen,
    isQuestLogOpen,
    isMapOpen,
    isMerchantShopOpen,
    isAuctionHouseOpen,
    isCraftingOpen,
    isSkillTreeOpen,
    isDialogueOpen
  } = useUIStore();
  const [gameStarted, setGameStarted] = useState(false);
  const [showGuild, setShowGuild] = useState(false);
  const [showMarket, setShowMarket] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [showHousing, setShowHousing] = useState(false);
  const [showShop, setShowShop] = useState(false);

  const isStoreModalOpen = isInventoryOpen || isQuestLogOpen || isMapOpen || isMerchantShopOpen || isAuctionHouseOpen || isCraftingOpen || isSkillTreeOpen || isDialogueOpen;
  const isLocalModalOpen = showGuild || showMarket || showJournal || showSkills || showMap || showCreator || showHousing || showShop;
  const isAnyModalOpen = isStoreModalOpen || isLocalModalOpen || currentScreen === 'pause';

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
            {/* Main HUD Layer (Fades out when a modal is open) */}
            <div className={`transition-all duration-300 ${isAnyModalOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <HUD />
              <EventBanner />
              <MobileControls />
              <Chat />
              <LeylineUI />
              <ActionMenu 
                onOpenShop={() => setShowShop(true)}
                onOpenHousing={() => setShowHousing(true)}
                onOpenGuild={() => setShowGuild(true)}
                onOpenMarket={() => setShowMarket(true)}
                onOpenJournal={() => setShowJournal(true)}
                onOpenSpells={() => setShowSkills(true)}
                onOpenMap={() => setShowMap(true)}
                onOpenCreator={() => setShowCreator(true)}
              />
              <DungeonHUD />
              <PartyUI />
              <PartyContextMenu />
            </div>

            {/* Modals Layer */}
            <QuestLog />
            <Inventory />
            <Dialogue />
            <MerchantShopUI />
            {currentScreen === 'pause' && <PauseMenu />}
            <CraftingUI />
            <DungeonEntryUI />
            <AuctionHouseUI />

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
            <SkillTree />
          </>
        )}

        <ToastSystem />
      </div>
    </div>
  );
}
