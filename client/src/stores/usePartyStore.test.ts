import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePartyStore } from './usePartyStore';
import { useGameStore } from './useGameStore';

vi.mock('@game/systems/SocketManager', () => ({
  socketManager: {
    sendPartyInviteRequest: vi.fn(),
    respondPartyInvite: vi.fn(),
    sendPartySync: vi.fn(),
  },
}));

import { socketManager } from '@game/systems/SocketManager';

describe('usePartyStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePartyStore.setState({ partyId: null, leaderId: null, members: [], incomingInvite: null });
    useGameStore.setState({ player: { id: 'me', name: 'Me', level: 5, stats: { hp: 80, maxHp: 100 } } as any });
  });

  it('requestInvite sends a real invite over the socket rather than auto-joining', () => {
    usePartyStore.getState().requestInvite('bob-id', 'Bob');
    expect(socketManager.sendPartyInviteRequest).toHaveBeenCalledWith('bob-id');
    // Must NOT have joined a party just from sending the request.
    expect(usePartyStore.getState().partyId).toBeNull();
  });

  describe('incoming invites', () => {
    it('accepting relays acceptance but does not join until the roster sync arrives', () => {
      usePartyStore.getState().receiveInvite('alice-id', 'Alice');
      usePartyStore.getState().acceptInvite();

      expect(socketManager.respondPartyInvite).toHaveBeenCalledWith('alice-id', true);
      expect(usePartyStore.getState().incomingInvite).toBeNull();
      // Roster comes from the inviter's partySync, not fabricated locally here.
      expect(usePartyStore.getState().partyId).toBeNull();
    });

    it('declining relays refusal and never joins a party', () => {
      usePartyStore.getState().receiveInvite('alice-id', 'Alice');
      usePartyStore.getState().declineInvite();

      expect(socketManager.respondPartyInvite).toHaveBeenCalledWith('alice-id', false);
      expect(usePartyStore.getState().partyId).toBeNull();
    });
  });

  describe('handleInviteResponse (runs on the inviter once the invitee genuinely accepts)', () => {
    it('creates a new party from scratch and syncs the roster to the new member', () => {
      usePartyStore.getState().handleInviteResponse(true, 'bob-id', 'Bob');

      const state = usePartyStore.getState();
      expect(state.leaderId).toBe('me');
      expect(state.members.map((m) => m.id)).toEqual(['me', 'bob-id']);
      expect(socketManager.sendPartySync).toHaveBeenCalledWith(['bob-id'], state.partyId, 'me', state.members);
    });

    it('adds to an existing party rather than creating a second one', () => {
      usePartyStore.setState({ partyId: 'party-1', leaderId: 'me', members: [{ id: 'me', name: 'Me', level: 5, hp: 80, maxHp: 100 }] });

      usePartyStore.getState().handleInviteResponse(true, 'carol-id', 'Carol');

      const state = usePartyStore.getState();
      expect(state.partyId).toBe('party-1');
      expect(state.members.map((m) => m.id)).toEqual(['me', 'carol-id']);
    });

    it('does not mutate party state on decline, only shows an error', () => {
      usePartyStore.getState().handleInviteResponse(false, 'bob-id', 'Bob', 'Bob declined.');
      expect(usePartyStore.getState().partyId).toBeNull();
      expect(socketManager.sendPartySync).not.toHaveBeenCalled();
    });
  });

  describe('applyRosterUpdate (runs on every other member when the roster owner pushes an update)', () => {
    it('replaces local party state with exactly what was pushed', () => {
      const members = [
        { id: 'me', name: 'Me', level: 5, hp: 80, maxHp: 100 },
        { id: 'bob-id', name: 'Bob', level: 1, hp: 100, maxHp: 100 },
      ];
      usePartyStore.getState().applyRosterUpdate('party-1', 'bob-id', members);

      const state = usePartyStore.getState();
      expect(state.partyId).toBe('party-1');
      expect(state.leaderId).toBe('bob-id');
      expect(state.members).toEqual(members);
    });

    it('clears the party when pushed a null partyId (e.g. after being kicked)', () => {
      usePartyStore.setState({ partyId: 'party-1', leaderId: 'bob-id', members: [{ id: 'me', name: 'Me', level: 1, hp: 1, maxHp: 1 }] });
      usePartyStore.getState().applyRosterUpdate(null, null, []);

      const state = usePartyStore.getState();
      expect(state.partyId).toBeNull();
      expect(state.members).toEqual([]);
    });
  });

  describe('leaveParty', () => {
    it('syncs the remaining roster to the other members and clears local state', () => {
      usePartyStore.setState({
        partyId: 'party-1',
        leaderId: 'me',
        members: [
          { id: 'me', name: 'Me', level: 5, hp: 80, maxHp: 100 },
          { id: 'bob-id', name: 'Bob', level: 1, hp: 100, maxHp: 100 },
        ],
      });

      usePartyStore.getState().leaveParty();

      expect(socketManager.sendPartySync).toHaveBeenCalledWith(
        ['bob-id'],
        'party-1',
        'bob-id', // leadership transfers since the leader left
        [{ id: 'bob-id', name: 'Bob', level: 1, hp: 100, maxHp: 100 }],
      );
      expect(usePartyStore.getState().partyId).toBeNull();
    });

    it('does not sync anything if leaving disbands the party (last member)', () => {
      usePartyStore.setState({ partyId: 'party-1', leaderId: 'me', members: [{ id: 'me', name: 'Me', level: 5, hp: 80, maxHp: 100 }] });
      usePartyStore.getState().leaveParty();
      expect(socketManager.sendPartySync).not.toHaveBeenCalled();
      expect(usePartyStore.getState().partyId).toBeNull();
    });
  });

  describe('kickMember', () => {
    it('syncs the reduced roster to remaining members and clears the kicked member separately', () => {
      usePartyStore.setState({
        partyId: 'party-1',
        leaderId: 'me',
        members: [
          { id: 'me', name: 'Me', level: 5, hp: 80, maxHp: 100 },
          { id: 'bob-id', name: 'Bob', level: 1, hp: 100, maxHp: 100 },
        ],
      });

      usePartyStore.getState().kickMember('bob-id');

      // Kicked member told they're out (empty roster), no other targets to notify here (only me + bob existed).
      expect(socketManager.sendPartySync).toHaveBeenCalledWith(['bob-id'], null, null, []);
      expect(usePartyStore.getState().members).toEqual([{ id: 'me', name: 'Me', level: 5, hp: 80, maxHp: 100 }]);
    });
  });
});
