import { useState, useEffect } from 'react';
import { usePartyStore } from '@stores/usePartyStore';
import { useTradeStore } from '@stores/useTradeStore';

export function PartyContextMenu() {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, playerId: string, playerName: string } | null>(null);

  useEffect(() => {
    const handleContextMenuEvent = (e: CustomEvent) => {
      setContextMenu(e.detail);
    };

    const handleClickOutside = () => {
      setContextMenu(null);
    };

    window.addEventListener('party-context-menu', handleContextMenuEvent as EventListener);
    window.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('party-context-menu', handleContextMenuEvent as EventListener);
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  if (!contextMenu) return null;

  const handleInvite = () => {
    // Sends a real 'partyInviteRequest' over the socket; the target's client
    // shows a PartyInvitePrompt and only joins once they genuinely accept.
    usePartyStore.getState().requestInvite(contextMenu.playerId, contextMenu.playerName);
    setContextMenu(null);
  };

  const handleTradeRequest = () => {
    // Sends a real 'tradeRequest' over the socket; the target's client shows a
    // TradeRequestPrompt and only opens the trade window once they accept.
    useTradeStore.getState().requestTrade(contextMenu.playerId, contextMenu.playerName);
    setContextMenu(null);
  };

  return (
    <div 
      className="fixed z-50 bg-slate-900 border border-slate-700 rounded-md shadow-xl py-1 w-48 animate-in fade-in duration-100"
      style={{ left: contextMenu.x, top: contextMenu.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-1.5 border-b border-slate-700/50">
        <p className="text-slate-300 text-xs font-semibold truncate">{contextMenu.playerName}</p>
      </div>
      <button 
        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-800 transition-colors"
        onClick={handleInvite}
      >
        Invite to Party
      </button>
      <button 
        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-800 transition-colors"
        onClick={handleTradeRequest}
      >
        Request Trade
      </button>
      <button 
        className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        onClick={() => setContextMenu(null)}
      >
        Cancel
      </button>
    </div>
  );
}
