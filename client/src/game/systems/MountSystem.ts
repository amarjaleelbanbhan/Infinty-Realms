import type { MountType } from '@shared/types';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';

export class MountSystem {
  
  public static getMountSpeedMultiplier(mount?: MountType): number {
    switch (mount) {
      case 'Horse': return 1.5;
      case 'Wolf': return 1.6;
      case 'Drake': return 1.8;
      case 'VoidBeast': return 2.0;
      default: return 1.0;
    }
  }

  public static toggleMount() {
    const store = useGameStore.getState();
    if (!store.player?.mount) {
      useUIStore.getState().addToast("You don't own a mount.", 'error');
      return;
    }
    
    const isMounted = !store.player.isMounted;
    store.setPlayer({ ...store.player, isMounted });
    
    if (isMounted) {
      useUIStore.getState().addToast(`Summoned ${store.player.mount}!`, 'info');
      // Trigger event for WorldScene to update visuals
      window.dispatchEvent(new CustomEvent('ir:mount_summoned'));
    } else {
      window.dispatchEvent(new CustomEvent('ir:mount_dismissed'));
    }
  }
}
