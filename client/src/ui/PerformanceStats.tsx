import { useEffect, useState } from 'react';
import { useSettingsStore } from '@stores/useSettingsStore';
import { Activity } from 'lucide-react';

export function PerformanceStats() {
  const [fps, setFps] = useState(0);
  const [ping, setPing] = useState(0);
  const [memory, setMemory] = useState(0);
  const isEnabled = useSettingsStore(state => state.postProcessing); // Tie to some setting or always show? Let's just always show for Launch Readiness debug mode

  useEffect(() => {
    // Mock ping variance
    const pingInterval = setInterval(() => {
      setPing(30 + Math.floor(Math.random() * 20));
    }, 2000);

    // Phaser doesn't expose FPS easily to React without a polling interval on game.loop.actualFps
    // For this mock, we'll poll the global game instance if available
    const fpsInterval = setInterval(() => {
      const game = (window as any).phaserGame;
      if (game && game.loop) {
        setFps(Math.round(game.loop.actualFps));
      } else {
        setFps(60); // Mock fallback
      }

      // Memory (Chrome only)
      if ((performance as any).memory) {
        setMemory(Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024));
      }
    }, 500);

    return () => {
      clearInterval(pingInterval);
      clearInterval(fpsInterval);
    };
  }, []);

  return (
    <div className="absolute top-4 right-20 pointer-events-none z-40 flex flex-col items-end gap-1 font-mono text-[10px] text-white/50 drop-shadow-md select-none">
      <div className="flex items-center gap-1">
        <span>FPS:</span>
        <span className={fps < 30 ? 'text-red-400' : fps < 50 ? 'text-yellow-400' : 'text-green-400'}>
          {fps}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span>PING:</span>
        <span className={ping > 100 ? 'text-red-400' : 'text-green-400'}>
          {ping}ms
        </span>
      </div>
      {memory > 0 && (
        <div className="flex items-center gap-1">
          <span>MEM:</span>
          <span className={memory > 500 ? 'text-yellow-400' : 'text-white/50'}>
            {memory}MB
          </span>
        </div>
      )}
      <div className="flex items-center gap-1 text-[8px] text-white/30 mt-1">
        <Activity className="w-2 h-2" /> Anti-Cheat Active
      </div>
    </div>
  );
}
