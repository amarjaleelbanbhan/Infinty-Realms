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
import { useUIStore } from '@stores/useUIStore';

export default function App() {
  const { currentScreen, setScreen } = useUIStore();
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    // Check mobile screen size
    const checkMobile = () => {
      useUIStore.getState().setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
            <QuestLog />
            <Inventory />
            <Dialogue />
            <PauseMenu />
            <MobileControls />
            <Chat />
            <LeylineUI />
          </>
        )}

        <ToastSystem />
      </div>
    </div>
  );
}
