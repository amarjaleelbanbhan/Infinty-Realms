import { useEffect, useState } from 'react';
import { useEventStore } from '@game/systems/EventSystem';

export function EventBanner() {
  const { activeEvent, clearEvent } = useEventStore();
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!activeEvent) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - activeEvent.startTime) / 1000);
      const remaining = Math.max(0, activeEvent.duration - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearEvent();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeEvent, clearEvent]);

  if (!activeEvent || timeLeft <= 0) return null;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-auto animate-slide-down">
      <div className="glass-dark border border-realm-gold/50 px-5 py-2.5 rounded-xl shadow-glow flex items-center gap-4 max-w-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-game text-sm text-realm-gold font-bold">{activeEvent.title}</span>
            <span className="font-mono text-xs bg-realm-gold/20 text-realm-gold px-2 py-0.5 rounded-full border border-realm-gold/40">
              {formatTime(timeLeft)}
            </span>
          </div>
          <p className="text-xs text-gray-300 font-ui mt-0.5 line-clamp-1">{activeEvent.description}</p>
          <div className="text-xs font-mono text-realm-xp mt-1">✨ Modifiers: {activeEvent.effects}</div>
        </div>
      </div>
    </div>
  );
}
