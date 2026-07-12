import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  isOpen: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  postProcessing: boolean;
  screenShake: boolean;
  
  toggleSettings: () => void;
  setMasterVolume: (val: number) => void;
  setMusicVolume: (val: number) => void;
  setSfxVolume: (val: number) => void;
  setPostProcessing: (val: boolean) => void;
  setScreenShake: (val: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isOpen: false,
      masterVolume: 1.0,
      musicVolume: 0.8,
      sfxVolume: 1.0,
      postProcessing: true,
      screenShake: true,

      toggleSettings: () => set((state) => ({ isOpen: !state.isOpen })),
      setMasterVolume: (val) => set({ masterVolume: val }),
      setMusicVolume: (val) => set({ musicVolume: val }),
      setSfxVolume: (val) => set({ sfxVolume: val }),
      setPostProcessing: (val) => set({ postProcessing: val }),
      setScreenShake: (val) => set({ screenShake: val }),
    }),
    {
      name: 'ir-settings-store',
      partialize: (state) => ({
        masterVolume: state.masterVolume,
        musicVolume: state.musicVolume,
        sfxVolume: state.sfxVolume,
        postProcessing: state.postProcessing,
        screenShake: state.screenShake,
      }),
    }
  )
);
