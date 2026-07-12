import { useSettingsStore } from '@stores/useSettingsStore';
import { Settings, X, Volume2, Monitor, Activity } from 'lucide-react';
import { useUIStore } from '@stores/useUIStore';
import { useI18nStore } from '@stores/useI18nStore';
import { Globe } from 'lucide-react';

export function SettingsUI({ onClose }: { onClose: () => void }) {
  const { 
    masterVolume, setMasterVolume,
    musicVolume, setMusicVolume,
    sfxVolume, setSfxVolume,
    postProcessing, setPostProcessing,
    screenShake, setScreenShake
  } = useSettingsStore();
  
  const { addToast } = useUIStore();
  const { language, setLanguage, t } = useI18nStore();

  const handleSave = () => {
    addToast('Settings updated!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
      <div className="premium-glass premium-border w-full max-w-md flex flex-col rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-realm-accent" />
            <h2 className="font-game tracking-wider text-xl text-white drop-shadow-md uppercase">{t('settings.title')}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* Audio Section */}
          <div className="space-y-4">
            <h3 className="font-game text-sm text-realm-accent uppercase tracking-widest flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4" /> {t('settings.audio')}
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-ui text-white">
                <span>{t('settings.masterVolume')}</span>
                <span>{Math.round(masterVolume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.05" 
                value={masterVolume} 
                onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                className="w-full accent-realm-accent"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-ui text-white">
                <span>{t('settings.musicVolume')}</span>
                <span>{Math.round(musicVolume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.05" 
                value={musicVolume} 
                onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                className="w-full accent-realm-accent"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-ui text-white">
                <span>{t('settings.sfxVolume')}</span>
                <span>{Math.round(sfxVolume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.05" 
                value={sfxVolume} 
                onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                className="w-full accent-realm-accent"
              />
            </div>
          </div>

          {/* Graphics Section */}
          <div className="space-y-4">
            <h3 className="font-game text-sm text-realm-accent uppercase tracking-widest flex items-center gap-2 mb-2">
              <Monitor className="w-4 h-4" /> {t('settings.video')}
            </h3>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-ui text-sm text-white">{t('settings.postProcessing')}</div>
                <div className="text-xs text-realm-text-muted">Bloom & Vignette</div>
              </div>
              <button 
                onClick={() => setPostProcessing(!postProcessing)}
                className={`w-12 h-6 rounded-full transition-colors relative ${postProcessing ? 'bg-realm-accent' : 'bg-gray-600'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${postProcessing ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {/* Gameplay Section */}
          <div className="space-y-4">
            <h3 className="font-game text-sm text-realm-accent uppercase tracking-widest flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4" /> {t('settings.gameplay')}
            </h3>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-ui text-sm text-white">{t('settings.cameraShake')}</div>
                <div className="text-xs text-realm-text-muted">Camera impacts in combat</div>
              </div>
              <button 
                onClick={() => setScreenShake(!screenShake)}
                className={`w-12 h-6 rounded-full transition-colors relative ${screenShake ? 'bg-realm-accent' : 'bg-gray-600'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${screenShake ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {/* Localization Section */}
          <div className="space-y-4">
            <h3 className="font-game text-sm text-realm-accent uppercase tracking-widest flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4" /> {t('settings.language')}
            </h3>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-ui text-sm text-white">{t('settings.language')}</div>
              </div>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
                className="bg-black/50 text-white font-ui text-sm border border-white/20 rounded-lg px-3 py-1 outline-none focus:border-realm-accent"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end">
          <button 
            className="btn-gold py-2 px-8 text-sm"
            onClick={handleSave}
          >
            {t('settings.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
