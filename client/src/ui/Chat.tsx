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
    const handleMessage = (msg: ChatMessage) => {
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
    <div className="absolute bottom-4 left-4 z-20 pointer-events-auto w-80">
      <div className={`glass-dark rounded-xl transition-all duration-300 ${isExpanded ? 'h-64' : 'h-32'} flex flex-col`}>
        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b border-realm-border px-3 py-1.5 text-xs">
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
        <form onSubmit={handleSend} className="p-2 border-t border-realm-border flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Chat in ${activeChannel}...`}
            className="flex-1 bg-realm-bg border border-realm-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-realm-accent"
          />
          <button type="submit" className="btn-primary text-xs py-1 px-3">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
