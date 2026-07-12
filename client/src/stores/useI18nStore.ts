import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'es';

type TranslationDictionary = Record<string, string>;

const en: TranslationDictionary = {
  // Main Menu
  'menu.play': 'Enter Realm',
  'menu.settings': 'Settings',
  'menu.credits': 'Credits',
  
  // Settings
  'settings.title': 'Game Settings',
  'settings.audio': 'Audio',
  'settings.video': 'Video',
  'settings.gameplay': 'Gameplay',
  'settings.language': 'Language',
  'settings.masterVolume': 'Master Volume',
  'settings.musicVolume': 'Music',
  'settings.sfxVolume': 'Sound Effects',
  'settings.postProcessing': 'Post Processing (Bloom/Vignette)',
  'settings.showNametags': 'Show Player Nametags',
  'settings.cameraShake': 'Camera Shake',
  'settings.save': 'Save Settings',

  // HUD
  'hud.level': 'LVL',
  'hud.hp': 'HP',
  'hud.mp': 'MP',
  'hud.stamina': 'SP',
  'hud.gold': 'Gold',
  
  // General
  'general.close': 'Close',
};

const es: TranslationDictionary = {
  // Main Menu
  'menu.play': 'Entrar al Reino',
  'menu.settings': 'Ajustes',
  'menu.credits': 'Créditos',
  
  // Settings
  'settings.title': 'Ajustes del Juego',
  'settings.audio': 'Audio',
  'settings.video': 'Video',
  'settings.gameplay': 'Jugabilidad',
  'settings.language': 'Idioma',
  'settings.masterVolume': 'Volumen Principal',
  'settings.musicVolume': 'Música',
  'settings.sfxVolume': 'Efectos de Sonido',
  'settings.postProcessing': 'Efectos Visuales (Bloom/Vignette)',
  'settings.showNametags': 'Mostrar Nombres',
  'settings.cameraShake': 'Temblor de Cámara',
  'settings.save': 'Guardar Ajustes',

  // HUD
  'hud.level': 'NIV',
  'hud.hp': 'PV',
  'hud.mp': 'PM',
  'hud.stamina': 'PE',
  'hud.gold': 'Oro',
  
  // General
  'general.close': 'Cerrar',
};

const translations: Record<Language, TranslationDictionary> = {
  en,
  es,
};

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      language: 'en',
      
      setLanguage: (lang) => set({ language: lang }),
      
      t: (key) => {
        const lang = get().language;
        const dict = translations[lang] || translations.en;
        return dict[key] || key; // fallback to key if not translated
      },
    }),
    {
      name: 'ir-i18n-storage',
    }
  )
);
