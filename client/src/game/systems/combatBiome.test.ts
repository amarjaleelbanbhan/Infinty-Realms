import { describe, it, expect } from 'vitest';

interface TestEnemyData {
  id: string;
  hp: number;
  maxHp: number;
  speed: number;
  state: string;
  stunTimer?: number;
  slowTimer?: number;
  burnTimer?: number;
  poisonTimer?: number;
  dotTickTimer?: number;
  burnDamage?: number;
  poisonDamage?: number;
}

// Emulate the updateEnemies loop status-effects logic for unit tests
function processEnemyEffects(ed: TestEnemyData, dt: number): { dead: boolean; moved: boolean; speed: number; damageDealt: number } {
  let damageDealt = 0;
  let dead = false;
  let moved = true;

  // Update status effect timers
  if (ed.stunTimer && ed.stunTimer > 0) ed.stunTimer = Math.max(0, ed.stunTimer - dt);
  if (ed.slowTimer && ed.slowTimer > 0) ed.slowTimer = Math.max(0, ed.slowTimer - dt);
  if (ed.burnTimer && ed.burnTimer > 0) ed.burnTimer = Math.max(0, ed.burnTimer - dt);
  if (ed.poisonTimer && ed.poisonTimer > 0) ed.poisonTimer = Math.max(0, ed.poisonTimer - dt);

  // Handle Damage-Over-Time (DOT) ticks
  if ((ed.burnTimer && ed.burnTimer > 0) || (ed.poisonTimer && ed.poisonTimer > 0)) {
    if (ed.dotTickTimer === undefined) ed.dotTickTimer = 0;
    ed.dotTickTimer += dt;
    if (ed.dotTickTimer >= 1.0) {
      ed.dotTickTimer -= 1.0;
      let tickDamage = 0;
      if (ed.burnTimer && ed.burnTimer > 0 && ed.burnDamage) {
        tickDamage += ed.burnDamage;
      }
      if (ed.poisonTimer && ed.poisonTimer > 0 && ed.poisonDamage) {
        tickDamage += ed.poisonDamage;
      }
      if (tickDamage > 0) {
        ed.hp = Math.max(0, ed.hp - tickDamage);
        damageDealt = tickDamage;
        if (ed.hp <= 0) {
          dead = true;
          return { dead, moved: false, speed: 0, damageDealt };
        }
      }
    }
  }

  if (ed.stunTimer && ed.stunTimer > 0) {
    moved = false;
    return { dead, moved, speed: 0, damageDealt };
  }

  let speedMult = 1.0;
  if (ed.slowTimer && ed.slowTimer > 0) {
    speedMult = 0.5; // 50% slow
  }

  return { dead, moved, speed: ed.speed * speedMult, damageDealt };
}

describe('Biome-Reactive Spell Effects', () => {
  it('correctly reduces speed on slow effect', () => {
    const enemy: TestEnemyData = {
      id: 'e1',
      hp: 100,
      maxHp: 100,
      speed: 100,
      state: 'chase',
      slowTimer: 3.0,
    };

    const res = processEnemyEffects(enemy, 0.5);
    expect(res.speed).toBe(50); // 50% slow applied
    expect(enemy.slowTimer).toBe(2.5); // reduced by dt
  });

  it('bypasses movement completely on stun effect', () => {
    const enemy: TestEnemyData = {
      id: 'e2',
      hp: 100,
      maxHp: 100,
      speed: 100,
      state: 'chase',
      stunTimer: 2.0,
    };

    const res = processEnemyEffects(enemy, 0.5);
    expect(res.moved).toBe(false);
    expect(res.speed).toBe(0);
    expect(enemy.stunTimer).toBe(1.5);
  });

  it('ticks damage over time for burn effect every second', () => {
    const enemy: TestEnemyData = {
      id: 'e3',
      hp: 100,
      maxHp: 100,
      speed: 100,
      state: 'chase',
      burnTimer: 4.0,
      burnDamage: 10,
    };

    // First 0.5s: no tick
    let res = processEnemyEffects(enemy, 0.5);
    expect(res.damageDealt).toBe(0);
    expect(enemy.hp).toBe(100);

    // Another 0.5s: total 1s, ticks damage
    res = processEnemyEffects(enemy, 0.5);
    expect(res.damageDealt).toBe(10);
    expect(enemy.hp).toBe(90);
    expect(enemy.burnTimer).toBe(3.0);
  });

  it('handles enemy death from DOT tick', () => {
    const enemy: TestEnemyData = {
      id: 'e4',
      hp: 8,
      maxHp: 100,
      speed: 100,
      state: 'chase',
      poisonTimer: 5.0,
      poisonDamage: 15,
    };

    const res = processEnemyEffects(enemy, 1.0);
    expect(res.damageDealt).toBe(15);
    expect(enemy.hp).toBe(0);
    expect(res.dead).toBe(true);
  });
});
