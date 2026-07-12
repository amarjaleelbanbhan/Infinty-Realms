
## 17. Milestone 6: Launch Readiness - Task 2: Visual Feedback (Particles & FX)

**Mechanics:**
- Enhanced combat feel using Phaser 3 Particle Emitters.
- **Hit FX:** Small burst of particles (red for flesh, white for generic) when taking damage.
- **Death FX:** Larger explosion of particles when an enemy is defeated.

**Implementation:**
- Extend `CombatSystem.ts` with `showHitEffect(x, y, color)` and `showDeathEffect(x, y)`.
- Use `this.scene.add.particles` to generate the effects.
- Integrate into `EnemySprite.ts` damage and death hooks.
