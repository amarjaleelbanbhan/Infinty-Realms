import { create } from 'zustand';

export type FarmPlotState = 'empty' | 'seed' | 'growing' | 'mature';

export interface FarmPlot {
  id: string;
  x: number; // Grid X
  y: number; // Grid Y
  seedItemId: string | null;
  plantedAt: number | null; // Timestamp
  state: FarmPlotState;
}

export interface FarmStoreState {
  plots: FarmPlot[];
  initializePlots: (plots: FarmPlot[]) => void;
  plantSeed: (plotId: string, seedItemId: string) => void;
  updatePlotState: (plotId: string, newState: FarmPlotState) => void;
  harvestPlot: (plotId: string) => void;
}

export const useFarmStore = create<FarmStoreState>((set) => ({
  plots: [],

  initializePlots: (plots) => set({ plots }),

  plantSeed: (plotId, seedItemId) => set((state) => ({
    plots: state.plots.map(p => 
      p.id === plotId 
        ? { ...p, state: 'seed', seedItemId, plantedAt: Date.now() } 
        : p
    )
  })),

  updatePlotState: (plotId, newState) => set((state) => ({
    plots: state.plots.map(p => 
      p.id === plotId 
        ? { ...p, state: newState } 
        : p
    )
  })),

  harvestPlot: (plotId) => set((state) => ({
    plots: state.plots.map(p => 
      p.id === plotId 
        ? { ...p, state: 'empty', seedItemId: null, plantedAt: null } 
        : p
    )
  }))
}));
