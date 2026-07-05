import type { LeylineNode, LeylineNodeType, BiomeType } from '@shared/types';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';

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
    for (const node of this.nodes) {
      const elapsedMins = (now - node.lastHarvestAt) / 60_000;
      node.accumulatedEssence = Math.floor(elapsedMins * node.ratePerMin);
    }
  }

  placeNode(x: number, y: number, type: LeylineNodeType, biome: BiomeType): LeylineNode | null {
    const player = useGameStore.getState().player;
    if (!player) return null;

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
    };

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
      useGameStore.getState().addGold(harvested * 2);
      useUIStore.getState().addToast(`Harvested ${harvested} Leyline Essence (+${harvested * 2} Gold)`, 'gold');
    }

    return harvested;
  }

  getNodes(): LeylineNode[] {
    return this.nodes;
  }
}

export const leylineSystem = new LeylineSystem();
