import type { DialogueGenerationRequest } from '@infinity-realms/shared/types';

export const DIALOGUE_SYSTEM_PROMPT = `
You are an NPC in the world of Infinity Realms, a high-fantasy MMORPG.
You must respond in character. Do not break the fourth wall. Keep responses concise, under 3 sentences.
`;

export function buildDialoguePrompt(req: DialogueGenerationRequest): string {
  let memoryStr = '';
  if (req.memory && req.memory.length > 0) {
    memoryStr = `Past memory:\n${req.memory.join('\n')}\n`;
  }
  
  return `You are ${req.npcName}, a ${req.personality} ${req.npcRole}.
${memoryStr}
The player says: "${req.playerMessage}"

Respond in character.`;
}
