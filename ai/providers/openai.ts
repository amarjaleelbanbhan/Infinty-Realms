// ============================================================
// OpenAI-Compatible Provider
// Works with OpenAI, Groq, Together.ai, Anyscale, etc.
// Set AI_PROVIDER=openai + OPENAI_API_KEY + OPENAI_BASE_URL
// ============================================================

import { QUEST_SYSTEM_PROMPT, buildQuestPrompt } from '../prompts/quest';
import { NPC_SYSTEM_PROMPT, buildNPCPrompt } from '../prompts/npc';
import { EVENT_SYSTEM_PROMPT, buildEventPrompt } from '../prompts/event';
import { DIALOGUE_SYSTEM_PROMPT, buildDialoguePrompt } from '../prompts/dialogue';
import type { QuestGenerationRequest, NPCGenerationRequest, EventGenerationRequest, DialogueGenerationRequest } from '@infinity-realms/shared/types';

const OPENAI_BASE = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
const OPENAI_KEY = process.env.OPENAI_API_KEY ?? '';

async function chat(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!OPENAI_KEY) throw new Error('OPENAI_API_KEY is not set');

  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.85,
      max_tokens: 512,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`);
  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0].message.content;
}

async function chatText(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!OPENAI_KEY) throw new Error('OPENAI_API_KEY is not set');

  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.85,
      max_tokens: 512,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`);
  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0].message.content;
}

export async function generateQuestOpenAI(req: QuestGenerationRequest): Promise<object> {
  const raw = await chat(QUEST_SYSTEM_PROMPT, buildQuestPrompt(req));
  return JSON.parse(raw);
}

export async function generateNPCOpenAI(req: NPCGenerationRequest): Promise<object> {
  const raw = await chat(NPC_SYSTEM_PROMPT, buildNPCPrompt(req));
  return JSON.parse(raw);
}

export async function generateEventOpenAI(req: EventGenerationRequest): Promise<object> {
  const raw = await chat(EVENT_SYSTEM_PROMPT, buildEventPrompt(req));
  return JSON.parse(raw);
}

export async function generateDialogueOpenAI(req: DialogueGenerationRequest): Promise<string> {
  return chatText(DIALOGUE_SYSTEM_PROMPT, buildDialoguePrompt(req));
}
