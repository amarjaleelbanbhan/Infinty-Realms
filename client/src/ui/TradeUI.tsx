import { useState, useEffect } from 'react';
import { useTradeStore } from '@stores/useTradeStore';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';
import { Coins, Check, X, ArrowRightLeft } from 'lucide-react';

export function TradeUI() {
  const { isActive, partnerName, myOffer, partnerOffer, isLocked, isPartnerLocked, lockTrade, cancelTrade, removeItemFromOffer, setGoldOffer, updatePartnerOffer, setPartnerLocked } = useTradeStore();
  const { player } = useGameStore();
  
  const [goldInput, setGoldInput] = useState('');

  // --- Mock Partner Logic ---
  useEffect(() => {
    if (!isActive) return;

    const handleUpdate = () => {
      // If we are locked, partner will lock shortly after
      if (isLocked && !isPartnerLocked) {
        setTimeout(() => setPartnerLocked(true), 1500);
      }
      
      // Mock partner throwing in random gold if we update
      if (!isLocked && !isPartnerLocked && partnerOffer.gold === 0) {
        setTimeout(() => {
          updatePartnerOffer({ ...partnerOffer, gold: Math.floor(Math.random() * 100) + 10 });
        }, 2000);
      }
    };

    window.addEventListener('ir:trade_update_local', handleUpdate);
    window.addEventListener('ir:trade_lock_local', handleUpdate);

    return () => {
      window.removeEventListener('ir:trade_update_local', handleUpdate);
      window.removeEventListener('ir:trade_lock_local', handleUpdate);
    };
  }, [isActive, isLocked, isPartnerLocked, partnerOffer, setPartnerLocked, updatePartnerOffer]);
  // --------------------------

  if (!isActive || !player) return null;

  const handleGoldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(goldInput, 10);
    if (!isNaN(val) && val >= 0) {
      setGoldOffer(val);
      setGoldInput('');
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto animate-in fade-in">
      <div className="w-full max-w-4xl bg-slate-900 border-2 border-realm-border rounded-lg shadow-2xl flex flex-col overflow-hidden max-h-full">
        
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ArrowRightLeft className="w-6 h-6 text-realm-accent" />
            <h2 className="font-game text-xl text-white">Trade with {partnerName}</h2>
          </div>
          <button 
            onClick={cancelTrade}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden min-h-[400px]">
          
          {/* My Side */}
          <div className="flex-1 flex flex-col gap-4 border border-slate-700 rounded-md bg-slate-800/50 p-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <h3 className="font-game text-lg text-realm-text">Your Offer</h3>
              <div className="flex items-center gap-1 text-yellow-400 font-ui font-bold">
                <Coins className="w-4 h-4" /> {myOffer.gold}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-4 gap-2">
                {myOffer.items.map((offer, i) => (
                  <div 
                    key={i} 
                    onClick={() => removeItemFromOffer(offer.item.id, 1)}
                    className={
                      `relative aspect-square rounded border border-slate-600 bg-slate-800 flex items-center justify-center cursor-pointer hover:border-realm-accent transition-colors ${!isLocked ? "hover:bg-slate-700" : ""}`
                    }
                  >
                    <span className="text-2xl">{offer.item.icon}</span>
                    <div className="absolute bottom-1 right-1 text-xs font-bold text-white bg-black/80 px-1 rounded">
                      {offer.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!isLocked && (
              <form onSubmit={handleGoldSubmit} className="flex gap-2">
                <input 
                  type="number"
                  min="0"
                  max={player.gold || 0}
                  value={goldInput}
                  onChange={(e) => setGoldInput(e.target.value)}
                  placeholder={`Max: ${player.gold}`}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-ui"
                />
                <button type="submit" className="game-button text-sm px-3 py-1">Set Gold</button>
              </form>
            )}

            <button 
              onClick={lockTrade}
              disabled={isLocked}
              className={
                `w-full py-3 font-game text-lg tracking-wider rounded transition-colors flex justify-center items-center gap-2 ${
                isLocked 
                  ? "bg-green-600/20 text-green-400 border border-green-600"
                  : "game-button text-realm-text"
                }`
              }
            >
              {isLocked ? <><Check className="w-5 h-5"/> Ready</> : "Lock Offer"}
            </button>
          </div>

          {/* Partner Side */}
          <div className="flex-1 flex flex-col gap-4 border border-slate-700 rounded-md bg-slate-800/50 p-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <h3 className="font-game text-lg text-realm-text">{partnerName}'s Offer</h3>
              <div className="flex items-center gap-1 text-yellow-400 font-ui font-bold">
                <Coins className="w-4 h-4" /> {partnerOffer.gold}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-4 gap-2">
                {partnerOffer.items.map((offer, i) => (
                  <div 
                    key={i} 
                    className="relative aspect-square rounded border border-slate-600 bg-slate-800 flex items-center justify-center cursor-default"
                  >
                    <span className="text-2xl">{offer.item.icon}</span>
                    <div className="absolute bottom-1 right-1 text-xs font-bold text-white bg-black/80 px-1 rounded">
                      {offer.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-4 flex items-center justify-center">
               <div className={
                 `font-game text-lg px-4 py-2 rounded-full border border-dashed ${
                 isPartnerLocked ? "border-green-500 text-green-400" : "border-slate-500 text-slate-400"
                 }`
               }>
                 {isPartnerLocked ? `${partnerName} is Ready` : "Waiting for partner..."}
               </div>
            </div>
          </div>
        </div>
        
        <div className="p-2 text-center text-slate-400 text-xs font-ui bg-slate-900 border-t border-slate-800">
          Click items in your inventory below to add them to your offer. Click items in your offer to remove them.
        </div>
      </div>
    </div>
  );
}
