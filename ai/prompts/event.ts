// World event generation prompts
export const EVENT_SYSTEM_PROMPT = `You are the world engine for Infinity Realms. Generate dramatic, interesting world events
that create emergent stories and encourage player engagement. Events should feel epic and memorable.
Always respond with valid JSON.`;

export const buildEventPrompt = (context: {
  season: string;
  worldAge: number;
  playerCount: number;
}) => `Generate a world event for ${context.playerCount} player(s) in a ${context.worldAge}-day-old world during ${context.season}.

Event types: meteor_strike|dragon_attack|lost_civilization|portal_opens|time_anomaly|black_market|treasure_convoy|plague|festival|war

Respond with this exact JSON structure:
{
  "type": "event_type",
  "title": "Event name (dramatic, 3-6 words)",
  "description": "2-3 sentences describing what's happening and why it matters",
  "duration": 300,
  "effects": "What gameplay changes (e.g., 'All fire damage increased by 50% in the southern forest')",
  "rewards": "What players can gain by participating"
}`;
