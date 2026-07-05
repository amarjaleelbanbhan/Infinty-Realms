import { useEffect, useRef } from 'react';
import { createPhaserGame } from './PhaserGame';

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createPhaserGame(containerRef.current);

    const handleResize = () => {
      game.scale.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      game.destroy(true);
    };
  }, []);

  return (
    <div
      id="game-canvas"
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, zIndex: 1 }}
    />
  );
}
