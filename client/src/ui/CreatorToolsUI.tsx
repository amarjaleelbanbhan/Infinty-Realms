import { useState } from 'react';
import { useUIStore } from '@stores/useUIStore';
import { Palette, Clipboard, Wrench, X } from 'lucide-react';

export function CreatorToolsUI({ onClose }: { onClose: () => void }) {
  const { addToast } = useUIStore();
  const [questTitle, setQuestTitle] = useState('');
  const [questDesc, setQuestDesc] = useState('');
  const [exportedJson, setExportedJson] = useState<string | null>(null);

  const handleExport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questTitle.trim() || !questDesc.trim()) return;

    const questBlueprint = {
      title: questTitle.trim(),
      description: questDesc.trim(),
      type: 'custom',
      author: 'Player Creator',
      objectives: [{ description: `Fulfill custom challenge: ${questTitle}`, targetType: 'location', quantity: 1 }],
      rewards: { experience: 200, gold: 100 },
    };

    setExportedJson(JSON.stringify(questBlueprint, null, 2));
    addToast('Mod blueprint generated!', 'success');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass p-6 w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-realm-border pb-3 mb-4">
          <h2 className="font-game text-xl text-white flex items-center gap-2"><Palette className="w-5 h-5 text-realm-accent" /> Creator & Modding Tools</h2>
          <button onClick={onClose} className="text-realm-text-muted hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-xs text-realm-text-muted font-ui mb-4">
          Draft custom quests, challenges, and world content definitions. Published creations can be shared across the community.
        </p>

        {exportedJson ? (
          <div>
            <h3 className="font-game text-xs text-realm-gold uppercase tracking-wider mb-2">Generated Quest Blueprint JSON</h3>
            <pre className="bg-realm-bg border border-realm-border rounded-lg p-3 text-xs font-mono text-realm-xp overflow-x-auto max-h-48 mb-4">
              {exportedJson}
            </pre>
            <div className="flex gap-2">
              <button
                className="btn-gold flex-1 text-xs py-2 flex items-center justify-center gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(exportedJson);
                  addToast('Blueprint JSON copied to clipboard!', 'success');
                }}
              >
                <Clipboard className="w-4 h-4" /> Copy Blueprint JSON
              </button>
              <button className="btn-secondary text-xs py-2 px-4" onClick={() => setExportedJson(null)}>
                New
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleExport} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-realm-text-muted uppercase mb-1">Quest Title</label>
              <input
                type="text"
                value={questTitle}
                onChange={(e) => setQuestTitle(e.target.value)}
                placeholder="e.g. Trial of the Arcane Crystal"
                maxLength={40}
                className="w-full bg-realm-bg border border-realm-border rounded-lg px-3 py-2 font-ui text-sm text-white focus:outline-none focus:border-realm-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-realm-text-muted uppercase mb-1">Description & Lore</label>
              <textarea
                value={questDesc}
                onChange={(e) => setQuestDesc(e.target.value)}
                placeholder="Describe the challenge..."
                rows={3}
                className="w-full bg-realm-bg border border-realm-border rounded-lg px-3 py-2 font-ui text-sm text-white focus:outline-none focus:border-realm-accent resize-none"
              />
            </div>

            <button type="submit" className="btn-primary w-full text-sm py-2.5 flex items-center justify-center gap-2">
              <Wrench className="w-4 h-4" /> Generate Quest Blueprint
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
