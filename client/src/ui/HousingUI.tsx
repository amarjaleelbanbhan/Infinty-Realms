import { useState } from 'react';
import { useUIStore } from '@stores/useUIStore';

export function HousingUI({ onClose }: { onClose: () => void }) {
  const [ownsHouse, setOwnsHouse] = useState(false);

  const handleBuy = () => {
    // Mock purchase
    setOwnsHouse(true);
    useUIStore.getState().addToast('Purchased a Cozy Shack!', 'success');
  };

  const handleEnter = () => {
    // Fire event to enter housing scene
    const game = (window as Window & { __phaserGame?: Phaser.Game }).__phaserGame;
    if (game) {
      game.scene.getScene('WorldScene')?.scene.stop();
      game.scene.start('HousingScene');
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-realm-border pb-3 mb-4">
          <h2 className="font-game text-xl text-white">🏡 Player Housing</h2>
          <button onClick={onClose} className="text-realm-text-muted hover:text-white">✕</button>
        </div>

        {ownsHouse ? (
          <div className="space-y-4">
            <p className="text-sm text-realm-text-muted">You own a Cozy Shack.</p>
            <button onClick={handleEnter} className="btn-primary w-full py-2">
              Enter House
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-realm-text-muted">Purchase your own personal instance.</p>
            <div className="bg-black/30 p-3 rounded flex justify-between items-center">
              <span className="font-game text-white">Cozy Shack</span>
              <span className="font-mono text-realm-gold">500g</span>
            </div>
            <button onClick={handleBuy} className="btn-gold w-full py-2">
              Buy Plot
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
