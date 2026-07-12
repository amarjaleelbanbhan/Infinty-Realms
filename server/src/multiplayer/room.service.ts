import { Injectable } from '@nestjs/common';
import type { GameRoom, Player, Vec2 } from '@infinity-realms/shared/types';

/** Generous ceiling in px/s. Base player speed is 150 (see PlayerStats default);
 * this allows for dashes/mounts/buffs without hand-tuning every ability server-side. */
export const MAX_ALLOWED_SPEED = 600;

interface TrackedPosition {
  x: number;
  y: number;
  t: number;
}

export interface MovementValidationResult {
  valid: boolean;
  correctedPos?: Vec2;
}

@Injectable()
export class RoomService {
  private rooms = new Map<string, GameRoom>();
  private playerRooms = new Map<string, string>(); // playerId -> roomCode
  private lastPositions = new Map<string, TrackedPosition>(); // playerId -> last validated position
  private playerSockets = new Map<string, string>(); // playerId -> current socket.id

  /** Generate 8-character room code format: "ABCD-93KF" */
  generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    code += '-';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  createRoom(hostPlayerId: string, worldSeed: string, isPublic = false, maxPlayers = 8): GameRoom {
    const code = this.generateRoomCode();
    const room: GameRoom = {
      id: code,
      hostPlayerId,
      playerIds: [hostPlayerId],
      maxPlayers,
      isPublic,
      worldSeed,
      createdAt: Date.now(),
    };

    this.rooms.set(code, room);
    this.playerRooms.set(hostPlayerId, code);
    return room;
  }

  joinRoom(roomCode: string, playerId: string): { room?: GameRoom; error?: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { error: 'Room not found' };
    if (room.playerIds.length >= room.maxPlayers) return { error: 'Room is full' };

    if (!room.playerIds.includes(playerId)) {
      room.playerIds.push(playerId);
    }
    this.playerRooms.set(playerId, room.id);
    return { room };
  }

  /** Track which live socket a player is currently connected on, so 1:1 features
   * (trade) can be relayed directly to them instead of broadcast to the whole room. */
  registerSocket(playerId: string, socketId: string): void {
    this.playerSockets.set(playerId, socketId);
  }

  getSocketId(playerId: string): string | undefined {
    return this.playerSockets.get(playerId);
  }

  unregisterSocket(playerId: string): void {
    this.playerSockets.delete(playerId);
  }

  leaveRoom(playerId: string): { roomCode?: string; isHostLeft?: boolean } {
    const roomCode = this.playerRooms.get(playerId);
    this.lastPositions.delete(playerId);
    if (!roomCode) return {};

    const room = this.rooms.get(roomCode);
    this.playerRooms.delete(playerId);

    if (room) {
      room.playerIds = room.playerIds.filter((id) => id !== playerId);
      const isHostLeft = room.hostPlayerId === playerId;

      if (room.playerIds.length === 0) {
        this.rooms.delete(roomCode);
      } else if (isHostLeft) {
        room.hostPlayerId = room.playerIds[0]; // Transfer host
      }

      return { roomCode, isHostLeft };
    }

    return {};
  }

  getRoom(roomCode: string): GameRoom | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  getPublicRooms(): GameRoom[] {
    return Array.from(this.rooms.values()).filter((r) => r.isPublic && r.playerIds.length < r.maxPlayers);
  }

  /**
   * Server-authoritative movement check. Rejects position updates that imply
   * an impossible speed (teleport/speedhack) instead of trusting the client's
   * claimed position outright. On rejection, returns the last known-good
   * position so the caller can snap the client back in sync.
   */
  validateMovement(playerId: string, pos: Vec2, now: number, maxSpeed = MAX_ALLOWED_SPEED): MovementValidationResult {
    const last = this.lastPositions.get(playerId);

    if (!last) {
      this.lastPositions.set(playerId, { x: pos.x, y: pos.y, t: now });
      return { valid: true };
    }

    const dt = (now - last.t) / 1000;
    if (dt <= 0) {
      // Out-of-order or duplicate packet; don't penalize, just don't advance state.
      return { valid: true };
    }

    const dx = pos.x - last.x;
    const dy = pos.y - last.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = distance / dt;

    if (speed > maxSpeed) {
      return { valid: false, correctedPos: { x: last.x, y: last.y } };
    }

    this.lastPositions.set(playerId, { x: pos.x, y: pos.y, t: now });
    return { valid: true };
  }

  /** Exposed for tests and for resetting state on respawn/teleport (house, dungeon, death). */
  clearPlayerPosition(playerId: string): void {
    this.lastPositions.delete(playerId);
  }
}
