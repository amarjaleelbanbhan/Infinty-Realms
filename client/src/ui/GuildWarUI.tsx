import { useState, useEffect } from 'react';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';

export function GuildWarUI({ guildId }: { guildId: string }) {
  const { playerToken } = useGameStore();
  const { addToast } = useUIStore();
  const [wars, setWars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [declareTarget, setDeclareTarget] = useState('');
  const [declareCity, setDeclareCity] = useState('');
  const [contributeAmount, setContributeAmount] = useState(10);

  const fetchWars = async () => {
    if (!playerToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/guild-war', {
        headers: { Authorization: `Bearer ${playerToken}` },
      });
      if (res.ok) {
        setWars(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWars();
  }, [playerToken]);

  const handleDeclare = async () => {
    if (!playerToken || !declareTarget || !declareCity) return;
    try {
      const res = await fetch('/api/guild-war/declare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${playerToken}`,
        },
        body: JSON.stringify({
          challengerId: guildId,
          defenderId: declareTarget,
          targetCityId: declareCity,
        }),
      });
      if (res.ok) {
        addToast(`War declared on ${declareTarget}!`, 'success');
        setDeclareTarget('');
        setDeclareCity('');
        fetchWars();
      } else {
        const err = await res.json();
        addToast(err.message, 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleContribute = async (warId: string) => {
    if (!playerToken || contributeAmount <= 0) return;
    try {
      const res = await fetch(`/api/guild-war/${warId}/contribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${playerToken}`,
        },
        body: JSON.stringify({
          guildId,
          points: contributeAmount,
        }),
      });
      if (res.ok) {
        addToast(`Contributed ${contributeAmount} siege points!`, 'success');
        fetchWars();
      } else {
        const err = await res.json();
        addToast(err.message, 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Active Wars */}
      <div>
        <h3 className="font-game text-xs text-realm-text-muted uppercase tracking-wider mb-2">Active Wars</h3>
        {loading ? (
          <p className="text-sm text-realm-text-muted">Loading wars...</p>
        ) : wars.length === 0 ? (
          <p className="text-sm text-realm-text-muted bg-black/20 p-3 rounded">No active wars.</p>
        ) : (
          <div className="space-y-3">
            {wars.map((war) => {
              const isChallenger = war.challengerId === guildId;
              const isDefender = war.defenderId === guildId;
              const isMyWar = isChallenger || isDefender;

              return (
                <div key={war.id} className="bg-black/30 border border-realm-border rounded p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-game text-sm text-white">
                      <span className={isChallenger ? 'text-realm-accent' : ''}>{war.challengerId}</span>
                      <span className="text-realm-text-muted mx-2">vs</span>
                      <span className={isDefender ? 'text-realm-accent' : ''}>{war.defenderId}</span>
                    </span>
                    <span className="text-xs text-realm-hp border border-realm-hp/30 px-2 py-0.5 rounded">
                      Target: City {war.targetCityId}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div className="flex gap-4">
                      <div>
                        <div className="text-xs text-realm-text-muted">Challenger PTS</div>
                        <div className="font-mono text-realm-gold">{war.challengerPoints}</div>
                      </div>
                      <div>
                        <div className="text-xs text-realm-text-muted">Defender PTS</div>
                        <div className="font-mono text-realm-gold">{war.defenderPoints}</div>
                      </div>
                    </div>
                    
                    {isMyWar && (
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          min="1"
                          value={contributeAmount}
                          onChange={(e) => setContributeAmount(parseInt(e.target.value) || 0)}
                          className="w-16 bg-black/50 border border-realm-border rounded px-2 py-1 text-xs text-white"
                        />
                        <button 
                          onClick={() => handleContribute(war.id)}
                          className="btn-gold py-1 px-3 text-xs"
                        >
                          Siege
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Declare War */}
      <div className="bg-black/30 border border-realm-hp/30 rounded p-4">
        <h3 className="font-game text-sm text-realm-hp mb-3">Declare War</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-realm-text-muted mb-1">Target Guild ID</label>
            <input 
              type="text" 
              value={declareTarget}
              onChange={(e) => setDeclareTarget(e.target.value)}
              className="w-full bg-black/50 border border-realm-border rounded px-3 py-1.5 text-sm text-white"
              placeholder="e.g. guild-123"
            />
          </div>
          <div>
            <label className="block text-xs text-realm-text-muted mb-1">Target City ID</label>
            <input 
              type="text" 
              value={declareCity}
              onChange={(e) => setDeclareCity(e.target.value)}
              className="w-full bg-black/50 border border-realm-border rounded px-3 py-1.5 text-sm text-white"
              placeholder="e.g. Ironforge"
            />
          </div>
          <button 
            onClick={handleDeclare}
            className="w-full btn-primary bg-realm-hp/20 border-realm-hp/50 text-realm-hp hover:bg-realm-hp/30"
          >
            Declare War
          </button>
        </div>
      </div>
    </div>
  );
}
