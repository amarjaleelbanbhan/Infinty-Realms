import type { FarmPlot, BiomeType, Item } from '@shared/types';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';

export const SEED_ITEM: Item = {
  id: 'magic-seed',
  name: 'Leyline Seed',
  description: 'A magical seed that mutates when planted near a Leyline Node.',
  type: 'seed',
  rarity: 'uncommon',
  icon: '🌱',
  value: 5,
};

export const CROP_ITEMS: Record<string, Item> = {
  plains: { id: 'crop-plains', name: 'Sunwheat', description: 'Golden wheat infused with plains energy.', type: 'crop', rarity: 'common', icon: '🌾', value: 8, cropBiome: 'plains' },
  forest: { id: 'crop-forest', name: 'Lifebloom', description: 'A glowing flower from the deep forest.', type: 'crop', rarity: 'uncommon', icon: '🌸', value: 12, cropBiome: 'forest' },
  desert: { id: 'crop-desert', name: 'Cactus Fruit', description: 'A juicy fruit bursting with water magic.', type: 'crop', rarity: 'common', icon: '🌵', value: 10, cropBiome: 'desert' },
  snow: { id: 'crop-snow', name: 'Frostberry', description: 'An icy berry that chills the touch.', type: 'crop', rarity: 'uncommon', icon: '🫐', value: 15, cropBiome: 'snow' },
  volcano: { id: 'crop-volcano', name: 'Emberbloom', description: 'A fiery flower that is warm to the touch.', type: 'crop', rarity: 'rare', icon: '🌺', value: 25, cropBiome: 'volcano' },
  swamp: { id: 'crop-swamp', name: 'Poisoncap', description: 'A toxic mushroom infused with decay.', type: 'crop', rarity: 'common', icon: '🍄', value: 8, cropBiome: 'swamp' },
};

export class FarmingSystem {
  private plots: FarmPlot[] = [];
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  public onPlotReady?: (plot: FarmPlot) => void;

  constructor() {
    this.tickInterval = setInterval(() => {
      this.tick();
    }, 5_000); // Check every 5 seconds
  }

  stop() {
    if (this.tickInterval) clearInterval(this.tickInterval);
  }

  private tick() {
    const now = Date.now();
    for (const plot of this.plots) {
      if (!plot.ready && now - plot.plantedAt > 30_000) { // 30 seconds to grow
        plot.ready = true;
        if (this.onPlotReady) this.onPlotReady(plot);
      }
    }
  }

  getPlots(): FarmPlot[] {
    return this.plots;
  }

  loadPlots(plots: FarmPlot[]) {
    this.plots = plots;
  }

  plantSeed(x: number, y: number, biome: BiomeType): FarmPlot | null {
    const store = useGameStore.getState();
    const ui = useUIStore.getState();
    
    // Check if player has seed
    const hasSeed = store.player?.inventory?.some(s => s.item.id === SEED_ITEM.id && s.quantity > 0);
    if (!hasSeed) {
      ui.addToast("You need a Leyline Seed to plant here.", 'error');
      return null;
    }

    // Determine crop type
    const crop = CROP_ITEMS[biome] ?? CROP_ITEMS.plains;

    // Consume seed
    store.removeFromInventory(SEED_ITEM.id, 1);

    const plot: FarmPlot = {
      id: `plot-${Date.now()}`,
      x,
      y,
      plantedAt: Date.now(),
      biome,
      cropType: crop.id,
      ready: false,
    };

    this.plots.push(plot);
    ui.addToast("Planted a seed!", 'success');
    return plot;
  }

  harvestPlot(id: string): boolean {
    const idx = this.plots.findIndex(p => p.id === id);
    if (idx === -1) return false;
    
    const plot = this.plots[idx];
    if (!plot.ready) {
      useUIStore.getState().addToast("This crop is not ready yet.", 'info');
      return false;
    }

    // Give item
    const cropItem = Object.values(CROP_ITEMS).find(c => c.id === plot.cropType) ?? CROP_ITEMS.plains;
    useGameStore.getState().addToInventory(cropItem, 1);
    useUIStore.getState().addToast(`Harvested 1x ${cropItem.name}`, 'success');

    // Remove plot
    this.plots.splice(idx, 1);
    return true;
  }
}

export const farmingSystem = new FarmingSystem();
