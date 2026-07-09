import { useState, useEffect } from 'react';
import { socketManager } from '@game/systems/SocketManager';
import { useUIStore } from '@stores/useUIStore';
import { Users, Crown } from 'lucide-react';

interface PublicLobby {
  id: string;
  hostPlayerId: string;
  playerIds: string[];
  maxPlayers: number;
  worldSeed: string;
}

export function MultiplayerMenu({ onClose }: { onClose: () => void }) {
  const [roomInput, setRoomInput] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [publicLobbies, setPublicLobbies] = useState<PublicLobby[]>([]);
  const { addToast } = useUIStore();

  const fetchPublicLobbies = async () => {
    try {
      const res = await fetch('/api/multiplayer/rooms');
      if (res.ok) {
        const list = await res.json();
        setPublicLobbies(list);
      }
    } catch (err) {
      console.warn('[MultiplayerMenu] Failed to fetch public lobbies:', err);
    }
  };

  useEffect(() => {
    fetchPublicLobbies();
    const interval = setInterval(fetchPublicLobbies, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = async () => {
    setLoading(true);
    try {
      const code = await socketManager.createRoom(isPublic);
      setCreatedCode(code);
      addToast(`Room created: ${code}`, 'success');
      fetchPublicLobbies();
    } catch {
      addToast('Failed to create room', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (codeToJoin: string) => {
    if (!codeToJoin.trim()) return;
    setLoading(true);
    try {
      await socketManager.joinRoom(codeToJoin.trim());
      onClose();
    } catch (e) {
      addToast(typeof e === 'string' ? e : 'Join failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass p-6 w-full max-w-md mx-4 text-center flex flex-col max-h-[85vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-game text-xl text-white mb-4 flex items-center justify-center gap-2"><Users className="w-5 h-5 text-realm-accent" /> Multiplayer Realm Lobby</h2>

        {createdCode ? (
          <div className="bg-realm-surface border border-realm-accent/40 rounded-xl p-4 mb-6">
            <p className="text-xs text-realm-text-muted mb-1">Your Invite Code</p>
            <p className="font-mono text-2xl text-realm-gold font-bold tracking-widest">{createdCode}</p>
            <p className="text-xs text-realm-accent mt-2">
              Share this code with your friends or let players join from the public registry!
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-1 text-left">
            {/* Create Room Controls */}
            <div className="bg-realm-surface border border-realm-border rounded-xl p-4">
              <h3 className="font-game text-xs text-white mb-3">Host a New Room</h3>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-realm-text-muted">List room publicly?</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-realm-bg peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:width-4 after:transition-all peer-checked:bg-realm-accent"></div>
                </label>
              </div>
              <button
                onClick={handleCreateRoom}
                disabled={loading}
                className="btn-gold w-full text-xs py-2 flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4" /> Host Room
              </button>
            </div>

            {/* Direct Connect */}
            <div className="bg-realm-surface border border-realm-border rounded-xl p-4">
              <h3 className="font-game text-xs text-white mb-2">Direct Connection</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                  placeholder="ABCD-93KF"
                  maxLength={9}
                  className="flex-1 bg-realm-bg border border-realm-border rounded-lg px-3 py-1.5 font-mono text-center text-sm text-white focus:outline-none focus:border-realm-accent"
                />
                <button
                  onClick={() => handleJoinRoom(roomInput)}
                  disabled={loading || !roomInput.trim()}
                  className="btn-primary text-xs px-4"
                >
                  Join Code
                </button>
              </div>
            </div>

            {/* Public Lobbies Browser */}
            <div className="bg-realm-surface border border-realm-border rounded-xl p-4 flex-1 flex flex-col min-h-[160px]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-game text-xs text-white">Public Lobbies ({publicLobbies.length})</h3>
                <button
                  onClick={fetchPublicLobbies}
                  className="text-[10px] text-realm-accent hover:underline"
                >
                  Refresh
                </button>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[180px] flex-1">
                {publicLobbies.map((lobby) => (
                  <div
                    key={lobby.id}
                    className="bg-realm-bg border border-realm-border rounded-lg p-2.5 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono text-xs text-realm-gold">{lobby.id}</div>
                      <div className="text-[10px] text-realm-text-muted mt-0.5">
                        Players: {lobby.playerIds.length} / {lobby.maxPlayers}
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoinRoom(lobby.id)}
                      disabled={loading || lobby.playerIds.length >= lobby.maxPlayers}
                      className="btn-primary text-[10px] py-1 px-3"
                    >
                      Join
                    </button>
                  </div>
                ))}

                {publicLobbies.length === 0 && (
                  <div className="text-center py-6 text-xs text-realm-text-muted font-ui">
                    No active public lobbies found. Host one above!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <button className="btn-secondary w-full text-xs" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
