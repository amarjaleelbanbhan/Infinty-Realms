import { usePartyStore } from '@stores/usePartyStore';
import { Users, Check, X } from 'lucide-react';

/** Shown on the *target's* client when another real player sends a party invite over the socket. */
export function PartyInvitePrompt() {
  const { incomingInvite, acceptInvite, declineInvite } = usePartyStore();

  if (!incomingInvite) return null;

  return (
    <div className="absolute top-36 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-in fade-in slide-in-from-top-4">
      <div className="bg-slate-900 border-2 border-realm-border rounded-lg shadow-2xl p-4 flex items-center gap-4">
        <Users className="w-5 h-5 text-blue-400 shrink-0" />
        <span className="font-ui text-white text-sm">
          <strong>{incomingInvite.fromName}</strong> invited you to their party.
        </span>
        <div className="flex gap-2">
          <button
            onClick={acceptInvite}
            className="p-2 rounded bg-green-600/20 text-green-400 border border-green-600 hover:bg-green-600/40 transition-colors"
            aria-label="Accept party invite"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={declineInvite}
            className="p-2 rounded bg-red-600/20 text-red-400 border border-red-600 hover:bg-red-600/40 transition-colors"
            aria-label="Decline party invite"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
