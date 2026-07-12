import { useUIStore } from '@stores/useUIStore';

export class AntiCheatSystem {
  private lastX: number = 0;
  private lastY: number = 0;
  private lastTime: number = 0;
  private violations: number = 0;

  public validateMovement(x: number, y: number, time: number, maxAllowedSpeed: number) {
    if (this.lastTime === 0) {
      this.lastX = x;
      this.lastY = y;
      this.lastTime = time;
      return true;
    }

    const dt = (time - this.lastTime) / 1000; // seconds
    if (dt <= 0) return true;

    const dx = x - this.lastX;
    const dy = y - this.lastY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = distance / dt;

    // Allow 50% leniency for physics impulses/dashes
    const speedLimit = maxAllowedSpeed * 1.5;

    if (speed > speedLimit) {
      this.violations++;
      console.warn(`[Anti-Cheat] Speedhack detected! Speed: ${speed.toFixed(2)} (Limit: ${speedLimit.toFixed(2)})`);
      
      if (this.violations > 3) {
        useUIStore.getState().addToast('Anti-Cheat Violation Detected!', 'error');
        // Reset violations to avoid spamming
        this.violations = 0;
        return false;
      }
    } else {
      // Decay violations slowly if playing fair
      this.violations = Math.max(0, this.violations - 0.05);
    }

    this.lastX = x;
    this.lastY = y;
    this.lastTime = time;
    return true;
  }
}

export const antiCheatSystem = new AntiCheatSystem();
