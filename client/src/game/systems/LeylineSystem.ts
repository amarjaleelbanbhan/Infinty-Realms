import type { LeylineNode, LeylineNodeType, BiomeType, Item } from '@shared/types';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';

export const LEYLINE_ESSENCE_ITEM: Item = {
  id: 'leyline-essence',
  name: 'Leyline Essence',
  description: 'Raw magical energy harvested from active world leylines.',
  type: 'material',
  rarity: 'rare',
  icon: '⚡',
  value: 10,
};

export class LeylineSystem {
  private nodes: LeylineNode[] = [];
  private tickInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startPassiveGeneration();
  }

  startPassiveGeneration() {
    this.tickInterval = setInterval(() => {
      this.tick();
    }, 10_000); // Check every 10 seconds
  }

  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
    }
  }

  private tick() {
    const now = Date.now();
    let totalEssence = 0;
    
    for (const node of this.nodes) {
      const elapsedMins = (now - node.lastHarvestAt) / 60_000;
      node.accumulatedEssence = Math.floor(elapsedMins * node.ratePerMin);
      totalEssence += node.accumulatedEssence;
    }

    // Trigger overload if total unharvested essence in the network exceeds 100
    if (totalEssence > 100 && this.onOverload) {
      this.onOverload();
    }
  }

  public onOverload: (() => void) | null = null;

  placeNode(x: number, y: number, type: LeylineNodeType, biome: BiomeType): LeylineNode | null {
    const player = useGameStore.getState().player;
    if (!player || !player.id) return null;

    const baseRate: Record<LeylineNodeType, number> = {
      essence_collector: 5,
      mana_relay: 10,
      elemental_forge: 20,
    };

    const node: LeylineNode = {
      id: `leyline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ownerPlayerId: player.id,
      x,
      y,
      type,
      biome,
      ratePerMin: baseRate[type],
      accumulatedEssence: 0,
      lastHarvestAt: Date.now(),
      connectedNodeIds: [],
    };

    // Auto-link with nodes within 300px
    for (const existing of this.nodes) {
      const dx = existing.x - x;
      const dy = existing.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 300) {
        existing.connectedNodeIds = existing.connectedNodeIds ?? [];
        existing.connectedNodeIds.push(node.id);
        node.connectedNodeIds?.push(existing.id);
      }
    }

    this.nodes.push(node);
    useUIStore.getState().addToast(`Leyline ${type.replace('_', ' ')} placed!`, 'success');
    return node;
  }

  harvestNode(nodeId: string): number {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node) return 0;

    const harvested = node.accumulatedEssence;
    node.accumulatedEssence = 0;
    node.lastHarvestAt = Date.now();

    if (harvested > 0) {
      useGameStore.getState().addToInventory(LEYLINE_ESSENCE_ITEM, harvested);
      useUIStore.getState().addToast(`Harvested ${harvested} Leyline Essence into inventory!`, 'success');
    }

    return harvested;
  }

  refineEquipment(type: 'weapon' | 'armor', essenceCost = 5): boolean {
    const gameStore = useGameStore.getState();
    const player = gameStore.player;
    if (!player || !player.inventory) return false;

    // Find essence slot
    const essenceSlot = player.inventory.find((slot) => slot.item.id === 'leyline-essence');
    if (!essenceSlot || essenceSlot.quantity < essenceCost) {
      useUIStore.getState().addToast(`Requires ${essenceCost} Leyline Essence!`, 'error');
      return false;
    }

    // Deduct essence
    gameStore.removeFromInventory('leyline-essence', essenceCost);

    // Refine stats
    if (type === 'weapon') {
      const currentAttack = player.stats?.attack ?? 10;
      gameStore.updatePlayerStats({ attack: Math.round(currentAttack * 1.1) });
      useUIStore.getState().addToast('Weapon refined! Attack increased by +10%!', 'success');
    } else {
      const currentDefense = player.stats?.defense ?? 5;
      gameStore.updatePlayerStats({ defense: Math.round(currentDefense * 1.1) });
      useUIStore.getState().addToast('Armor refined! Defense increased by +10%!', 'success');
    }

    return true;
  }

  getNodes(): LeylineNode[] {
    return this.nodes;
  }

  loadNodes(nodes: LeylineNode[]) {
    this.nodes = nodes;
  }
}

export const leylineSystem = new LeylineSystem();
