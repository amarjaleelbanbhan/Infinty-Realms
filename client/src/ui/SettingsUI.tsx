import { useSettingsStore } from '@stores/useSettingsStore';
import { Settings, X, Volume2, Monitor, Activity } from 'lucide-react';
import { useUIStore } from '@stores/useUIStore';

export function SettingsUI({ onClose }: { onClose: () => void }) {
  const { 
    masterVolume, setMasterVolume,
    musicVolume, setMusicVolume,
    sfxVolume, setSfxVolume,
    postProcessing, setPostProcessing,
    screenShake, setScreenShake
  } = useSettingsStore();
  
  const { addToast } = useUIStore();

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
            <h2 className="font-game tracking-wider text-xl text-white drop-shadow-md uppercase">Settings</h2>
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
              <Volume2 className="w-4 h-4" /> Audio
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-ui text-white">
                <span>Master Volume</span>
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
                <span>Music</span>
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
                <span>SFX</span>
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
              <Monitor className="w-4 h-4" /> Graphics
            </h3>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-ui text-sm text-white">Post-Processing</div>
                <div className="text-xs text-realm-text-muted">Bloom & Vignette (Heavy)</div>
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
              <Activity className="w-4 h-4" /> Gameplay
            </h3>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-ui text-sm text-white">Screen Shake</div>
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

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end">
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-realm-accent text-white font-game rounded shadow hover:bg-realm-accent/80 transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
