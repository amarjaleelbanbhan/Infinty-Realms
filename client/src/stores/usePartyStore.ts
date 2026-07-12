import { create } from 'zustand';
import type { PartyMember } from '@shared/types';
import { useGameStore } from './useGameStore';
import { useUIStore } from './useUIStore';
import { socketManager } from '@game/systems/SocketManager';

export type { PartyMember };

interface IncomingPartyInvite {
  fromId: string;
  fromName: string;
}

export interface PartyState {
  partyId: string | null;
  leaderId: string | null;
  members: PartyMember[];
  incomingInvite: IncomingPartyInvite | null;

  requestInvite: (targetId: string, targetName: string) => void;
  receiveInvite: (fromId: string, fromName: string) => void;
  acceptInvite: () => void;
  declineInvite: () => void;
  handleInviteResponse: (accepted: boolean, partnerId: string, partnerName?: string, reason?: string) => void;

  applyRosterUpdate: (partyId: string | null, leaderId: string | null, members: PartyMember[]) => void;

  leaveParty: () => void;
  kickMember: (id: string) => void;
}

export const usePartyStore = create<PartyState>((set, get) => ({
  partyId: null,
  leaderId: null,
  members: [],
  incomingInvite: null,

  requestInvite: (targetId, targetName) => {
    socketManager.sendPartyInviteRequest(targetId);
    useUIStore.getState().addToast(`Party invite sent to ${targetName}...`, 'info');
  },

  receiveInvite: (fromId, fromName) => {
    set({ incomingInvite: { fromId, fromName } });
  },

  acceptInvite: () => {
    const invite = get().incomingInvite;
    if (!invite) return;
    socketManager.respondPartyInvite(invite.fromId, true);
    set({ incomingInvite: null });
  },

  declineInvite: () => {
    const invite = get().incomingInvite;
    if (!invite) return;
    socketManager.respondPartyInvite(invite.fromId, false);
    set({ incomingInvite: null });
  },

  // Runs on the *inviter's* client once the invitee has genuinely accepted
  // (relayed by the server, not a fabricated local timeout).
  handleInviteResponse: (accepted, partnerId, partnerName, reason) => {
    const uiStore = useUIStore.getState();
    if (!accepted) {
      uiStore.addToast(reason || `${partnerName || 'Player'} declined the invite.`, 'error');
      return;
    }

    const me = useGameStore.getState().player;
    if (!me?.id) return;
    const state = get();

    let partyId: string;
    let leaderId: string;
    let members: PartyMember[];

    if (state.members.length === 0) {
      partyId = `party-${Date.now()}`;
      leaderId = me.id;
      members = [
        { id: me.id, name: me.name ?? 'Player', level: me.level ?? 1, hp: me.stats?.hp ?? 100, maxHp: me.stats?.maxHp ?? 100 },
        { id: partnerId, name: partnerName ?? 'Player', level: 1, hp: 100, maxHp: 100 },
      ];
    } else {
      partyId = state.partyId as string;
      leaderId = state.leaderId as string;
      members = [...state.members, { id: partnerId, name: partnerName ?? 'Player', level: 1, hp: 100, maxHp: 100 }];
    }

    set({ partyId, leaderId, members });
    uiStore.addToast(`${partnerName || 'Player'} joined your party!`, 'success');

    const targetIds = members.map((m) => m.id).filter((id) => id !== me.id);
    socketManager.sendPartySync(targetIds, partyId, leaderId, members);
  },

  // Runs on every other member's client when the roster owner pushes an update.
  applyRosterUpdate: (partyId, leaderId, members) => {
    set({ partyId, leaderId, members });
  },

  leaveParty: () => {
    const me = useGameStore.getState().player;
    const state = get();

    if (state.partyId && me?.id) {
      const remaining = state.members.filter((m) => m.id !== me.id);
      if (remaining.length > 0) {
        const newLeaderId = state.leaderId === me.id ? remaining[0].id : state.leaderId;
        const targetIds = remaining.map((m) => m.id);
        socketManager.sendPartySync(targetIds, state.partyId, newLeaderId, remaining);
      }
    }

    set({ partyId: null, leaderId: null, members: [] });
  },

  kickMember: (id) => {
    const me = useGameStore.getState().player;
    const state = get();
    const remaining = state.members.filter((m) => m.id !== id);

    const remainingTargets = remaining.map((m) => m.id).filter((mid) => mid !== me?.id);
    if (remainingTargets.length > 0) {
      socketManager.sendPartySync(remainingTargets, state.partyId, state.leaderId, remaining);
    }
    // Tell the kicked player specifically that they're out.
    socketManager.sendPartySync([id], null, null, []);

    set({ members: remaining });
  },
}));
