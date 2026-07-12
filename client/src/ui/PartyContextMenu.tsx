import { useState, useEffect } from 'react';
import { usePartyStore } from '@stores/usePartyStore';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';

export function PartyContextMenu() {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, playerId: string, playerName: string } | null>(null);
  const { setParty, members } = usePartyStore();
  const { player } = useGameStore();
  const addToast = useUIStore(s => s.addToast);

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
    // Simulated Party Invite for now. In a real system, emit a socket.io event.
    if (!player) return;
    
    // Simulate accepting the invite immediately
    if (members.length === 0) {
      // Create new party
      const newPartyId = `party-${Date.now()}`;
      setParty(newPartyId, player.id as string, [
        { id: player.id as string, name: player.name as string, level: 1, hp: 100, maxHp: 100 },
        { id: contextMenu.playerId, name: contextMenu.playerName, level: 1, hp: 100, maxHp: 100 }
      ]);
    } else {
      // Add to existing party
      const newMembers = [...members, { id: contextMenu.playerId, name: contextMenu.playerName, level: 1, hp: 100, maxHp: 100 }];
      const state = usePartyStore.getState();
      state.setParty(state.partyId as string, state.leaderId as string, newMembers);
    }
    
    addToast(`Invited ${contextMenu.playerName} to party!`, 'success');
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
        className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        onClick={() => setContextMenu(null)}
      >
        Cancel
      </button>
    </div>
  );
}
