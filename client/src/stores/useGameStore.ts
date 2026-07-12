import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player, WorldState, Season, Item, SubclassType } from '@shared/types';

interface GameState {
  // Session
  isLoaded: boolean;
  sessionStarted: boolean;
  playerToken: string | null;

  // Player
  player: Partial<Player> | null;
  isDead: boolean;

  // World
  worldState: Partial<WorldState> | null;
  currentWeather: string;

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
  equipItem: (item: Item) => void;
  unequipItem: (slot: 'weapon' | 'armor' | 'helmet' | 'accessory') => void;
  consumeItem: (item: Item) => void;
  unlockSkill: (skillId: string, cost: number, subclass: SubclassType) => void;
  setWorldState: (world: Partial<WorldState>) => void;
  setCurrentWeather: (weather: string) => void;
  updateSeason: (season: Season) => void;
  depleteEcosystem: (biome: string, amount: number) => void;
  regenerateEcosystems: () => void;
  setToken: (token: string) => void;
  ascend: (perkId: string) => void;
  castGodIntervention: (type: string) => void;
  die: () => void;
  respawn: () => void;
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
      isDead: false,
      worldState: null,
      currentWeather: 'clear',

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
            worldSeed,
            x: 128 * 32,
            y: 128 * 32,
            stats: DEFAULT_PLAYER_STATS,
            level: 1,
            experience: 0,
            gold: 0,
            inventory: [],
            equipment: {},
            skills: ['slash'],
            skillPoints: 0,
            reputation: {},
            titles: ['Novice'],
            questIds: [],
            playtime: 0,
            ascensions: 0,
            godPerks: [],
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
                  skillPoints: (s.player.skillPoints ?? 0) + 1,
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

        const removed = inventory[idx].quantity >= quantity;
        inventory[idx].quantity -= quantity;
        if (inventory[idx].quantity <= 0) {
          inventory.splice(idx, 1);
        }

        set({ player: { ...player, inventory } });
        return removed;
      },

      equipItem: (item) => set((s) => {
        if (!s.player || !s.player.equipment) return {};
        const slot = item.type as 'weapon' | 'armor' | 'helmet' | 'accessory';
        if (!['weapon', 'armor', 'helmet', 'accessory'].includes(slot)) return {};
        
        const currentEquip = s.player.equipment[slot];
        const newPlayer = { ...s.player, equipment: { ...s.player.equipment, [slot]: item } };
        
        // Remove new equip from inventory
        const newInv = [...(s.player.inventory || [])];
        const idx = newInv.findIndex(x => x.item.id === item.id);
        if (idx >= 0) {
          if (newInv[idx].quantity > 1) {
            newInv[idx] = { ...newInv[idx], quantity: newInv[idx].quantity - 1 };
          } else {
            newInv.splice(idx, 1);
          }
        }
        
        // Put old equip back to inventory
        if (currentEquip) {
          const existIdx = newInv.findIndex(x => x.item.id === currentEquip.id);
          if (existIdx >= 0) {
            newInv[existIdx] = { ...newInv[existIdx], quantity: newInv[existIdx].quantity + 1 };
          } else {
            newInv.push({ item: currentEquip, quantity: 1 });
          }
        }
        newPlayer.inventory = newInv;
        return { player: newPlayer };
      }),

      unequipItem: (slot) => set((s) => {
        if (!s.player || !s.player.equipment || !s.player.equipment[slot]) return {};
        const currentEquip = s.player.equipment[slot]!;
        
        const newPlayer = { ...s.player, equipment: { ...s.player.equipment } };
        delete newPlayer.equipment[slot];
        
        const newInv = [...(s.player.inventory || [])];
        const existIdx = newInv.findIndex(x => x.item.id === currentEquip.id);
        if (existIdx >= 0) {
          newInv[existIdx] = { ...newInv[existIdx], quantity: newInv[existIdx].quantity + 1 };
        } else {
          newInv.push({ item: currentEquip, quantity: 1 });
        }
        
        newPlayer.inventory = newInv;
        return { player: newPlayer };
      }),

      consumeItem: (item) => set((s) => {
        if (!s.player || item.type !== 'consumable') return {};
        const newInv = [...(s.player.inventory || [])];
        const idx = newInv.findIndex(x => x.item.id === item.id);
        if (idx < 0) return {};
        
        if (newInv[idx].quantity > 1) {
          newInv[idx] = { ...newInv[idx], quantity: newInv[idx].quantity - 1 };
        } else {
          newInv.splice(idx, 1);
        }

        // Apply effect (simple HP heal for now)
        const stats = s.player.stats ? { ...s.player.stats } : { ...DEFAULT_PLAYER_STATS };
        stats.hp = Math.min(stats.maxHp, stats.hp + (item.value || 20));

        return { player: { ...s.player, inventory: newInv, stats } as Partial<Player> };
      }),

      unlockSkill: (skillId, cost, subclass) => set((s) => {
        if (!s.player) return {};
        if ((s.player.skillPoints ?? 0) < cost) return {};
        if (s.player.skills?.includes(skillId)) return {};

        return {
          player: {
            ...s.player,
            subclass: s.player.subclass ?? subclass,
            skillPoints: (s.player.skillPoints ?? 0) - cost,
            skills: [...(s.player.skills ?? []), skillId],
          } as Partial<Player>
        };
      }),

      setWorldState: (world) => set((s) => ({ worldState: world })),
      
      setCurrentWeather: (weather) => set({ currentWeather: weather }),

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

      setToken: (token) => {
        set({ playerToken: token });
      },

      ascend: (perkId) => {
        const { player } = get();
        if (!player) return;

        const newSeed = `realm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
        
        const newPlayer = {
          ...player,
          level: 1,
          experience: 0,
          gold: 0,
          inventory: [],
          equipment: {},
          skills: [],
          skillPoints: 0,
          worldSeed: newSeed,
          ascensions: (player.ascensions || 0) + 1,
          godPerks: [...(player.godPerks || []), perkId],
        };

        set({ player: newPlayer });
        window.dispatchEvent(new CustomEvent('ir:player_ascended', { detail: { newSeed } }));
      },

      castGodIntervention: (type) => {
        const { player } = get();
        if (!player) return;
        window.dispatchEvent(new CustomEvent('ir:god_intervention_cast', { detail: { type, casterName: player.name } }));
        set((state) => {
          if (!state.player) return state;
          const power = type === 'heal' ? 1000 : 50;
          return {
            player: {
              ...state.player,
              stats: {
                ...state.player.stats!,
                hp: type === 'heal' ? state.player.stats!.maxHp : state.player.stats!.hp,
              },
            },
          };
        });
      },

      die: () =>
        set((state) => {
          if (!state.player) return state;
          
          // Penalty: Lose 10% of gold
          const newGold = Math.floor(state.player.gold! * 0.9);
          
          return {
            isDead: true,
            player: {
              ...state.player,
              gold: newGold,
              stats: {
                ...state.player.stats!,
                hp: 0,
              },
            }
          };
        }),

      respawn: () =>
        set((state) => {
          if (!state.player) return state;
          return {
            isDead: false,
            player: {
              ...state.player,
              x: 128 * 32, // Respawn to initial coords
              y: 128 * 32,
              stats: {
                ...state.player.stats!,
                hp: Math.max(1, Math.floor(state.player.stats!.maxHp * 0.5)),
              }
            }
          };
        }),

      reset: () =>
        set({
          isLoaded: false,
          sessionStarted: false,
          playerToken: null,
          player: null,
          worldState: null,
          isDead: false,
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
