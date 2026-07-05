import { create } from 'zustand';
import type { NPC } from '@shared/types';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'gold';
  duration?: number;
}

interface UIStore {
  // Screen state
  currentScreen: 'menu' | 'loading' | 'game' | 'pause';

  // Panel visibility
  isInventoryOpen: boolean;
  isQuestLogOpen: boolean;
  isDialogueOpen: boolean;
  isMapOpen: boolean;

  // Dialogue
  dialogueNpc: Partial<NPC> | null;
  dialogueText: string;
  dialogueOptions: Array<{ text: string; action: string }>;

  // Toasts
  toasts: Toast[];

  // Mobile
  isMobile: boolean;
  joystickActive: boolean;

  // Settings
  musicVolume: number;
  sfxVolume: number;

  // Actions
  setScreen: (screen: UIStore['currentScreen']) => void;
  openInventory: () => void;
  closeInventory: () => void;
  openQuestLog: () => void;
  closeQuestLog: () => void;
  openDialogue: (npc: Partial<NPC>, text: string, options?: UIStore['dialogueOptions']) => void;
  closeDialogue: () => void;
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  setIsMobile: (mobile: boolean) => void;
  setJoystickActive: (active: boolean) => void;
  togglePause: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  currentScreen: 'menu',
  isInventoryOpen: false,
  isQuestLogOpen: false,
  isDialogueOpen: false,
  isMapOpen: false,
  dialogueNpc: null,
  dialogueText: '',
  dialogueOptions: [],
  toasts: [],
  isMobile: /Mobi|Android|Touch/i.test(navigator.userAgent),
  joystickActive: false,
  musicVolume: 0.5,
  sfxVolume: 0.7,

  setScreen: (screen) => set({ currentScreen: screen }),

  openInventory: () => set({ isInventoryOpen: true, isQuestLogOpen: false }),
  closeInventory: () => set({ isInventoryOpen: false }),

  openQuestLog: () => set({ isQuestLogOpen: true, isInventoryOpen: false }),
  closeQuestLog: () => set({ isQuestLogOpen: false }),

  openDialogue: (npc, text, options = []) =>
    set({ isDialogueOpen: true, dialogueNpc: npc, dialogueText: text, dialogueOptions: options }),
  closeDialogue: () => set({ isDialogueOpen: false, dialogueNpc: null, dialogueText: '', dialogueOptions: [] }),

  addToast: (message, type = 'info') => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 3500);
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setIsMobile: (mobile) => set({ isMobile: mobile }),
  setJoystickActive: (active) => set({ joystickActive: active }),

  togglePause: () =>
    set((s) => ({
      currentScreen: s.currentScreen === 'game' ? 'pause' : 'game',
    })),
}));
