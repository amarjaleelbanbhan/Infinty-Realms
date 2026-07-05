import { useEffect, useRef, useState } from 'react';
import { useUIStore } from '@stores/useUIStore';

interface JoystickState {
  x: number;
  y: number;
  originX: number;
  originY: number;
  active: boolean;
}

export function MobileControls() {
  const { isMobile, currentScreen, openInventory, openQuestLog, togglePause } = useUIStore();
  const [joystick, setJoystick] = useState<JoystickState>({ x: 0, y: 0, originX: 80, originY: 0, active: false });
  const animFrame = useRef<number>(0);

  // Poll joystick state from Phaser
  useEffect(() => {
    if (!isMobile) return;

    const poll = () => {
      const state = (window as Window & { __joystickState?: { dx: number; dy: number; originX: number; originY: number } | null }).__joystickState;
      if (state) {
        setJoystick({ x: state.dx, y: state.dy, originX: state.originX, originY: state.originY, active: true });
      } else {
        setJoystick((j) => ({ ...j, x: 0, y: 0, active: false }));
      }
      animFrame.current = requestAnimationFrame(poll);
    };
    animFrame.current = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(animFrame.current);
  }, [isMobile]);

  if (!isMobile || currentScreen !== 'game') return null;

  return (
    <>
      {/* Joystick (rendered at touch origin) */}
      {joystick.active && (
        <div
          className="joystick-base fixed pointer-events-none z-30"
          style={{
            left: joystick.originX - 60,
            top: joystick.originY - 60,
          }}
        >
          <div
            className="joystick-thumb"
            style={{
              transform: `translate(calc(-50% + ${joystick.x}px), calc(-50% + ${joystick.y}px))`,
            }}
          />
        </div>
      )}

      {/* Right-side action buttons */}
      <div className="fixed right-4 bottom-20 z-30 flex flex-col gap-3">
        <button
          className="w-14 h-14 rounded-full glass border border-realm-hp/50 flex items-center justify-center text-xl active:scale-90 transition-transform"
          style={{ boxShadow: '0 0 15px rgba(232,93,93,0.3)' }}
          onTouchStart={(e) => {
            e.preventDefault();
            // Trigger attack via Phaser event
            (window as Window & { __mobileAttack?: () => void }).__mobileAttack?.();
          }}
        >
          ⚔️
        </button>
        <button
          className="w-14 h-14 rounded-full glass border border-realm-accent/50 flex items-center justify-center text-xl active:scale-90 transition-transform"
          onTouchStart={(e) => {
            e.preventDefault();
            (window as Window & { __mobileInteract?: () => void }).__mobileInteract?.();
          }}
        >
          💬
        </button>
      </div>

      {/* Top-right quick buttons */}
      <div className="fixed right-4 top-20 z-30 flex flex-col gap-2">
        <button
          className="w-10 h-10 rounded-lg glass border border-realm-border flex items-center justify-center text-sm active:scale-90"
          onTouchStart={(e) => { e.preventDefault(); openInventory(); }}
        >
          🎒
        </button>
        <button
          className="w-10 h-10 rounded-lg glass border border-realm-border flex items-center justify-center text-sm active:scale-90"
          onTouchStart={(e) => { e.preventDefault(); openQuestLog(); }}
        >
          📜
        </button>
        <button
          className="w-10 h-10 rounded-lg glass border border-realm-border flex items-center justify-center text-sm active:scale-90"
          onTouchStart={(e) => { e.preventDefault(); togglePause(); }}
        >
          ⏸️
        </button>
      </div>
    </>
  );
}
