// Quest generation prompts
export const QUEST_SYSTEM_PROMPT = `You are the AI Dungeon Master for Infinity Realms, a procedural fantasy RPG.
Generate creative, engaging quests that feel alive and connected to the world.
Always respond with valid JSON matching the schema provided.
Keep descriptions vivid but concise (2-3 sentences each).
Make quests feel personal and meaningful, not just "kill 10 rats".`;

export const buildQuestPrompt = (context: {
  biome: string;
  season: string;
  playerLevel: number;
  nearbyNpcName?: string;
  npcRole?: string;
  npcPersonality?: string;
  npcMemory?: string[];
  recentEvents?: string[];
}) => `Generate a quest for a level ${context.playerLevel} player in a ${context.biome} biome during ${context.season}.
${context.nearbyNpcName ? `The quest giver is ${context.nearbyNpcName}${context.npcRole ? `, a ${context.npcRole}` : ''}${context.npcPersonality ? ` who is ${context.npcPersonality}` : ''}.` : ''}
${context.npcMemory?.length ? `The NPC remembers: ${context.npcMemory.join('; ')}.` : ''}
${context.recentEvents?.length ? `Recent world events: ${context.recentEvents.join(', ')}.` : ''}

Respond with this exact JSON structure:
{
  "title": "Quest title (5-8 words)",
  "description": "2-3 sentence hook that draws the player in",
  "type": "kill|collect|escort|explore|deliver|mystery|boss",
  "lore": "2-3 sentences of backstory that makes the world feel alive",
  "objectives": [
    {
      "description": "What the player must do",
      "targetType": "enemy|item|location|npc",
      "targetId": "identifier string",
      "quantity": 1
    }
  ],
  "rewards": {
    "experience": 100,
    "gold": 50,
    "items": [],
    "worldChange": "Optional: what changes in the world when this is complete"
  }
}`;
