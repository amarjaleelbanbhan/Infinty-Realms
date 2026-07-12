
## 16. Milestone 6: Launch Readiness - Task 1: Settings UI & Polish

**Mechanics:**
- A Settings menu accessible via the 'Esc' key or a 'Gear' icon on the HUD.
- Players can toggle Audio (Mute/Unmute Master Volume) and Music Volume.
- Players can toggle Post-Processing (Vignette/Bloom) for performance on lower-end devices.

**Data Model:**
- Create `useSettingsStore.ts` with properties: `volume: number`, `postProcessing: boolean`, `isOpen: boolean`.
- Actions to `toggleSettings()`, `setVolume()`, `setPostProcessing()`.

**UI & Visuals:**
- **SettingsUI:** A React modal with sliders for volume and a toggle switch for graphics.
- **WorldScene updates:** The camera post-processing effects (Vignette/Bloom) subscribe to the `postProcessing` flag to enable/disable dynamically.
