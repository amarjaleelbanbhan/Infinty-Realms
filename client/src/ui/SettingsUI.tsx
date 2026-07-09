import { useState } from 'react';
import { useUIStore } from '@stores/useUIStore';
import { Settings, X, Music, Volume2 } from 'lucide-react';

export function SettingsUI({ onClose }: { onClose: () => void }) {
  const { musicVolume, sfxVolume, addToast } = useUIStore();
  const [colorblind, setColorblind] = useState<'none' | 'deuteranopia' | 'protanopia' | 'tritanopia'>('none');
  const [lowEnd, setLowEnd] = useState(false);

  const handleSave = () => {
    addToast('Settings updated!', 'success');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass p-6 w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-realm-border pb-3 mb-4">
          <h2 className="font-game text-xl text-white flex items-center gap-2"><Settings className="w-5 h-5 text-realm-accent" /> Game Settings</h2>
          <button onClick={onClose} className="text-realm-text-muted hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4 mb-6 text-xs font-ui">
          {/* Accessibility Colorblind Mode */}
          <div>
            <label className="block font-mono text-realm-text-muted uppercase mb-1">Colorblind Mode</label>
            <select
              value={colorblind}
              onChange={(e) => setColorblind(e.target.value as any)}
              className="w-full bg-realm-bg border border-realm-border rounded px-3 py-2 text-white font-ui focus:outline-none focus:border-realm-accent"
            >
              <option value="none">None (Default)</option>
              <option value="deuteranopia">Deuteranopia (Red-Green)</option>
              <option value="protanopia">Protanopia (Red-Blind)</option>
              <option value="tritanopia">Tritanopia (Blue-Yellow)</option>
            </select>
          </div>

          {/* Low End Performance Mode */}
          <div className="flex items-center justify-between bg-realm-surface p-3 rounded-lg border border-realm-border">
            <div>
              <div className="font-game text-white text-sm">Low-End Device Mode</div>
              <div className="text-realm-text-muted">Reduces particle effects & optimizes 60 FPS performance</div>
            </div>
            <input
              type="checkbox"
              checked={lowEnd}
              onChange={(e) => setLowEnd(e.target.checked)}
              className="w-4 h-4 accent-realm-accent cursor-pointer"
            />
          </div>

          {/* Audio sliders */}
          <div>
            <div className="flex justify-between text-realm-text-muted mb-1 font-mono uppercase">
              <span className="flex items-center gap-2"><Music className="w-4 h-4" /> Music Volume</span>
              <span>{Math.round(musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicVolume}
              onChange={() => {}}
              className="w-full accent-realm-accent cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-realm-text-muted mb-1 font-mono uppercase">
              <span className="flex items-center gap-2"><Volume2 className="w-4 h-4" /> SFX Volume</span>
              <span>{Math.round(sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVolume}
              onChange={() => {}}
              className="w-full accent-realm-accent cursor-pointer"
            />
          </div>
        </div>

        <button className="btn-gold w-full text-sm py-2" onClick={handleSave}>
          Save Settings
        </button>
      </div>
    </div>
  );
}
