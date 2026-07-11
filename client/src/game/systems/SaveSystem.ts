// ============================================================
// Save System — localStorage persistence with cloud sync stub
// ============================================================

import type { SaveState } from '@shared/types';
import { useGameStore } from '@stores/useGameStore';
import { useQuestStore } from '@stores/useQuestStore';
import { farmingSystem } from '@game/systems/FarmingSystem';
import { leylineSystem } from '@game/systems/LeylineSystem';
import { citadelSystem } from '@game/systems/CitadelSystem';

const SAVE_KEY = 'infinity-realms-save-v1';
const SAVE_VERSION = '0.1.0';

export class SaveSystem {
  private autoSaveInterval: ReturnType<typeof setInterval> | null = null;

  /** Start auto-save every 60 seconds */
  startAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      this.save();
    }, 60_000);
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /** Save current state to localStorage */
  save(): boolean {
    try {
      const gameStore = useGameStore.getState();
      const questStore = useQuestStore.getState();

      if (!gameStore.player || !gameStore.worldState) return false;

      const saveState: SaveState = {
        version: SAVE_VERSION,
        savedAt: Date.now(),
        player: gameStore.player as SaveState['player'],
        world: gameStore.worldState as SaveState['world'],
        activeQuests: questStore.quests.filter((q) => q.status === 'active' || q.status === 'available'),
        discoveredCities: [],
        defeatedBosses: [],
        playtime: gameStore.player.playtime ?? 0,
      };

      saveState.world.farmPlots = farmingSystem.getPlots();
      saveState.world.leylineNodes = leylineSystem.getNodes();
      saveState.world.citadelBuildings = citadelSystem.getBuildings();

      localStorage.setItem(SAVE_KEY, JSON.stringify(saveState));
      console.log('[Save] Game saved at', new Date().toLocaleTimeString());

      // Cloud save sync
      const token = gameStore.playerToken;
      if (token && gameStore.player) {
        fetch('/api/players/save', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(gameStore.player),
        }).then((res) => {
          if (res.ok) {
            console.log('[Save] Cloud save synced successfully.');
          } else {
            console.warn('[Save] Cloud save sync failed with status:', res.status);
          }
        }).catch((err) => {
          console.error('[Save] Cloud save sync failed:', err);
        });
      }

      return true;
    } catch (e) {
      console.error('[Save] Failed to save:', e);
      return false;
    }
  }

  /** Load save state from localStorage */
  load(): SaveState | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const state = JSON.parse(raw) as SaveState;
      if (state.version !== SAVE_VERSION) {
        console.warn('[Save] Version mismatch — starting fresh');
        return null;
      }
      return state;
    } catch {
      return null;
    }
  }

  /** Check if a save exists */
  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /** Delete save */
  deleteSave() {
    localStorage.removeItem(SAVE_KEY);
  }

  /** Restore stores from save state */
  restoreFromSave(save: SaveState) {
    const gameStore = useGameStore.getState();
    const questStore = useQuestStore.getState();

    // Calculate Offline Progress
    const now = Date.now();
    const timeOfflineMs = now - save.savedAt;
    
    // Minimum 1 minute offline to trigger progress
    if (timeOfflineMs > 60_000) {
      const minutesOffline = Math.floor(timeOfflineMs / 60_000);
      const level = save.player.level || 1;
      
      const goldEarned = minutesOffline * level;
      const expEarned = minutesOffline * level * 2;
      const essenceEarned = Math.floor(minutesOffline / 10);

      save.player.gold = (save.player.gold || 0) + goldEarned;
      save.player.experience = (save.player.experience || 0) + expEarned;

      // Dispatch event to show Offline Progress UI
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('ir:offline_progress', {
          detail: {
            timeOfflineMs,
            goldEarned,
            expEarned,
            essenceEarned,
            itemsGathered: []
          }
        }));
      }, 1000);
    }

    gameStore.setPlayer(save.player);
    gameStore.setWorldState(save.world);
    gameStore.startSession(save.player.name);

    if (save.world.farmPlots) farmingSystem.loadPlots(save.world.farmPlots);
    if (save.world.leylineNodes) leylineSystem.loadNodes(save.world.leylineNodes);
    if (save.world.citadelBuildings) citadelSystem.loadBuildings(save.world.citadelBuildings);

    save.activeQuests.forEach((q) => questStore.addQuest(q));
  }

  /** Get save metadata without loading full state */
  getSaveMeta(): { savedAt: Date; playerName: string; level: number; playtime: number } | null {
    const save = this.load();
    if (!save) return null;
    return {
      savedAt: new Date(save.savedAt),
      playerName: save.player.name,
      level: save.player.level,
      playtime: save.playtime,
    };
  }

  formatPlaytime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }
}

export const saveSystem = new SaveSystem();
