import { Injectable } from '@nestjs/common';
import type { QuestGenerationRequest, NPCGenerationRequest, EventGenerationRequest } from '@infinity-realms/shared/types';
import { generateQuest, generateNPC, generateWorldEvent } from '@infinity-realms/ai';

@Injectable()
export class AiService {
  generateQuest(req: QuestGenerationRequest) {
    return generateQuest(req);
  }

  generateNPC(req: NPCGenerationRequest) {
    return generateNPC(req);
  }

  generateWorldEvent(req: EventGenerationRequest) {
    return generateWorldEvent(req);
  }
}
