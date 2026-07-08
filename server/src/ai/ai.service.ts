import { Injectable } from '@nestjs/common';
import type { QuestGenerationRequest, NPCGenerationRequest, EventGenerationRequest, ItemGenerationRequest, DialogueGenerationRequest } from '@infinity-realms/shared/types';
import { generateQuest, generateNPC, generateWorldEvent, generateItem, generateDialogue } from '@infinity-realms/ai';

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

  generateItem(req: ItemGenerationRequest) {
    return generateItem(req);
  }

  generateDialogue(req: DialogueGenerationRequest) {
    return generateDialogue(req);
  }
}
