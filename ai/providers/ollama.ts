// ============================================================
// Ollama AI Provider — Local LLM integration
// Set AI_PROVIDER=ollama and ensure Ollama is running locally
// ============================================================

import { QUEST_SYSTEM_PROMPT, buildQuestPrompt } from '../prompts/quest';
import { NPC_SYSTEM_PROMPT, buildNPCPrompt } from '../prompts/npc';
import { EVENT_SYSTEM_PROMPT, buildEventPrompt } from '../prompts/event';
import type { QuestGenerationRequest, NPCGenerationRequest, EventGenerationRequest } from '@infinity-realms/shared/types';

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3';

async function chat(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      format: 'json',
    }),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status} ${await res.text()}`);
  const data = await res.json() as { message: { content: string } };
  return data.message.content;
}

export async function generateQuestOllama(req: QuestGenerationRequest): Promise<object> {
  const raw = await chat(QUEST_SYSTEM_PROMPT, buildQuestPrompt(req));
  return JSON.parse(raw);
}

export async function generateNPCOllama(req: NPCGenerationRequest): Promise<object> {
  const raw = await chat(NPC_SYSTEM_PROMPT, buildNPCPrompt(req));
  return JSON.parse(raw);
}

export async function generateEventOllama(req: EventGenerationRequest): Promise<object> {
  const raw = await chat(EVENT_SYSTEM_PROMPT, buildEventPrompt(req));
  return JSON.parse(raw);
}
