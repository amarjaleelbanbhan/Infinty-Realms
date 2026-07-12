import { usePartyStore } from '@stores/usePartyStore';
import { useGameStore } from '@stores/useGameStore';
import { Users, Crown, LogOut, UserX } from 'lucide-react';

export function PartyUI() {
  const { partyId, leaderId, members, removeMember, clearParty } = usePartyStore();
  const { player } = useGameStore();

  if (!partyId || members.length === 0) return null;

  const isLeader = player?.id === leaderId;

  const handleLeave = () => {
    // In a real implementation, send a socket event to server to leave party
    clearParty();
  };

  const handleKick = (memberId: string) => {
    // In a real implementation, send a socket event to server to kick member
    removeMember(memberId);
  };

  return (
    <div className="absolute top-1/4 left-4 flex flex-col gap-2 z-30 animate-in slide-in-from-left">
      <div className="bg-slate-900/80 border border-slate-700 p-2 rounded-t-lg backdrop-blur-md flex justify-between items-center shadow-md">
        <h3 className="text-white font-bold text-sm tracking-wide flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          Party ({members.length}/4)
        </h3>
        <button onClick={handleLeave} className="text-slate-400 hover:text-red-400 transition-colors" title="Leave Party">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex flex-col gap-2">
        {members.map(member => (
          <div key={member.id} className="bg-slate-900/80 border border-slate-700 p-3 rounded-lg backdrop-blur-md w-56 shadow-lg group">
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-1.5">
                {member.id === leaderId && <Crown className="w-3.5 h-3.5 text-yellow-500" />}
                <span className="text-white font-semibold text-sm truncate max-w-[100px]">
                  {member.name}
                </span>
                <span className="text-slate-400 text-xs">
                  Lv.{member.level}
                </span>
              </div>
              
              {isLeader && member.id !== player?.id && (
                <button onClick={() => handleKick(member.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all">
                  <UserX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/50">
              <div 
                className="bg-red-500 h-full rounded-full transition-all duration-300" 
                style={{ width: `${Math.max(0, Math.min(100, (member.hp / member.maxHp) * 100))}%` }} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
