import { io, Socket } from 'socket.io-client';
import type { Vec2, ChatMessage, TradeOffer } from '@shared/types';
import { useGameStore } from '@stores/useGameStore';
import { useUIStore } from '@stores/useUIStore';

export class SocketManager {
  private socket: Socket | null = null;
  private currentRoomCode: string | null = null;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();

  connect() {
    if (this.socket?.connected) return;

    const serverUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001';
    this.socket = io(serverUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected to server:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
    });

    this.socket.on('playerJoined', (data) => {
      useUIStore.getState().addToast(`${data.name} joined the realm!`, 'info');
      this.emitLocal('remotePlayerJoined', data);
    });

    this.socket.on('playerLeft', (data) => {
      this.emitLocal('remotePlayerLeft', data);
    });

    this.socket.on('playerMoved', (data) => {
      this.emitLocal('remotePlayerMoved', data);
    });

    this.socket.on('playerAttacked', (data) => {
      this.emitLocal('remotePlayerAttacked', data);
    });

    this.socket.on('chatMessage', (msg: ChatMessage) => {
      this.emitLocal('chatMessage', msg);
    });

    this.socket.on('movementRejected', (data: { pos?: Vec2 }) => {
      this.emitLocal('movementRejected', data);
    });

    this.socket.on('tradeRequestIncoming', (data: { fromId: string; fromName: string }) => {
      this.emitLocal('tradeRequestIncoming', data);
    });

    this.socket.on('tradeRequestResponse', (data: { accepted: boolean; partnerId: string; partnerName?: string; reason?: string }) => {
      this.emitLocal('tradeRequestResponse', data);
    });

    this.socket.on('tradePartnerOfferUpdate', (data: { offer: TradeOffer }) => {
      this.emitLocal('tradePartnerOfferUpdate', data);
    });

    this.socket.on('tradePartnerLocked', () => {
      this.emitLocal('tradePartnerLocked', {});
    });

    this.socket.on('tradePartnerCancelled', () => {
      this.emitLocal('tradePartnerCancelled', {});
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.currentRoomCode = null;
  }

  createRoom(isPublic = false): Promise<string> {
    return new Promise((resolve, reject) => {
      this.connect();
      const player = useGameStore.getState().player;
      if (!player) return reject('No player state');

      this.socket?.emit(
        'createRoom',
        { playerId: player.id, worldSeed: player.worldSeed, isPublic },
        (res: { success: boolean; room?: { id: string } }) => {
          if (res.success && res.room) {
            this.currentRoomCode = res.room.id;
            resolve(res.room.id);
          } else {
            reject('Failed to create room');
          }
        }
      );
    });
  }

  joinRoom(roomCode: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.connect();
      const player = useGameStore.getState().player;
      if (!player) return reject('No player state');

      this.socket?.emit(
        'joinRoom',
        { roomCode, playerId: player.id, name: player.name },
        (res: { success: boolean; error?: string }) => {
          if (res.success) {
            this.currentRoomCode = roomCode.toUpperCase();
            useUIStore.getState().addToast(`Joined room: ${roomCode}`, 'success');
            resolve(true);
          } else {
            useUIStore.getState().addToast(res.error || 'Room error', 'error');
            reject(res.error);
          }
        }
      );
    });
  }

  sendMove(pos: Vec2, direction: string) {
    const player = useGameStore.getState().player;
    if (!player || !this.currentRoomCode) return;

    this.socket?.emit('move', {
      roomCode: this.currentRoomCode,
      playerId: player.id,
      pos,
      direction,
    });
  }

  sendAttack(direction: string) {
    const player = useGameStore.getState().player;
    if (!player || !this.currentRoomCode) return;

    this.socket?.emit('attack', {
      roomCode: this.currentRoomCode,
      playerId: player.id,
      direction,
    });
  }

  sendChat(message: string, channel: 'world' | 'local' | 'party' = 'world') {
    const player = useGameStore.getState().player;
    if (!player) return;

    this.socket?.emit('chat', {
      roomCode: this.currentRoomCode,
      playerId: player.id,
      playerName: player.name,
      message,
      channel,
    });
  }

  sendTradeRequest(targetId: string) {
    const player = useGameStore.getState().player;
    if (!player) return;
    this.socket?.emit('tradeRequest', { fromId: player.id, fromName: player.name, targetId });
  }

  respondTradeRequest(requesterId: string, accepted: boolean) {
    const player = useGameStore.getState().player;
    if (!player) return;
    this.socket?.emit('tradeRequestResponse', {
      requesterId,
      accepted,
      responderId: player.id,
      responderName: player.name,
    });
  }

  sendTradeOfferUpdate(targetId: string, offer: TradeOffer) {
    this.socket?.emit('tradeOfferUpdate', { targetId, offer });
  }

  sendTradeLock(targetId: string) {
    this.socket?.emit('tradeLock', { targetId });
  }

  sendTradeCancel(targetId: string) {
    this.socket?.emit('tradeCancel', { targetId });
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: (data: any) => void) {
    const list = this.listeners.get(event);
    if (list) {
      this.listeners.set(event, list.filter((cb) => cb !== callback));
    }
  }

  private emitLocal(event: string, data: any) {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  getRoomCode(): string | null {
    return this.currentRoomCode;
  }
}

export const socketManager = new SocketManager();
