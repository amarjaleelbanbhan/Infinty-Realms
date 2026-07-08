import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player, WorldState, Season, Item } from '@shared/types';

interface GameState {
  // Session
  isLoaded: boolean;
  sessionStarted: boolean;
  playerToken: string | null;

  // Player
  player: Partial<Player> | null;

  // World
  worldState: Partial<WorldState> | null;

  // Actions
  setLoaded: (loaded: boolean) => void;
  startSession: (playerName: string) => Promise<void>;
  setPlayer: (player: Partial<Player>) => void;
  updatePlayerPosition: (x: number, y: number) => void;
  updatePlayerStats: (stats: Partial<Player['stats']>) => void;
  addGold: (amount: number) => void;
  addExperience: (amount: number) => void;
  addToInventory: (item: Item, quantity: number) => void;
  removeFromInventory: (itemId: string, quantity: number) => boolean;
  setWorldState: (world: Partial<WorldState>) => void;
  updateSeason: (season: Season) => void;
  depleteEcosystem: (biome: string, amount: number) => void;
  regenerateEcosystems: () => void;
  setToken: (token: string) => void;
  reset: () => void;
}

const DEFAULT_PLAYER_STATS = {
  hp: 100, maxHp: 100,
  mana: 50, maxMana: 50,
  attack: 10, defense: 5,
  speed: 150, luck: 5,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      isLoaded: false,
      sessionStarted: false,
      playerToken: null,
      player: null,
      worldState: null,

      setLoaded: (loaded) => set({ isLoaded: loaded }),

      startSession: async (playerName) => {
        let guestToken = '';
        let playerId = crypto.randomUUID();
        let finalName = playerName;
        let worldSeed = `realm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
        let worldWidth = 256;
        let worldHeight = 256;
        let worldSeason: Season = 'spring';
        let worldDayTime = 8;
        let worldAge = 0;

        try {
          const response = await fetch('/api/auth/guest', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: playerName }),
          });

          if (response.ok) {
            const data = await response.json();
            guestToken = data.token;
            playerId = data.playerId;
            finalName = data.name;

            const playerResponse = await fetch('/api/players/me', {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${guestToken}`,
              },
            });

            if (playerResponse.ok) {
              const playerData = await playerResponse.json();
              if (playerData.worldSeed) {
                worldSeed = playerData.worldSeed;
              }
            }

            const worldResponse = await fetch(`/api/world/${worldSeed}`, {
              method: 'GET',
            });

            if (worldResponse.ok) {
              const worldData = await worldResponse.json();
              worldWidth = worldData.width ?? 256;
              worldHeight = worldData.height ?? 256;
              worldSeason = worldData.season ?? 'spring';
              worldDayTime = worldData.dayTime ?? 8;
              worldAge = worldData.worldAge ?? 0;
            }
          }
        } catch (err) {
          console.error('[Session] Failed to connect to server backend, falling back to local simulation:', err);
        }

        set({
          sessionStarted: true,
          playerToken: guestToken || null,
          player: {
            id: playerId,
            name: finalName,
            x: 128 * 32,
            y: 128 * 32,
            stats: { ...DEFAULT_PLAYER_STATS },
            level: 1,
            experience: 0,
            gold: 50,
            inventory: [],
            equipment: {},
            skills: [],
            reputation: {},
            questIds: [],
            titles: [],
            playtime: 0,
            worldSeed,
          },
          worldState: {
            seed: worldSeed,
            width: worldWidth,
            height: worldHeight,
            cities: [],
            season: worldSeason,
            dayTime: worldDayTime,
            worldAge: worldAge,
            biomeDepletion: {
              ocean: 100, beach: 100, plains: 100, forest: 100,
              desert: 100, snow: 100, volcano: 100, swamp: 100, dungeon: 100,
            }
          },
        });
      },

      setPlayer: (player) => set({ player }),

      updatePlayerPosition: (x, y) =>
        set((s) => ({ player: s.player ? { ...s.player, x, y } : null })),

      updatePlayerStats: (stats) =>
        set((s) => ({
          player: s.player
            ? { ...s.player, stats: { ...s.player.stats, ...stats } as Player['stats'] }
            : null,
        })),

      addGold: (amount) =>
        set((s) => ({
          player: s.player ? { ...s.player, gold: (s.player.gold ?? 0) + amount } : null,
        })),

      addExperience: (amount) => {
        const { player } = get();
        if (!player) return;
        const newXp = (player.experience ?? 0) + amount;
        const level = player.level ?? 1;
        const xpToLevel = level * 100;
        if (newXp >= xpToLevel) {
          // Level up!
          set((s) => ({
            player: s.player
              ? {
                  ...s.player,
                  experience: newXp - xpToLevel,
                  level: (s.player.level ?? 1) + 1,
                  stats: s.player.stats
                    ? {
                        ...s.player.stats,
                        maxHp: s.player.stats.maxHp + 10,
                        hp: s.player.stats.maxHp + 10,
                        attack: s.player.stats.attack + 2,
                        defense: s.player.stats.defense + 1,
                      }
                    : s.player.stats,
                }
              : null,
          }));
        } else {
          set((s) => ({
            player: s.player ? { ...s.player, experience: newXp } : null,
          }));
        }
      },

      addToInventory: (item, quantity) => {
        const { player } = get();
        if (!player) return;

        const inventory = [...(player.inventory ?? [])];
        const existingSlot = inventory.find((slot) => slot.item.id === item.id);
        if (existingSlot) {
          existingSlot.quantity += quantity;
        } else {
          inventory.push({ item, quantity });
        }

        set({ player: { ...player, inventory } });
      },

      removeFromInventory: (itemId, quantity) => {
        const { player } = get();
        if (!player) return false;

        const inventory = [...(player.inventory ?? [])];
        const idx = inventory.findIndex((slot) => slot.item.id === itemId);
        if (idx === -1) return false;

        if (inventory[idx].quantity < quantity) return false;

        inventory[idx].quantity -= quantity;
        if (inventory[idx].quantity === 0) {
          inventory.splice(idx, 1);
        }

        set({ player: { ...player, inventory } });
        return true;
      },

      setWorldState: (world) => set({ worldState: world }),

      updateSeason: (season) =>
        set((s) => ({
          worldState: s.worldState ? { ...s.worldState, season } : null,
        })),

      depleteEcosystem: (biome, amount) =>
        set((s) => {
          if (!s.worldState || !s.worldState.biomeDepletion) return {};
          const current = s.worldState.biomeDepletion[biome as keyof typeof s.worldState.biomeDepletion] ?? 100;
          return {
            worldState: {
              ...s.worldState,
              biomeDepletion: {
                ...s.worldState.biomeDepletion,
                [biome]: Math.max(0, current - amount)
              }
            }
          };
        }),

      regenerateEcosystems: () =>
        set((s) => {
          if (!s.worldState || !s.worldState.biomeDepletion) return {};
          const updated = { ...s.worldState.biomeDepletion };
          for (const key of Object.keys(updated)) {
            const b = key as keyof typeof updated;
            updated[b] = Math.min(100, updated[b] + 1);
          }
          return {
            worldState: {
              ...s.worldState,
              biomeDepletion: updated
            }
          };
        }),

      setToken: (token) => set({ playerToken: token }),

      reset: () =>
        set({
          isLoaded: false,
          sessionStarted: false,
          playerToken: null,
          player: null,
          worldState: null,
        }),
    }),
    {
      name: 'infinity-realms-save',
      partialize: (state) => ({
        playerToken: state.playerToken,
        player: state.player,
        worldState: state.worldState,
        sessionStarted: state.sessionStarted,
      }),
    }
  )
);
