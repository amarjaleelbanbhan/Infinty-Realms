import { create } from 'zustand';

export interface PartyMember {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
}

export interface PartyState {
  partyId: string | null;
  leaderId: string | null;
  members: PartyMember[];
  
  setParty: (partyId: string, leaderId: string, members: PartyMember[]) => void;
  updateMember: (id: string, data: Partial<PartyMember>) => void;
  removeMember: (id: string) => void;
  clearParty: () => void;
}

export const usePartyStore = create<PartyState>((set) => ({
  partyId: null,
  leaderId: null,
  members: [],

  setParty: (partyId, leaderId, members) => set({ partyId, leaderId, members }),
  
  updateMember: (id, data) => set((state) => ({
    members: state.members.map(m => m.id === id ? { ...m, ...data } : m)
  })),

  removeMember: (id) => set((state) => ({
    members: state.members.filter(m => m.id !== id)
  })),

  clearParty: () => set({ partyId: null, leaderId: null, members: [] })
}));
