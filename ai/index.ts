// ============================================================
// AI Module — Main Entry Point
// Routes generation requests to the configured provider
// ============================================================

import type {
  QuestGenerationRequest,
  NPCGenerationRequest,
  EventGenerationRequest,
  ItemGenerationRequest,
  Quest,
  NPC,
  WorldEvent,
  Item,
  DialogueGenerationRequest,
} from '@infinity-realms/shared/types';

import {
  generateQuest as mockQuest,
  generateNPC as mockNPC,
  generateEvent as mockEvent,
  generateItem as mockItem,
  generateDialogue as mockDialogue,
} from './providers/mock';

type AIProvider = 'mock' | 'ollama' | 'openai';

const PROVIDER: AIProvider = (process.env.AI_PROVIDER as AIProvider) ?? 'mock';

let _callCounter = 0;
function nextCallId(): string {
  return `call-${Date.now()}-${++_callCounter}`;
}

// ─── Quest Generation ─────────────────────────────────────────

export async function generateQuest(req: QuestGenerationRequest): Promise<Partial<Quest>> {
  const callId = nextCallId();

  if (PROVIDER === 'mock') {
    return mockQuest(req, callId);
  }

  try {
    if (PROVIDER === 'ollama') {
      const { generateQuestOllama } = await import('./providers/ollama');
      return (await generateQuestOllama(req)) as Partial<Quest>;
    }
    if (PROVIDER === 'openai') {
      const { generateQuestOpenAI } = await import('./providers/openai');
      return (await generateQuestOpenAI(req)) as Partial<Quest>;
    }
  } catch (err) {
    console.warn(`[AI] ${PROVIDER} quest generation failed, falling back to mock:`, err);
    return mockQuest(req, callId);
  }

  return mockQuest(req, callId);
}

// ─── NPC Generation ───────────────────────────────────────────

export async function generateNPC(req: NPCGenerationRequest): Promise<Partial<NPC>> {
  const callId = nextCallId();

  if (PROVIDER === 'mock') {
    return mockNPC(req, callId);
  }

  try {
    if (PROVIDER === 'ollama') {
      const { generateNPCOllama } = await import('./providers/ollama');
      return (await generateNPCOllama(req)) as Partial<NPC>;
    }
    if (PROVIDER === 'openai') {
      const { generateNPCOpenAI } = await import('./providers/openai');
      return (await generateNPCOpenAI(req)) as Partial<NPC>;
    }
  } catch (err) {
    console.warn(`[AI] ${PROVIDER} NPC generation failed, falling back to mock:`, err);
    return mockNPC(req, callId);
  }

  return mockNPC(req, callId);
}

// ─── World Event Generation ───────────────────────────────────

export async function generateWorldEvent(req: EventGenerationRequest): Promise<Partial<WorldEvent>> {
  const callId = nextCallId();

  if (PROVIDER === 'mock') {
    return mockEvent(req, callId);
  }

  try {
    if (PROVIDER === 'ollama') {
      const { generateEventOllama } = await import('./providers/ollama');
      return (await generateEventOllama(req)) as Partial<WorldEvent>;
    }
    if (PROVIDER === 'openai') {
      const { generateEventOpenAI } = await import('./providers/openai');
      return (await generateEventOpenAI(req)) as Partial<WorldEvent>;
    }
  } catch (err) {
    console.warn(`[AI] ${PROVIDER} event generation failed, falling back to mock:`, err);
    return mockEvent(req, callId);
  }

  return mockEvent(req, callId);
}

export async function generateItem(req: ItemGenerationRequest): Promise<Partial<Item>> {
  const callId = nextCallId();

  if (PROVIDER === 'mock') {
    return mockItem(req, callId);
  }

  try {
    if (PROVIDER === 'ollama') {
      const { generateItemOllama } = (await import('./providers/ollama')) as any;
      return (await generateItemOllama(req)) as Partial<Item>;
    }
    if (PROVIDER === 'openai') {
      const { generateItemOpenAI } = (await import('./providers/openai')) as any;
      return (await generateItemOpenAI(req)) as Partial<Item>;
    }
  } catch (err) {
    console.warn(`[AI] ${PROVIDER} item generation failed, falling back to mock:`, err);
    return mockItem(req, callId);
  }

  return mockItem(req, callId);
}

// ─── Dialogue Generation ───────────────────────────────────────

export async function generateDialogue(req: DialogueGenerationRequest): Promise<string> {
  const callId = nextCallId();

  if (PROVIDER === 'mock') {
    return mockDialogue(req, callId);
  }

  try {
    if (PROVIDER === 'ollama') {
      const { generateDialogueOllama } = await import('./providers/ollama');
      return await generateDialogueOllama(req);
    }
    if (PROVIDER === 'openai') {
      const { generateDialogueOpenAI } = await import('./providers/openai');
      return await generateDialogueOpenAI(req);
    }
  } catch (err) {
    console.warn(`[AI] ${PROVIDER} dialogue generation failed, falling back to mock:`, err);
    return mockDialogue(req, callId);
  }

  return mockDialogue(req, callId);
}

export { PROVIDER as activeProvider };
