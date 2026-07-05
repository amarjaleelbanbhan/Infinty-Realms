// NPC generation prompts
export const NPC_SYSTEM_PROMPT = `You are creating NPCs for Infinity Realms, a living fantasy world RPG.
Each NPC should feel like a real person with history, motivations, and quirks.
Always respond with valid JSON. Keep all text fields concise but evocative.`;

export const buildNPCPrompt = (context: {
  role: string;
  biome: string;
  cityName?: string;
  worldAge: number;
}) => `Create an NPC ${context.role} living in a ${context.biome} area${context.cityName ? ` in the city of ${context.cityName}` : ''}.
The world is ${context.worldAge} days old — it's a ${context.worldAge < 30 ? 'young, unsettled' : context.worldAge < 100 ? 'growing' : 'established'} world.

Respond with this exact JSON structure:
{
  "name": "Full name (first + optional last)",
  "personality": "friendly|grumpy|mysterious|cheerful|cowardly|brave|greedy|wise",
  "backstory": "2 sentence personal history",
  "greeting": "First thing they say when player approaches (in-character)",
  "farewellLine": "Parting words",
  "questHook": "Optional hint at a quest they might give",
  "quirk": "One unique behavioral trait (e.g., 'always speaks in riddles', 'constantly looks over shoulder')"
}`;
