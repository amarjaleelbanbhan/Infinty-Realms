import { useState, useEffect } from 'react';
import type { OfflineReport } from '@shared/types';
import { useUIStore } from '@stores/useUIStore';
import { Coins, Star, Sparkles } from 'lucide-react';

export function OfflineProgressUI() {
  const [report, setReport] = useState<OfflineReport | null>(null);

  useEffect(() => {
    const handleProgress = (e: CustomEvent<OfflineReport>) => {
      setReport(e.detail);
    };

    window.addEventListener('ir:offline_progress', handleProgress as EventListener);
    return () => window.removeEventListener('ir:offline_progress', handleProgress as EventListener);
  }, []);

  if (!report) return null;

  const hours = Math.floor(report.timeOfflineMs / 3600000);
  const minutes = Math.floor((report.timeOfflineMs % 3600000) / 60000);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass p-8 max-w-md w-full animate-slide-up border-realm-accent">
        <h2 className="font-game text-3xl text-center text-realm-gold mb-2">Welcome Back!</h2>
        <p className="text-center text-realm-text-muted mb-6">
          You were offline for {hours}h {minutes}m.
          <br />
          Your heroes and golems kept working.
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
            <span className="flex items-center gap-3"><Coins className="w-6 h-6 text-realm-gold" /> Gold Earned</span>
            <span className="font-mono text-realm-gold font-bold text-lg">+{report.goldEarned}</span>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
            <span className="flex items-center gap-3"><Star className="w-6 h-6 text-realm-xp" /> Exp Earned</span>
            <span className="font-mono text-realm-xp font-bold text-lg">+{report.expEarned}</span>
          </div>

          <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
            <span className="flex items-center gap-3"><Sparkles className="w-6 h-6 text-realm-mana" /> Essence Gathered</span>
            <span className="font-mono text-realm-mana font-bold text-lg">+{report.essenceEarned}</span>
          </div>
        </div>

        <button
          className="btn-primary w-full"
          onClick={() => {
            setReport(null);
            useUIStore.getState().addToast('Offline rewards claimed!', 'success');
          }}
        >
          Claim Rewards
        </button>
      </div>
    </div>
  );
}
