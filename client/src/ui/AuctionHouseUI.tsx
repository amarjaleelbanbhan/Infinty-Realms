import { useState, useEffect } from 'react';
import { useUIStore } from '@stores/useUIStore';
import { useGameStore } from '@stores/useGameStore';
import type { Item } from '@shared/types';
import { Landmark, X, HelpCircle } from 'lucide-react';

interface AuctionItem {
  id: string;
  sellerName: string;
  item: Item;
  buyoutPrice: number;
  currentBid: number;
  expiresAt: string;
}

export function AuctionHouseUI() {
  const { isAuctionHouseOpen, closeAuctionHouse, addToast } = useUIStore();
  const { playerToken, player } = useGameStore();
  const [activeTab, setActiveTab] = useState<'browse' | 'sell'>('browse');
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sellPrice, setSellPrice] = useState<string>('');
  const [selectedSellItem, setSelectedSellItem] = useState<Item | null>(null);

  useEffect(() => {
    if (isAuctionHouseOpen && activeTab === 'browse') {
      fetchAuctions();
    }
  }, [isAuctionHouseOpen, activeTab]);

  const fetchAuctions = async () => {
    if (!playerToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auction', {
        headers: { Authorization: `Bearer ${playerToken}` },
      });
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyout = async (auctionId: string, price: number) => {
    if (!playerToken || !player) return;
    if ((player.gold ?? 0) < price) {
      addToast('Not enough gold!', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/auction/${auctionId}/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${playerToken}` },
      });
      if (res.ok) {
        addToast('Item purchased successfully!', 'success');
        const { item } = await res.json();
        useGameStore.getState().addGold(-price);
        useGameStore.getState().addToInventory(item, 1);
        fetchAuctions();
      } else {
        const error = await res.json();
        addToast(error.message || 'Purchase failed', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSell = async () => {
    if (!playerToken || !selectedSellItem) return;
    const price = parseInt(sellPrice, 10);
    if (isNaN(price) || price <= 0) {
      addToast('Invalid price', 'error');
      return;
    }

    try {
      const res = await fetch('/api/auction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${playerToken}`,
        },
        body: JSON.stringify({ item: selectedSellItem, buyoutPrice: price }),
      });
      
      if (res.ok) {
        addToast('Item listed on auction house!', 'success');
        useGameStore.getState().removeFromInventory(selectedSellItem.id, 1);
        setSelectedSellItem(null);
        setSellPrice('');
        setActiveTab('browse');
      } else {
        const error = await res.json();
        addToast(error.message || 'Failed to list item', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isAuctionHouseOpen) return null;

  return (
    <div className="modal-overlay" onClick={closeAuctionHouse}>
      <div className="modal-content glass w-full max-w-4xl mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 border-b border-realm-border pb-4">
          <h2 className="font-game text-2xl text-realm-gold flex items-center gap-2"><Landmark className="w-6 h-6" /> Grand Auction House</h2>
          <button onClick={closeAuctionHouse} className="text-realm-text-muted hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex gap-4 mb-6">
          <button 
            className={`px-4 py-2 font-game tracking-wider rounded ${activeTab === 'browse' ? 'bg-realm-accent text-white' : 'bg-black/30 text-realm-text-muted'}`}
            onClick={() => setActiveTab('browse')}
          >
            Browse
          </button>
          <button 
            className={`px-4 py-2 font-game tracking-wider rounded ${activeTab === 'sell' ? 'bg-realm-accent text-white' : 'bg-black/30 text-realm-text-muted'}`}
            onClick={() => setActiveTab('sell')}
          >
            Sell Items
          </button>
        </div>

        {activeTab === 'browse' && (
          <div className="h-96 overflow-y-auto pr-2">
            {loading ? (
              <p className="text-center text-realm-text-muted mt-10">Fetching active auctions...</p>
            ) : items.length === 0 ? (
              <p className="text-center text-realm-text-muted mt-10">No items currently listed.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((auction) => (
                  <div key={auction.id} className="bg-black/40 border border-realm-border rounded p-4 flex gap-4">
                    <div className="w-16 h-16 rounded glass flex items-center justify-center text-3xl">
                      {auction.item.icon || <HelpCircle className="w-8 h-8 text-white/30" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-game text-white">{auction.item.name}</h4>
                          <p className="text-xs text-realm-text-muted">Seller: {auction.sellerName}</p>
                        </div>
                        <span className="text-sm text-realm-gold bg-realm-gold/10 px-2 py-1 rounded">
                          {auction.buyoutPrice}g
                        </span>
                      </div>
                      <p className="text-xs text-realm-text-muted mt-2 line-clamp-1">{auction.item.description}</p>
                      
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => handleBuyout(auction.id, auction.buyoutPrice)}
                          className="btn-primary text-xs py-1"
                          disabled={player?.name === auction.sellerName}
                        >
                          Buyout
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sell' && (
          <div className="grid grid-cols-2 gap-6 h-96">
            <div className="border border-realm-border bg-black/30 rounded p-4 overflow-y-auto">
              <h3 className="font-game text-realm-accent-light mb-4">Your Inventory</h3>
              <div className="space-y-2">
                {player?.inventory?.length === 0 && <p className="text-sm text-realm-text-muted">No items to sell.</p>}
                {player?.inventory?.map(slot => (
                  <div 
                    key={slot.item.id} 
                    className={`p-2 flex items-center gap-3 rounded cursor-pointer transition-colors ${selectedSellItem?.id === slot.item.id ? 'bg-realm-accent/20 border-realm-accent' : 'hover:bg-white/5 border border-transparent'}`}
                    onClick={() => setSelectedSellItem(slot.item)}
                  >
                    <span className="text-xl">{slot.item.icon}</span>
                    <span className="text-sm flex-1">{slot.item.name}</span>
                    <span className="text-xs text-realm-gold">{slot.item.value}g</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border border-realm-border bg-black/30 rounded p-4 flex flex-col items-center justify-center text-center relative">
              {!selectedSellItem ? (
                <p className="text-realm-text-muted">Select an item from your inventory to list it.</p>
              ) : (
                <div className="w-full max-w-sm">
                  <div className="text-6xl mb-4">{selectedSellItem.icon}</div>
                  <h3 className="font-game text-xl text-white mb-2">{selectedSellItem.name}</h3>
                  <p className="text-sm text-realm-text-muted mb-6">{selectedSellItem.description}</p>
                  
                  <div className="flex items-center gap-2 mb-6">
                    <label className="text-sm text-realm-gold whitespace-nowrap">Buyout Price (Gold):</label>
                    <input 
                      type="number"
                      min="1"
                      value={sellPrice}
                      onChange={e => setSellPrice(e.target.value)}
                      className="bg-black/50 border border-realm-border rounded px-3 py-2 text-white w-full focus:outline-none focus:border-realm-accent"
                      placeholder="e.g. 500"
                    />
                  </div>
                  
                  <button 
                    onClick={handleSell}
                    className="btn-gold w-full py-3"
                    disabled={!sellPrice || parseInt(sellPrice, 10) <= 0}
                  >
                    List Item on Auction House
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
