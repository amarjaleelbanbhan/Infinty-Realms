import { create } from 'zustand';
import type { Guild, GuildMember } from '@shared/types';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';

interface GuildStore {
  guild: Guild | null;
  createGuild: (name: string, tag: string) => void;
  depositVault: (amount: number) => void;
  leaveGuild: () => void;
}

export const useGuildStore = create<GuildStore>((set, get) => ({
  guild: null,

  createGuild: (name, tag) => {
    const player = useGameStore.getState().player;
    if (!player || !player.id || !player.name) return;

    const leader: GuildMember = {
      playerId: player.id,
      name: player.name,
      role: 'leader',
      joinedAt: Date.now(),
    };

    const newGuild: Guild = {
      id: `guild-${Date.now()}`,
      name: name.trim(),
      tag: tag.trim().toUpperCase(),
      leaderId: player.id,
      members: [leader],
      vaultGold: 0,
      level: 1,
      perks: ['+5% Experience Boost', 'Guild Vault Storage'],
    };

    set({ guild: newGuild });
    useUIStore.getState().addToast(`Guild [${tag}] ${name} created!`, 'success');
  },

  depositVault: (amount) => {
    const { guild } = get();
    const gameStore = useGameStore.getState();
    const currentGold = gameStore.player?.gold ?? 0;

    if (!guild || currentGold < amount || amount <= 0) {
      useUIStore.getState().addToast('Insufficient gold', 'error');
      return;
    }

    gameStore.addGold(-amount);
    set({ guild: { ...guild, vaultGold: guild.vaultGold + amount } });
    useUIStore.getState().addToast(`Deposited ${amount}g into Guild Vault`, 'gold');
  },

  leaveGuild: () => {
    set({ guild: null });
    useUIStore.getState().addToast('Left guild', 'info');
  },
}));
