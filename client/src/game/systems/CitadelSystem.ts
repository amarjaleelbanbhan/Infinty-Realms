import type { CitadelBuilding, CitadelStructureType } from '@shared/types';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';

export class CitadelSystem {
  private buildings: CitadelBuilding[] = [];

  getBuildings(): CitadelBuilding[] {
    return this.buildings;
  }

  placeBuilding(x: number, y: number, type: CitadelStructureType, guildId: string): CitadelBuilding | null {
    // Snap to grid
    const TILE_SIZE = 32;
    const snapX = Math.floor(x / TILE_SIZE) * TILE_SIZE;
    const snapY = Math.floor(y / TILE_SIZE) * TILE_SIZE;

    // Prevent overlap
    if (this.buildings.some(b => Math.abs(b.x - snapX) < TILE_SIZE && Math.abs(b.y - snapY) < TILE_SIZE)) {
      useUIStore.getState().addToast("Cannot build here. Space is occupied.", 'error');
      return null;
    }

    let hp = 100;
    if (type === 'wall') hp = 500;
    if (type === 'gate') hp = 400;
    if (type === 'turret') hp = 200;

    const building: CitadelBuilding = {
      id: `citadel-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      guildId,
      type,
      x: snapX,
      y: snapY,
      hp,
      maxHp: hp,
      powered: false, // will be powered if near an energy_hub or leyline
    };

    this.buildings.push(building);
    useUIStore.getState().addToast(`${type.toUpperCase()} placed successfully!`, 'success');
    return building;
  }

  damageBuilding(id: string, amount: number) {
    const b = this.buildings.find(x => x.id === id);
    if (!b) return;

    // Shields take less damage if powered
    const actualDamage = (b.type === 'shield' && b.powered) ? amount * 0.2 : amount;
    b.hp -= actualDamage;

    if (b.hp <= 0) {
      this.buildings = this.buildings.filter(x => x.id !== id);
      useUIStore.getState().addToast(`${b.type.toUpperCase()} was destroyed!`, 'error');
    }
  }

  updatePower(leylineNodes: {x: number, y: number}[]) {
    // Basic power radius logic
    const POWER_RADIUS = 300;
    for (const b of this.buildings) {
      if (b.type === 'shield' || b.type === 'turret') {
        const nearPower = leylineNodes.some(n => Math.sqrt((n.x - b.x)**2 + (n.y - b.y)**2) < POWER_RADIUS);
        b.powered = nearPower;
      }
    }
  }

  triggerSiege() {
    if (this.buildings.length === 0) {
      useUIStore.getState().addToast("No Citadel to siege!", "info");
      return;
    }
    
    // Find roughly the center of the citadel
    const avgX = this.buildings.reduce((sum, b) => sum + b.x, 0) / this.buildings.length;
    const avgY = this.buildings.reduce((sum, b) => sum + b.y, 0) / this.buildings.length;

    useUIStore.getState().addToast("⚠️ SIEGE INVASION ALERT! Defend your Citadel!", "error");
    window.dispatchEvent(new CustomEvent('ir:siege_invasion', { detail: { x: avgX, y: avgY } }));
  }
}

export const citadelSystem = new CitadelSystem();
