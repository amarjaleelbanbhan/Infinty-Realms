import { useGameStore } from '@stores/useGameStore';

export function DeathOverlay() {
  const isDead = useGameStore(state => state.isDead);
  const respawn = useGameStore(state => state.respawn);

  if (!isDead) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 pointer-events-auto transition-opacity duration-1000">
      <h1 className="text-6xl font-game text-red-600 mb-4 tracking-[0.2em] drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">YOU DIED</h1>
      <p className="text-realm-text-muted font-ui mb-8">You lost 10% of your gold.</p>
      
      <button 
        onClick={() => {
          respawn();
          // Dispatch event to force Phaser to move the sprite
          window.dispatchEvent(new CustomEvent('ir:respawn'));
        }}
        className="game-button px-8 py-3 text-lg group"
      >
        <span className="relative z-10 font-game tracking-wider text-red-100 group-hover:text-white">
          RESPAWN AT CITADEL
        </span>
      </button>
    </div>
  );
}
