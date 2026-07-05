import { Injectable } from '@nestjs/common';
import type { GameRoom, Player } from '@infinity-realms/shared/types';

@Injectable()
export class RoomService {
  private rooms = new Map<string, GameRoom>();
  private playerRooms = new Map<string, string>(); // playerId -> roomCode

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

  leaveRoom(playerId: string): { roomCode?: string; isHostLeft?: boolean } {
    const roomCode = this.playerRooms.get(playerId);
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
}
