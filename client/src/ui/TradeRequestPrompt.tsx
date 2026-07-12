import { useTradeStore } from '@stores/useTradeStore';
import { ArrowRightLeft, Check, X } from 'lucide-react';

/** Shown on the *target's* client when another real player sends a trade request over the socket. */
export function TradeRequestPrompt() {
  const { incomingRequest, acceptIncomingRequest, declineIncomingRequest } = useTradeStore();

  if (!incomingRequest) return null;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-in fade-in slide-in-from-top-4">
      <div className="bg-slate-900 border-2 border-realm-border rounded-lg shadow-2xl p-4 flex items-center gap-4">
        <ArrowRightLeft className="w-5 h-5 text-realm-accent shrink-0" />
        <span className="font-ui text-white text-sm">
          <strong>{incomingRequest.fromName}</strong> wants to trade with you.
        </span>
        <div className="flex gap-2">
          <button
            onClick={acceptIncomingRequest}
            className="p-2 rounded bg-green-600/20 text-green-400 border border-green-600 hover:bg-green-600/40 transition-colors"
            aria-label="Accept trade request"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={declineIncomingRequest}
            className="p-2 rounded bg-red-600/20 text-red-400 border border-red-600 hover:bg-red-600/40 transition-colors"
            aria-label="Decline trade request"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
