import { describe, it, expect } from 'vitest';

interface TestPlayerState {
  x: number;
  y: number;
  speed: number;
  isMounted: boolean;
  isDead: boolean;
}

class TestDodgeRollStateMachine {
  public isDashing = false;
  public isPlayerInvulnerable = false;
  public dashTimeRemaining = 0;
  public dashCooldownRemaining = 0;
  public dashVelocity = { x: 0, y: 0 };
  public playerDirection: 'up' | 'down' | 'left' | 'right' = 'down';

  public triggerDodgeRoll(player: TestPlayerState, movementInput: { dx: number; dy: number }) {
    if (this.isDashing || this.dashCooldownRemaining > 0) {
      return false; // Ignored / blocked
    }

    if (player.isDead) return false;

    // Dismount if mounted
    if (player.isMounted) {
      player.isMounted = false;
    }

    // Determine direction
    let dx = movementInput.dx;
    let dy = movementInput.dy;

    if (dx === 0 && dy === 0) {
      switch (this.playerDirection) {
        case 'up':    dy = -1; break;
        case 'down':  dy = 1; break;
        case 'left':  dx = -1; break;
        case 'right': dx = 1; break;
      }
    }

    // Normalize
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
    }

    this.isDashing = true;
    this.isPlayerInvulnerable = true;
    this.dashTimeRemaining = 250;
    this.dashCooldownRemaining = 1200;

    const dashSpeed = player.speed * 2.5;
    this.dashVelocity = { x: dx * dashSpeed, y: dy * dashSpeed };

    return true; // Successfully triggered
  }

  public update(player: TestPlayerState, deltaMs: number) {
    const dt = deltaMs / 1000;

    if (this.isDashing) {
      this.dashTimeRemaining -= deltaMs;
      if (this.dashTimeRemaining <= 0) {
        this.isDashing = false;
        this.isPlayerInvulnerable = false;
        this.dashVelocity = { x: 0, y: 0 };
      } else {
        // Move player
        player.x += this.dashVelocity.x * dt;
        player.y += this.dashVelocity.y * dt;
      }
    }

    if (this.dashCooldownRemaining > 0) {
      this.dashCooldownRemaining = Math.max(0, this.dashCooldownRemaining - deltaMs);
    }
  }
}

// Emulate CombatSystem.damagePlayer
function calculatePlayerDamage(damage: number, isInvulnerable: boolean): number {
  if (isInvulnerable) {
    return 0; // Immune to damage!
  }
  return damage;
}

describe('Dodge Roll State Machine', () => {
  it('correctly enters dashing and invulnerability state on trigger', () => {
    const player: TestPlayerState = { x: 100, y: 100, speed: 150, isMounted: false, isDead: false };
    const sm = new TestDodgeRollStateMachine();

    const success = sm.triggerDodgeRoll(player, { dx: 1, dy: 0 }); // Move right

    expect(success).toBe(true);
    expect(sm.isDashing).toBe(true);
    expect(sm.isPlayerInvulnerable).toBe(true);
    expect(sm.dashTimeRemaining).toBe(250);
    expect(sm.dashCooldownRemaining).toBe(1200);
    expect(sm.dashVelocity.x).toBe(150 * 2.5); // 375 px/s
    expect(sm.dashVelocity.y).toBe(0);
  });

  it('dismounts player automatically when dodge rolling', () => {
    const player: TestPlayerState = { x: 100, y: 100, speed: 150, isMounted: true, isDead: false };
    const sm = new TestDodgeRollStateMachine();

    const success = sm.triggerDodgeRoll(player, { dx: 0, dy: 1 }); // Move down

    expect(success).toBe(true);
    expect(player.isMounted).toBe(false); // Dismounted!
  });

  it('uses facing direction when stationary', () => {
    const player: TestPlayerState = { x: 100, y: 100, speed: 150, isMounted: false, isDead: false };
    const sm = new TestDodgeRollStateMachine();
    sm.playerDirection = 'up';

    const success = sm.triggerDodgeRoll(player, { dx: 0, dy: 0 }); // Stationary

    expect(success).toBe(true);
    expect(sm.dashVelocity.y).toBe(-150 * 2.5); // Moving up
  });

  it('ticks down duration and exits dash/invulnerability state', () => {
    const player: TestPlayerState = { x: 100, y: 100, speed: 150, isMounted: false, isDead: false };
    const sm = new TestDodgeRollStateMachine();
    sm.triggerDodgeRoll(player, { dx: 1, dy: 0 });

    // Tick 100ms
    sm.update(player, 100);
    expect(sm.isDashing).toBe(true);
    expect(sm.isPlayerInvulnerable).toBe(true);
    expect(player.x).toBeCloseTo(100 + (150 * 2.5) * 0.1);

    // Tick another 150ms (total 250ms)
    sm.update(player, 150);
    expect(sm.isDashing).toBe(false);
    expect(sm.isPlayerInvulnerable).toBe(false);
  });

  it('enforces cooldown limit', () => {
    const player: TestPlayerState = { x: 100, y: 100, speed: 150, isMounted: false, isDead: false };
    const sm = new TestDodgeRollStateMachine();

    // Trigger first roll
    let success = sm.triggerDodgeRoll(player, { dx: 1, dy: 0 });
    expect(success).toBe(true);

    // Finish roll (tick 250ms)
    sm.update(player, 250);
    expect(sm.isDashing).toBe(false);
    expect(sm.dashCooldownRemaining).toBe(950); // 1200 - 250

    // Try triggering again while on cooldown
    success = sm.triggerDodgeRoll(player, { dx: 1, dy: 0 });
    expect(success).toBe(false); // Blocked!

    // Tick down remaining 950ms cooldown
    sm.update(player, 950);
    expect(sm.dashCooldownRemaining).toBe(0);

    // Try triggering again - should succeed
    success = sm.triggerDodgeRoll(player, { dx: 1, dy: 0 });
    expect(success).toBe(true);
  });

  it('correctly ignores damage when invulnerable', () => {
    expect(calculatePlayerDamage(10, false)).toBe(10);
    expect(calculatePlayerDamage(10, true)).toBe(0); // Immune!
  });
});
