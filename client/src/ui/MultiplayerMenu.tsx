import { useState } from 'react';
import { socketManager } from '@game/systems/SocketManager';
import { useUIStore } from '@stores/useUIStore';

export function MultiplayerMenu({ onClose }: { onClose: () => void }) {
  const [roomInput, setRoomInput] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useUIStore();

  const handleCreateRoom = async () => {
    setLoading(true);
    try {
      const code = await socketManager.createRoom(true);
      setCreatedCode(code);
      addToast(`Room created: ${code}`, 'success');
    } catch {
      addToast('Failed to create room', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomInput.trim()) return;
    setLoading(true);
    try {
      await socketManager.joinRoom(roomInput.trim());
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
        className="modal-content glass p-6 w-full max-w-sm mx-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-game text-xl text-white mb-4">👥 Multiplayer Realm</h2>

        {createdCode ? (
          <div className="bg-realm-surface border border-realm-accent/40 rounded-xl p-4 mb-4">
            <p className="text-xs text-realm-text-muted mb-1">Your Invite Code</p>
            <p className="font-mono text-2xl text-realm-gold font-bold tracking-widest">{createdCode}</p>
            <p className="text-xs text-realm-accent mt-2">Share this code with your friends to join your world!</p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="btn-gold w-full text-sm py-3"
            >
              👑 Host Room
            </button>

            <div className="flex items-center gap-2 text-xs text-realm-border my-2">
              <div className="flex-1 h-px bg-realm-border" />
              <span>OR</span>
              <div className="flex-1 h-px bg-realm-border" />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                placeholder="ABCD-93KF"
                maxLength={9}
                className="flex-1 bg-realm-bg border border-realm-border rounded-lg px-3 py-2 font-mono text-center text-sm text-white focus:outline-none focus:border-realm-accent"
              />
              <button
                onClick={handleJoinRoom}
                disabled={loading}
                className="btn-primary text-sm px-4"
              >
                Join
              </button>
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
