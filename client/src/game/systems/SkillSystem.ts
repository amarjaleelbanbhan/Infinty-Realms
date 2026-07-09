import { create } from 'zustand';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';

export interface Skill {
  id: string;
  name: string;
  icon: string;
  description: string;
  manaCost: number;
  cooldown: number; // seconds
  lastCastAt?: number;
  type: 'damage' | 'heal' | 'shield' | 'utility';
  value: number;
}

export const KNOWN_SKILLS: Skill[] = [
  {
    id: 'fireball',
    name: 'Fireball',
    icon: '🔥',
    description: 'Launches a flaming sphere dealing heavy area damage.',
    manaCost: 15,
    cooldown: 3,
    type: 'damage',
    value: 35,
  },
  {
    id: 'frost_nova',
    name: 'Frost Nova',
    icon: '❄️',
    description: 'Freezes surrounding enemies and deals frost damage.',
    manaCost: 20,
    cooldown: 6,
    type: 'damage',
    value: 25,
  },
  {
    id: 'arcane_heal',
    name: 'Arcane Heal',
    icon: '💖',
    description: 'Restores a portion of your max health instantly.',
    manaCost: 25,
    cooldown: 8,
    type: 'heal',
    value: 40,
  },
  {
    id: 'lightning_dash',
    name: 'Lightning Dash',
    icon: '⚡',
    description: 'Teleports forward and increases movement speed briefly.',
    manaCost: 10,
    cooldown: 4,
    type: 'utility',
    value: 50,
  },
];

interface SkillStore {
  equippedSkills: Skill[];
  cooldowns: Record<string, number>;
  castSkill: (skillId: string) => boolean;
}

export const useSkillStore = create<SkillStore>((set, get) => ({
  equippedSkills: KNOWN_SKILLS.slice(0, 3),
  cooldowns: {},

  castSkill: (skillId: string) => {
    const skill = KNOWN_SKILLS.find((s) => s.id === skillId);
    if (!skill) return false;

    const gameStore = useGameStore.getState();
    const uiStore = useUIStore.getState();
    const stats = gameStore.player?.stats;

    if (!stats) return false;

    // Check mana
    if (stats.mana < skill.manaCost) {
      uiStore.addToast('Not enough mana!', 'error');
      return false;
    }

    // Check cooldown
    const now = Date.now();
    const lastCast = get().cooldowns[skillId] ?? 0;
    if (now - lastCast < skill.cooldown * 1000) {
      uiStore.addToast('Skill on cooldown!', 'error');
      return false;
    }

    // Consume mana
    gameStore.updatePlayerStats({ mana: stats.mana - skill.manaCost });

    // Apply effect
    if (skill.type === 'heal') {
      const newHp = Math.min(stats.maxHp, stats.hp + skill.value);
      gameStore.updatePlayerStats({ hp: newHp });
      uiStore.addToast(`+${skill.value} HP Healed!`, 'success');
    } else {
      let finalDamage = skill.value;
      const weather = gameStore.currentWeather;
      let weatherMsg = '';

      if (skill.id === 'fireball' && weather === 'rain') {
        finalDamage *= 0.8;
        weatherMsg = ' (Dampened by rain)';
      } else if (skill.id === 'frost_nova' && (weather === 'snow' || weather === 'blizzard')) {
        finalDamage *= 1.3;
        weatherMsg = ' (Empowered by cold)';
      }

      finalDamage = Math.round(finalDamage);
      uiStore.addToast(`Cast ${skill.name}! Deals ${finalDamage} dmg${weatherMsg}`, 'info');
      // In a real flow, this would dispatch an event to WorldScene to spawn a projectile
    }

    // Set cooldown
    set((state) => ({
      cooldowns: { ...state.cooldowns, [skillId]: now },
    }));

    return true;
  },
}));
