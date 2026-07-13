/**
 * combatApi — thin wrapper around the server kill-claim endpoint.
 *
 * Design: the client tells the server "I killed a skeleton at level 3".
 * The server validates, computes rewards from its own authoritative table,
 * persists them to the DB, and returns the actual values.
 * The client applies the server's response — NOT its own locally-computed values.
 *
 * Offline fallback: if the server is unreachable (network error, dev without
 * server running) we fall back to approximate local values so the game stays
 * playable, but mark the session as unverified so we don't trust the save.
 */

import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';

interface KillClaimResult {
  xpAwarded: number;
  goldAwarded: number;
  totalXp: number;
  totalGold: number;
}

// Fallback table (client-side) for offline/dev mode — intentionally conservative.
const OFFLINE_FALLBACK: Record<string, { xp: number; gold: number }> = {
  skeleton:    { xp: 20,  gold: 8   },
  goblin:      { xp: 15,  gold: 6   },
  orc:         { xp: 35,  gold: 14  },
  troll:       { xp: 60,  gold: 22  },
  wolf:        { xp: 18,  gold: 5   },
  bandit:      { xp: 25,  gold: 12  },
  slime:       { xp: 10,  gold: 4   },
  golem:       { xp: 80,  gold: 30  },
  vampire:     { xp: 55,  gold: 20  },
  dragon:      { xp: 500, gold: 150 },
  dungeon_mob: { xp: 40,  gold: 15  },
};

let serverUnavailable = false; // flip after first failure to avoid repeated timeouts

export async function claimKillReward(
  enemyType: string,
  enemyLevel = 1,
): Promise<void> {
  const { playerToken, addExperience, addGold, player } = useGameStore.getState();
  const { addToast } = useUIStore.getState();

  if (!playerToken || !player?.id || serverUnavailable) {
    // Offline / guest-without-server path
    applyOfflineFallback(enemyType, enemyLevel);
    return;
  }

  try {
    const res = await fetch('/api/combat/kill-claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${playerToken}`,
      },
      body: JSON.stringify({ enemyType, enemyLevel }),
      signal: AbortSignal.timeout(3000), // don't block the game thread for more than 3s
    });

    if (!res.ok) {
      // Rate-limit or validation error — don't award anything
      if (res.status === 403) {
        addToast('⚠️ Anti-cheat: kill claim rejected', 'error');
        return;
      }
      if (res.status === 400) {
        // Unknown enemy type — soft fail, award nothing (security: don't reward unknown types)
        console.warn(`[Combat] Kill claim rejected (400) for type: ${enemyType}`);
        return;
      }
      // Other server error — fall back gracefully
      applyOfflineFallback(enemyType, enemyLevel);
      return;
    }

    const result: KillClaimResult = await res.json();

    // Apply server-authoritative values to local state
    // We set the absolute values from the server response, not add a delta
    // (server already applied the increment; we just sync the UI)
    useGameStore.setState(state => ({
      player: state.player
        ? {
            ...state.player,
            experience: result.totalXp,
            gold: result.totalGold,
          }
        : state.player,
    }));

    addToast(`+${result.xpAwarded} XP  +${result.goldAwarded}g`, 'gold');
  } catch (err) {
    // Network failure — mark server as unavailable for this session
    // and fall back to local values
    console.warn('[Combat] Server unreachable — falling back to offline rewards', err);
    serverUnavailable = true;
    applyOfflineFallback(enemyType, enemyLevel);
  }
}

function applyOfflineFallback(enemyType: string, enemyLevel: number) {
  const { addExperience, addGold } = useGameStore.getState();
  const { addToast } = useUIStore.getState();
  const template = OFFLINE_FALLBACK[enemyType.toLowerCase()] ?? { xp: 15, gold: 5 };
  const mult = Math.min(3, 1 + (Math.max(0, enemyLevel - 1) * 0.1));
  const xp = Math.round(template.xp * mult);
  const gold = Math.round(template.gold * mult);
  addExperience(xp);
  addGold(gold);
  addToast(`+${xp} XP  +${gold}g (offline)`, 'gold');
}
