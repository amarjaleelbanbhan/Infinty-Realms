import { useState, useEffect, useRef } from 'react';
import { socketManager } from '@game/systems/SocketManager';
import { useUIStore } from '@stores/useUIStore';
import type { ChatMessage } from '@shared/types';

export function Chat() {
  const { currentScreen } = useUIStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [activeChannel, setActiveChannel] = useState<'world' | 'local' | 'party'>('world');
  const [isExpanded, setIsExpanded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMessage = (data: unknown) => {
      const msg = data as ChatMessage;
      setMessages((prev) => [...prev.slice(-49), msg]);
    };

    socketManager.on('chatMessage', handleMessage);
    return () => socketManager.off('chatMessage', handleMessage);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isExpanded]);

  if (currentScreen !== 'game') return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    socketManager.sendChat(input.trim(), activeChannel);
    setInput('');
  };

  return (
    <div className="absolute bottom-4 left-4 z-20 pointer-events-auto w-[320px]">
      <div className={`glass rounded-2xl transition-all duration-300 ${isExpanded ? 'h-72' : 'h-32'} flex flex-col shadow-2xl`}>
        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs">
          <div className="flex gap-2 font-mono">
            {(['world', 'local', 'party'] as const).map((ch) => (
              <button
                key={ch}
                onClick={() => setActiveChannel(ch)}
                className={`capitalize ${activeChannel === ch ? 'text-realm-accent font-bold' : 'text-realm-text-muted hover:text-white'}`}
              >
                {ch}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-realm-text-muted hover:text-white"
          >
            {isExpanded ? '▼' : '▲'}
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 text-xs font-ui">
          {messages.map((m, i) => (
            <div key={i} className="leading-tight">
              <span className="font-game text-realm-gold font-semibold">{m.playerName}: </span>
              <span className="text-gray-200">{m.message}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 border-t border-white/10 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Chat in ${activeChannel}...`}
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-realm-accent placeholder:text-white/30"
          />
          <button type="submit" className="btn-primary text-xs py-1.5 px-4 rounded-xl">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
