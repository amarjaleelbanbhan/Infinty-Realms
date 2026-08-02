import { useGameStore } from '@stores/useGameStore';
import { useRelicStore } from '@stores/useRelicStore';
import type { PlayerStats } from '@shared/types';

export function getEffectiveStats(): PlayerStats {
  const player = useGameStore.getState().player;
  if (!player?.stats) {
    return { hp: 100, maxHp: 100, mana: 50, maxMana: 50, attack: 10, defense: 5, speed: 150, luck: 5 };
  }

  const base: PlayerStats = { ...player.stats };
  const equip = player.equipment;

  if (equip) {
    for (const item of Object.values(equip)) {
      if (item?.stats) {
        for (const [key, val] of Object.entries(item.stats)) {
          if (key in base && typeof val === 'number') {
            (base as any)[key] += val;
          }
        }
      }
    }
  }

  // Socketed Relic Stat Bonuses
  const { relics, activeSocketId } = useRelicStore.getState();
  const activeRelic = relics.find((r) => r.id === activeSocketId);
  if (activeRelic?.statBonus) {
    if (activeRelic.statBonus.attack) base.attack += activeRelic.statBonus.attack;
    if (activeRelic.statBonus.defense) base.defense += activeRelic.statBonus.defense;
    if (activeRelic.statBonus.luck) base.luck += activeRelic.statBonus.luck;
  }

  return base;
}
