import { create } from 'zustand';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';

export interface GuildRecord {
  id: string;
  name: string;
  tag: string;
  leaderId: string;
  level: number;
  experience: number;
}

interface GuildStore {
  guild: GuildRecord | null;
  guilds: GuildRecord[];
  isLoading: boolean;

  loadGuilds: () => Promise<void>;
  createGuild: (name: string, tag: string) => Promise<void>;
  joinGuild: (guildId: string) => Promise<void>;
  leaveGuild: () => Promise<void>;
}

async function authedFetch(path: string, options: RequestInit = {}) {
  const token = useGameStore.getState().playerToken;
  return fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}

export const useGuildStore = create<GuildStore>()((set, get) => ({
  guild: null,
  guilds: [],
  isLoading: false,

  loadGuilds: async () => {
    set({ isLoading: true });
    try {
      const res = await authedFetch('/guilds');
      if (res.ok) {
        const guilds: GuildRecord[] = await res.json();
        set({ guilds });
      }
    } catch (e) {
      console.error('[GuildStore] Failed to load guilds', e);
    } finally {
      set({ isLoading: false });
    }
  },

  createGuild: async (name, tag) => {
    const player = useGameStore.getState().player;
    if (!player?.id || !player.name) {
      useUIStore.getState().addToast('Not logged in', 'error');
      return;
    }

    set({ isLoading: true });
    try {
      const res = await authedFetch('/guilds', {
        method: 'POST',
        body: JSON.stringify({ name, tag }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to create guild' }));
        useUIStore.getState().addToast(err.message ?? 'Failed to create guild', 'error');
        return;
      }

      const guild: GuildRecord = await res.json();
      set({ guild });
      useUIStore.getState().addToast(`Guild [${guild.tag}] ${guild.name} created!`, 'success');
      get().loadGuilds();
    } catch (e) {
      console.error('[GuildStore] Failed to create guild', e);
      useUIStore.getState().addToast('Failed to create guild', 'error');
    } finally {
      set({ isLoading: false });
    }
  },

  joinGuild: async (guildId) => {
    const player = useGameStore.getState().player;
    if (!player?.id || !player.name) {
      useUIStore.getState().addToast('Not logged in', 'error');
      return;
    }

    set({ isLoading: true });
    try {
      const res = await authedFetch(`/guilds/${guildId}/join`, {
        method: 'POST',
        body: JSON.stringify({ playerName: player.name }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to join guild' }));
        useUIStore.getState().addToast(err.message ?? 'Failed to join guild', 'error');
        return;
      }

      // Reload guilds to get updated state
      await get().loadGuilds();
      const joined = get().guilds.find(g => g.id === guildId);
      if (joined) set({ guild: joined });
      useUIStore.getState().addToast('Joined guild!', 'success');
    } catch (e) {
      console.error('[GuildStore] Failed to join guild', e);
      useUIStore.getState().addToast('Failed to join guild', 'error');
    } finally {
      set({ isLoading: false });
    }
  },

  leaveGuild: async () => {
    const guildId = get().guild?.id;
    if (!guildId) return;

    set({ isLoading: true });
    try {
      const res = await authedFetch(`/guilds/${guildId}/leave`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to leave guild' }));
        useUIStore.getState().addToast(err.message ?? 'Failed to leave guild', 'error');
        return;
      }

      const data = await res.json();
      set({ guild: null });
      useUIStore.getState().addToast(data.disbanded ? 'Guild disbanded.' : 'Left guild.', 'info');
      get().loadGuilds();
    } catch (e) {
      console.error('[GuildStore] Failed to leave guild', e);
      useUIStore.getState().addToast('Failed to leave guild', 'error');
    } finally {
      set({ isLoading: false });
    }
  },
}));
