import { useState } from 'react';
import { useUIStore } from '@stores/useUIStore';
import { Gem, X, Feather, Skull, PawPrint, Flame } from 'lucide-react';

const COSMETICS = [
  { id: 'halo', name: 'Angelic Halo', price: 4.99, icon: 'feather' },
  { id: 'horns', name: 'Demonic Horns', price: 4.99, icon: 'skull' },
  { id: 'pet_dragon', name: 'Baby Dragon Pet', price: 9.99, icon: 'paw' },
  { id: 'aura_fire', name: 'Flame Aura', price: 6.99, icon: 'flame' },
];

const renderIcon = (iconName: string) => {
  switch (iconName) {
    case 'feather': return <Feather className="w-8 h-8 text-white" />;
    case 'skull': return <Skull className="w-8 h-8 text-red-500" />;
    case 'paw': return <PawPrint className="w-8 h-8 text-orange-400" />;
    case 'flame': return <Flame className="w-8 h-8 text-orange-600" />;
    default: return <Gem className="w-8 h-8 text-white" />;
  }
};

export function CosmeticShopUI({ onClose }: { onClose: () => void }) {
  const { addToast } = useUIStore();
  const [processing, setProcessing] = useState<string | null>(null);

  const handlePurchase = (id: string, name: string) => {
    setProcessing(id);
    // Mock Stripe payment
    setTimeout(() => {
      setProcessing(null);
      addToast(`Purchased ${name}! Thank you for supporting the realm.`, 'success');
    }, 1500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-realm-border pb-3 mb-4">
          <div>
            <h2 className="font-game text-xl text-white flex items-center gap-2"><Gem className="w-5 h-5 text-blue-400" /> Premium Shop</h2>
            <div className="text-xs text-realm-text-muted mt-1">Cosmetics only. No pay-to-win.</div>
          </div>
          <button onClick={onClose} className="text-realm-text-muted hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {COSMETICS.map((item) => (
            <div key={item.id} className="bg-black/30 border border-realm-accent/30 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:border-realm-accent transition-colors">
              <div className="mb-3 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                {renderIcon(item.icon)}
              </div>
              <div className="font-game text-sm text-white mb-1">{item.name}</div>
              <div className="font-mono text-realm-gold mb-3">${item.price.toFixed(2)}</div>
              
              <button
                onClick={() => handlePurchase(item.id, item.name)}
                disabled={processing === item.id}
                className={`w-full py-2 text-xs rounded transition-all ${
                  processing === item.id
                    ? 'bg-realm-text-muted text-black cursor-not-allowed'
                    : 'bg-realm-accent/20 border border-realm-accent text-realm-accent hover:bg-realm-accent hover:text-white'
                }`}
              >
                {processing === item.id ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
