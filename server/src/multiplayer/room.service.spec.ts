import { RoomService, MAX_ALLOWED_SPEED } from './room.service';

describe('RoomService', () => {
  let service: RoomService;

  beforeEach(() => {
    service = new RoomService();
  });

  describe('room lifecycle', () => {
    it('creates a room with the host as the only member', () => {
      const room = service.createRoom('host-1', 'seed-1');
      expect(room.playerIds).toEqual(['host-1']);
      expect(room.hostPlayerId).toBe('host-1');
    });

    it('joins an existing room', () => {
      const room = service.createRoom('host-1', 'seed-1');
      const result = service.joinRoom(room.id, 'player-2');
      expect(result.error).toBeUndefined();
      expect(result.room?.playerIds).toContain('player-2');
    });

    it('rejects joining a full room', () => {
      const room = service.createRoom('host-1', 'seed-1', false, 1);
      const result = service.joinRoom(room.id, 'player-2');
      expect(result.error).toBe('Room is full');
    });

    it('rejects joining a room that does not exist', () => {
      const result = service.joinRoom('ZZZZ-9999', 'player-2');
      expect(result.error).toBe('Room not found');
    });

    it('transfers host when the host leaves and others remain', () => {
      const room = service.createRoom('host-1', 'seed-1');
      service.joinRoom(room.id, 'player-2');
      const { isHostLeft } = service.leaveRoom('host-1');
      expect(isHostLeft).toBe(true);
      expect(service.getRoom(room.id)?.hostPlayerId).toBe('player-2');
    });

    it('deletes the room once the last player leaves', () => {
      const room = service.createRoom('host-1', 'seed-1');
      service.leaveRoom('host-1');
      expect(service.getRoom(room.id)).toBeUndefined();
    });
  });

  describe('validateMovement (server-authoritative anti-cheat)', () => {
    it('accepts the first movement for a player unconditionally', () => {
      const result = service.validateMovement('p1', { x: 100, y: 100 }, 1000);
      expect(result.valid).toBe(true);
    });

    it('accepts movement within the allowed speed budget', () => {
      service.validateMovement('p1', { x: 0, y: 0 }, 1000);
      // 100px in 1s = 100px/s, well under MAX_ALLOWED_SPEED
      const result = service.validateMovement('p1', { x: 100, y: 0 }, 2000);
      expect(result.valid).toBe(true);
    });

    it('rejects movement that implies an impossible speed and returns the last-good position', () => {
      service.validateMovement('p1', { x: 0, y: 0 }, 1000);
      // 5000px in 1s = 5000px/s, far above MAX_ALLOWED_SPEED
      const result = service.validateMovement('p1', { x: 5000, y: 0 }, 2000);
      expect(result.valid).toBe(false);
      expect(result.correctedPos).toEqual({ x: 0, y: 0 });
    });

    it('does not advance tracked position after a rejected move (prevents speed-laundering via repeated small jumps)', () => {
      service.validateMovement('p1', { x: 0, y: 0 }, 1000);
      service.validateMovement('p1', { x: 5000, y: 0 }, 2000); // rejected
      // From the server's perspective the player is still at (0,0) at t=2000,
      // so covering 100px in the next 1s should still be well within budget.
      const result = service.validateMovement('p1', { x: 100, y: 0 }, 3000);
      expect(result.valid).toBe(true);
    });

    it('accepts a boundary-case speed exactly at the configured max', () => {
      service.validateMovement('p1', { x: 0, y: 0 }, 1000);
      const result = service.validateMovement('p1', { x: MAX_ALLOWED_SPEED, y: 0 }, 2000);
      expect(result.valid).toBe(true);
    });

    it('tracks players independently', () => {
      service.validateMovement('p1', { x: 0, y: 0 }, 1000);
      service.validateMovement('p2', { x: 0, y: 0 }, 1000);
      const p1Result = service.validateMovement('p1', { x: 5000, y: 0 }, 2000);
      const p2Result = service.validateMovement('p2', { x: 50, y: 0 }, 2000);
      expect(p1Result.valid).toBe(false);
      expect(p2Result.valid).toBe(true);
    });

    it('does not penalize duplicate/out-of-order timestamps', () => {
      service.validateMovement('p1', { x: 0, y: 0 }, 2000);
      const result = service.validateMovement('p1', { x: 9999, y: 9999 }, 1500); // dt <= 0
      expect(result.valid).toBe(true);
    });

    it('resets tracking for a player via clearPlayerPosition, treating the next move as a fresh start', () => {
      service.validateMovement('p1', { x: 0, y: 0 }, 1000);
      service.clearPlayerPosition('p1');
      // Without the reset this large jump would be rejected; after a teleport
      // (respawn/house/dungeon entry) it should be accepted as the new baseline.
      const result = service.validateMovement('p1', { x: 9999, y: 9999 }, 1001);
      expect(result.valid).toBe(true);
    });

    it('clears tracked position when a player leaves their room', () => {
      const room = service.createRoom('p1', 'seed-1');
      service.validateMovement('p1', { x: 0, y: 0 }, 1000);
      service.leaveRoom('p1');
      const result = service.validateMovement('p1', { x: 9999, y: 9999 }, 1001);
      expect(result.valid).toBe(true);
      expect(service.getRoom(room.id)).toBeUndefined();
    });
  });

  describe('socket registry (used to relay 1:1 features like trading to a specific player)', () => {
    it('returns undefined for a player with no registered socket', () => {
      expect(service.getSocketId('unknown-player')).toBeUndefined();
    });

    it('registers and retrieves a socket id for a player', () => {
      service.registerSocket('p1', 'socket-abc');
      expect(service.getSocketId('p1')).toBe('socket-abc');
    });

    it('overwrites the socket id on reconnect', () => {
      service.registerSocket('p1', 'socket-old');
      service.registerSocket('p1', 'socket-new');
      expect(service.getSocketId('p1')).toBe('socket-new');
    });

    it('removes the mapping on unregisterSocket', () => {
      service.registerSocket('p1', 'socket-abc');
      service.unregisterSocket('p1');
      expect(service.getSocketId('p1')).toBeUndefined();
    });
  });
});
