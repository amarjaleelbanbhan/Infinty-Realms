import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player, WorldState, Season } from '@shared/types';

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
  startSession: (playerName: string) => void;
  setPlayer: (player: Partial<Player>) => void;
  updatePlayerPosition: (x: number, y: number) => void;
  updatePlayerStats: (stats: Partial<Player['stats']>) => void;
  addGold: (amount: number) => void;
  addExperience: (amount: number) => void;
  setWorldState: (world: Partial<WorldState>) => void;
  updateSeason: (season: Season) => void;
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

      startSession: (playerName) => {
        const worldSeed = `realm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
        set({
          sessionStarted: true,
          player: {
            id: crypto.randomUUID(),
            name: playerName,
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
            width: 256,
            height: 256,
            cities: [],
            season: 'spring',
            dayTime: 8,
            worldAge: 0,
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

      setWorldState: (world) => set({ worldState: world }),

      updateSeason: (season) =>
        set((s) => ({
          worldState: s.worldState ? { ...s.worldState, season } : null,
        })),

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
