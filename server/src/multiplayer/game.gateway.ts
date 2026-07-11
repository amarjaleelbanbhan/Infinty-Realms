import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from './room.service';
import type { Vec2, ChatMessage } from '@infinity-realms/shared/types';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private roomService: RoomService) {}

  handleConnection(client: Socket) {
    console.log(`[WS] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[WS] Client disconnected: ${client.id}`);
    const playerId = client.data.playerId as string | undefined;
    if (playerId) {
      const { roomCode } = this.roomService.leaveRoom(playerId);
      if (roomCode) {
        this.server.to(roomCode).emit('playerLeft', { playerId });
      }
    }
  }

  @SubscribeMessage('createRoom')
  handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { playerId: string; worldSeed: string; isPublic?: boolean },
  ) {
    client.data.playerId = data.playerId;
    const room = this.roomService.createRoom(data.playerId, data.worldSeed, data.isPublic);
    client.join(room.id);
    return { success: true, room };
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomCode: string; playerId: string; name: string },
  ) {
    client.data.playerId = data.playerId;
    const result = this.roomService.joinRoom(data.roomCode, data.playerId);

    if (result.error || !result.room) {
      return { success: false, error: result.error };
    }

    client.join(result.room.id);

    // Notify room members
    client.to(result.room.id).emit('playerJoined', {
      playerId: data.playerId,
      name: data.name,
    });

    return { success: true, room: result.room };
  }

  @SubscribeMessage('move')
  handleMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomCode: string; playerId: string; pos: Vec2; direction: string },
  ) {
    if (data.roomCode) {
      client.to(data.roomCode).emit('playerMoved', {
        playerId: data.playerId,
        pos: data.pos,
        direction: data.direction,
      });
    }
  }

  @SubscribeMessage('attack')
  handleAttack(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomCode: string; playerId: string; direction: string },
  ) {
    if (data.roomCode) {
      client.to(data.roomCode).emit('playerAttacked', {
        playerId: data.playerId,
        direction: data.direction,
      });
    }
  }

  @SubscribeMessage('chat')
  handleChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomCode: string; playerId: string; playerName: string; message: string; channel: 'world' | 'local' | 'party' },
  ) {
    const msg: ChatMessage = {
      playerId: data.playerId,
      playerName: data.playerName,
      message: data.message,
      timestamp: Date.now(),
      channel: data.channel ?? 'world',
    };

    if (data.roomCode) {
      this.server.to(data.roomCode).emit('chatMessage', msg);
    } else {
      this.server.emit('chatMessage', msg);
    }
  }
}
