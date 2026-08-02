import { describe, it, expect, beforeEach, vi } from 'vitest';
import { soundtrackSystem } from './SoundtrackSystem';

describe('SoundtrackSystem', () => {
  beforeEach(() => {
    soundtrackSystem.stopTrack();
  });

  it('handles playTrack and track state updates cleanly', () => {
    soundtrackSystem.playTrack('explore');
    expect((soundtrackSystem as any).currentTrack).toBe('explore');

    soundtrackSystem.playTrack('combat');
    expect((soundtrackSystem as any).currentTrack).toBe('combat');

    soundtrackSystem.playTrack('boss');
    expect((soundtrackSystem as any).currentTrack).toBe('boss');
  });

  it('stops track playback gracefully', () => {
    soundtrackSystem.playTrack('dungeon');
    expect((soundtrackSystem as any).isPlaying).toBe(true);

    soundtrackSystem.stopTrack();
    expect((soundtrackSystem as any).isPlaying).toBe(false);
  });

  it('sets volume bounds without throwing', () => {
    expect(() => soundtrackSystem.setVolume(0.5)).not.toThrow();
    expect(() => soundtrackSystem.setVolume(1.0)).not.toThrow();
    expect(() => soundtrackSystem.setVolume(0)).not.toThrow();
  });
});
