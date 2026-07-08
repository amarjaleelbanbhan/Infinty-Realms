// ============================================================
// Mock AI Provider — Template-based generation (zero config)
// Produces varied, interesting content without any LLM
// ============================================================

import type {
  QuestGenerationRequest,
  NPCGenerationRequest,
  EventGenerationRequest,
  Quest,
  NPC,
  WorldEvent,
  QuestType,
  NPCPersonality,
  WorldEventType,
  DialogueGenerationRequest,
} from '@infinity-realms/shared/types';

// Seeded PRNG for consistent results per seed
function seededRandom(seed: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function () {
    h ^= h << 13;
    h ^= h >> 17;
    h ^= h << 5;
    return ((h >>> 0) / 4294967296);
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ─── Quest Templates ──────────────────────────────────────────

const QUEST_PREFIXES = ['The', 'A', 'Lost', 'Stolen', 'Ancient', 'Forgotten', 'Dark', 'Golden'];
const QUEST_NOUNS = ['Artifact', 'Tome', 'Crystal', 'Relic', 'Scroll', 'Blade', 'Crown', 'Compass'];
const QUEST_SUFFIXES = ['of Destiny', 'of the Ancients', 'of Power', 'of the Fallen', 'of Shadows', 'of Light'];

const BIOME_LORE: Record<string, string[]> = {
  forest: [
    'Whispers drift between ancient oaks of a time before the great war.',
    'The trees have grown twisted since the mage\'s tower collapsed three winters ago.',
    'Druids speak of a sacred grove defiled by unknown hands.',
  ],
  desert: [
    'The sands hide ruins of the Sun Empire, swallowed by storms centuries ago.',
    'A caravan went missing on the eastern trade route last month.',
    'Strange lights have been seen at night near the sandstone pillars.',
  ],
  snow: [
    'The frost giants have retreated deeper into the tundra — something disturbs them.',
    'An ancient vault sealed beneath the glacier is beginning to crack.',
    'Hunters report wolf tracks the size of cart wheels near the northern pass.',
  ],
  plains: [
    'Farmers speak of crops withering despite good rains — something is wrong in the soil.',
    'Bandits have been emboldened since the guard captain vanished.',
    'A wandering bard carries tales of a buried treasure from the old kingdom.',
  ],
  ocean: [
    'Ships have gone missing along the coast despite calm weather.',
    'Merfolk have been spotted near the fishing villages — an ill omen, say the elders.',
    'A message in a bottle speaks of a sunken city still inhabited.',
  ],
  volcano: [
    'The volcano stirs for the first time in living memory.',
    'Fire cultists have begun gathering at the caldera\'s edge.',
    'Salamanders emerge from the lava flows, driven out by something deeper.',
  ],
  swamp: [
    'The witch of the marsh has not been seen in weeks — her cottage sits dark and empty.',
    'Will-o-wisps lead travelers astray in greater numbers than ever before.',
    'An ancient ritual circle has appeared in the deepest bog.',
  ],
  beach: [
    'Pirates have made camp on the southern shore, and they\'re asking questions.',
    'Treasure washes ashore from a wreck no one can find.',
    'Crabs the size of horses guard an underwater cave entrance.',
  ],
};

const QUEST_HOOKS: Record<string, string[]> = {
  kill: [
    'A creature terrorizes the local village. Track it down and end its rampage.',
    'The bounty board lists a dangerous monster. Claim the reward — if you survive.',
    'Something hunts the hunters. Turn the tables before it\'s too late.',
  ],
  collect: [
    'An alchemist needs rare ingredients scattered across dangerous territory.',
    'Scattered pages of a forbidden tome must be recovered before the wrong hands find them.',
    'The ritual requires five components hidden in the most perilous corners of the realm.',
  ],
  escort: [
    'A merchant carries priceless cargo through bandit territory and needs protection.',
    'A scholar must reach an ancient site safely. The road is far from safe.',
    'Refugees flee a destroyed village. Guide them to the nearest city.',
  ],
  explore: [
    'Cartographers pay well for accurate maps of uncharted territory.',
    'Strange signals emerge from an unexplored ruin. Investigate and report back.',
    'A sealed dungeon has finally opened. Be the first to document its secrets.',
  ],
  mystery: [
    'People disappear near the old crossroads. Find out why — and stop it.',
    'Identical messages arrive for every town elder. Someone is sending a warning.',
    'A child claims to have seen the future. Their visions are coming true.',
  ],
};

export function generateQuest(req: QuestGenerationRequest, callId: string): Partial<Quest> {
  const seed = `${req.worldSeed}-${req.biome}-${callId}`;
  const rng = seededRandom(seed);

  const types: QuestType[] = ['kill', 'collect', 'escort', 'explore', 'mystery'];
  const type = pick(types, rng);
  const lorePool = BIOME_LORE[req.biome] ?? BIOME_LORE.plains;
  const hookPool = QUEST_HOOKS[type] ?? QUEST_HOOKS.kill;

  const prefix = pick(QUEST_PREFIXES, rng);
  const noun = pick(QUEST_NOUNS, rng);
  const suffix = pick(QUEST_SUFFIXES, rng);
  
  let title = type === 'mystery' ? `Mystery of the ${noun}` : `${prefix} ${noun} ${suffix}`;
  let description = pick(hookPool, rng);

  if (req.prompt) {
    const cleanPrompt = req.prompt.trim();
    const words = cleanPrompt.split(/\s+/);
    title = words.slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    description = `Fulfill the quest challenge: "${cleanPrompt}".`;
  }

  const expBase = Math.floor(50 + req.playerLevel * 30 * (0.8 + rng() * 0.4));
  const goldBase = Math.floor(20 + req.playerLevel * 15 * (0.8 + rng() * 0.4));

  const targetCounts: Record<QuestType, number> = {
    kill: Math.floor(3 + rng() * 5),
    collect: Math.floor(3 + rng() * 7),
    escort: 1,
    explore: Math.floor(2 + rng() * 3),
    deliver: 1,
    mystery: 1,
    boss: 1,
  };

  return {
    title,
    description,
    type,
    lore: pick(lorePool, rng),
    aiGenerated: false,
    objectives: [
      {
        description: `Complete the ${type} objective`,
        targetType: type === 'kill' ? 'enemy' : type === 'collect' ? 'item' : 'location',
        targetId: `${type}-target-${Math.floor(rng() * 1000)}`,
        quantity: targetCounts[type] ?? 1,
        current: 0,
      },
    ],
    rewards: {
      experience: expBase,
      gold: goldBase,
      items: [],
      worldChange: rng() > 0.7 ? `The ${req.biome} area shifts after this quest's completion.` : undefined,
    },
    status: 'available',
  };
}

// ─── NPC Templates ────────────────────────────────────────────

const FIRST_NAMES_MALE = ['Aldric', 'Bram', 'Caius', 'Dorn', 'Edric', 'Faolan', 'Gareth', 'Hadwin', 'Ivan', 'Jovan'];
const FIRST_NAMES_FEMALE = ['Aelith', 'Brinne', 'Caia', 'Darya', 'Elara', 'Fyra', 'Galla', 'Hedra', 'Iona', 'Jessa'];
const LAST_NAMES = ['Ashwood', 'Blackthorn', 'Coldwater', 'Dawnfire', 'Emberglow', 'Frostwhisper', 'Grimstone', 'Hollowbrook'];

const NPC_GREETINGS: Record<string, string[]> = {
  merchant: [
    'Ah, a customer! Come, come — finest wares this side of the mountain.',
    'Business is slow today. Perhaps you\'ll change that?',
    'I\'ve got exactly what you need, friend. Trust me.',
  ],
  quest_giver: [
    'Thank the stars you\'re here. I\'ve been waiting for someone capable.',
    'I have a problem. You look like someone who solves problems.',
    'Listen carefully — I\'ll only say this once.',
  ],
  innkeeper: [
    'Warm fire and cold ale — what more could a traveler want?',
    'Rooms are cheap. Stories are free. Both are worth having.',
    'You look like you\'ve walked far. Rest your boots.',
  ],
  guard: [
    'Keep moving, traveler. Nothing to see here.',
    'State your business.',
    'The road is dangerous past the east gate. You\'ve been warned.',
  ],
  villager: [
    'Lovely day, isn\'t it? If you ignore the distant screaming.',
    'Don\'t stay out after dark. The old ones weren\'t kidding.',
    'My grandmother used to say this village was cursed. She was right.',
  ],
};

export function generateNPC(req: NPCGenerationRequest, callId: string): Partial<NPC> {
  const seed = `${req.role}-${req.biome}-${callId}`;
  const rng = seededRandom(seed);

  const isFemale = rng() > 0.5;
  const firstName = pick(isFemale ? FIRST_NAMES_FEMALE : FIRST_NAMES_MALE, rng);
  const lastName = pick(LAST_NAMES, rng);
  const name = `${firstName} ${lastName}`;

  const personalities: NPCPersonality[] = ['friendly', 'grumpy', 'mysterious', 'cheerful', 'cowardly', 'brave', 'greedy', 'wise'];
  const personality = pick(personalities, rng);

  const greetingPool = NPC_GREETINGS[req.role] ?? NPC_GREETINGS.villager;
  const greeting = pick(greetingPool, rng);

  return {
    name,
    role: req.role as NPC['role'],
    personality,
    biome: req.biome as NPC['biome'],
    mood: Math.floor(rng() * 80 + 10), // 10–90 (not extreme on first meeting)
    memory: [],
    dialogueKeys: [greeting],
    questIds: [],
  };
}

// ─── World Event Templates ────────────────────────────────────

const EVENT_TEMPLATES: Array<{ type: WorldEventType; title: string; description: string; duration: number }> = [
  {
    type: 'meteor_strike',
    title: 'Fire from the Sky',
    description: 'A blazing meteor streaks across the heavens and crashes into the eastern plains. A crater smokes where it fell — and something moves within.',
    duration: 600,
  },
  {
    type: 'dragon_attack',
    title: 'The Dragon Wakes',
    description: 'An ancient dragon, disturbed from centuries of slumber, takes to the skies in fury. Villages in the valley are at risk.',
    duration: 900,
  },
  {
    type: 'lost_civilization',
    title: 'Ruins Resurface',
    description: 'An earthquake splits the earth, revealing cyclopean ruins untouched for a thousand years. Scholars scramble to study them before looters arrive.',
    duration: 1800,
  },
  {
    type: 'portal_opens',
    title: 'The Rift Tears Open',
    description: 'A shimmering portal of unknown origin appears at the crossroads. Strange creatures and stranger opportunities pour through.',
    duration: 1200,
  },
  {
    type: 'black_market',
    title: 'The Night Bazaar',
    description: 'Hooded merchants set up camp under cover of darkness, selling items of dubious origin at suspiciously low prices.',
    duration: 300,
  },
  {
    type: 'treasure_convoy',
    title: 'The Royal Escort',
    description: 'A heavily guarded treasure convoy passes through the region. Bandits are planning an ambush — will you protect it, or join the thieves?',
    duration: 450,
  },
  {
    type: 'festival',
    title: 'The Harvest Celebration',
    description: 'The villages erupt in celebration! Music, food, and games fill the streets. Merchants offer special goods and NPCs are in high spirits.',
    duration: 3600,
  },
  {
    type: 'time_anomaly',
    title: 'Temporal Storm',
    description: 'Clocks run backward. Ghosts of past battles re-enact themselves. The very fabric of time frays at the edges of reality.',
    duration: 600,
  },
];

export function generateEvent(req: EventGenerationRequest, callId: string): Partial<WorldEvent> {
  const seed = `${req.worldSeed}-${req.season}-${callId}`;
  const rng = seededRandom(seed);

  const template = pick(EVENT_TEMPLATES, rng);

  return {
    ...template,
    active: true,
    participants: [],
    startsAt: Date.now(),
    endsAt: Date.now() + template.duration * 1000,
  };
}

export function generateItem(req: any, callId: string): any {
  const seed = `${req.prompt}-${callId}`;
  const rng = seededRandom(seed);

  const cleanPrompt = req.prompt.trim();
  const words = cleanPrompt.split(/\s+/);
  const name = words.slice(0, 3).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  const type = pick(['weapon', 'armor', 'helmet', 'accessory'] as string[], rng);
  const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
  const rarity = pick([...rarities] as string[], rng);

  const icons: Record<string, string> = {
    weapon: '🗡️',
    armor: '👕',
    helmet: '🪖',
    accessory: '📿',
  };

  const baseValues: Record<string, number> = {
    common: 10,
    uncommon: 30,
    rare: 80,
    epic: 200,
    legendary: 600,
  };

  const statMultipliers: Record<string, number> = {
    common: 1,
    uncommon: 1.5,
    rare: 2.2,
    epic: 3.5,
    legendary: 6,
  };

  const finalValue = Math.round((baseValues as Record<string, number>)[rarity] * (1 + rng() * 0.3));
  const mult = (statMultipliers as Record<string, number>)[rarity];

  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: name || 'Mysterious Artifact',
    description: `A custom item created from: "${cleanPrompt}".`,
    type,
    rarity,
    icon: icons[type] ?? '❓',
    value: finalValue,
    stats: {
      attack: type === 'weapon' ? Math.round(10 * mult) : 0,
      defense: (type === 'armor' || type === 'helmet') ? Math.round(5 * mult) : 0,
      hp: type === 'accessory' ? Math.round(30 * mult) : 0,
    },
  };
}

// ─── Dialogue Generation ────────────────────────────────────────

export async function generateDialogue(req: DialogueGenerationRequest, callId: string): Promise<string> {
  const responses = [
    `I hear what you're saying, traveler. Let me think on that.`,
    `Fascinating! I've never considered it quite like that before.`,
    `Hmm, "${req.playerMessage}"? You are full of surprises.`,
    `Indeed. But have you checked the local leyline nodes recently?`,
    `I see... Well, if you say so. Is there anything else you need?`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}
