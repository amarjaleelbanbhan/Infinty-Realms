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
import { TradeService } from './trade.service';
import { QuestsService } from '../quests/quests.service';
import type { Vec2, ChatMessage, BiomeType, Season, TradeOffer, PartyMember } from '@infinity-realms/shared/types';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private roomService: RoomService,
    private tradeService: TradeService,
    private questsService: QuestsService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`[WS] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[WS] Client disconnected: ${client.id}`);
    const playerId = client.data.playerId as string | undefined;
    if (playerId) {
      this.roomService.unregisterSocket(playerId);
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
    this.roomService.registerSocket(data.playerId, client.id);
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
    this.roomService.registerSocket(data.playerId, client.id);
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
    if (!data.roomCode) return;

    const result = this.roomService.validateMovement(data.playerId, data.pos, Date.now());

    if (!result.valid) {
      // Snap the offending client back to its last known-good position instead
      // of trusting (and propagating) an impossible teleport/speedhack.
      client.emit('movementRejected', { pos: result.correctedPos });
      return;
    }

    client.to(data.roomCode).emit('playerMoved', {
      playerId: data.playerId,
      pos: data.pos,
      direction: data.direction,
    });
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
  @SubscribeMessage('requestQuest')
  async handleRequestQuest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { 
      playerId: string; 
      npcId: string; 
      npcName: string; 
      playerLevel: number; 
      worldSeed: string; 
      biome: BiomeType; 
      season: Season 
    },
  ) {
    try {
      const quest = await this.questsService.generateAndSave({
        worldSeed: data.worldSeed,
        biome: data.biome,
        season: data.season,
        playerLevel: data.playerLevel,
        playerId: data.playerId,
        nearbyNpcName: data.npcName,
      });

      client.emit('questOffered', { 
        npcId: data.npcId,
        quest: {
          ...quest,
          objectives: JSON.parse(quest.objectivesJson),
          rewards: JSON.parse(quest.rewardsJson),
        }
      });
      return { success: true };
    } catch (err) {
      console.error('[WS] Failed to generate quest:', err);
      return { success: false, error: 'Quest generation failed' };
    }
  }

  // ─── Trading ───────────────────────────────────────────────
  // Relays between the two specific players trading, not the whole room —
  // trade offers are private between the requester and the target.

  @SubscribeMessage('tradeRequest')
  handleTradeRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { fromId: string; fromName: string; targetId: string },
  ) {
    const targetSocketId = this.roomService.getSocketId(data.targetId);
    if (!targetSocketId) {
      client.emit('tradeRequestResponse', { accepted: false, partnerId: data.targetId, reason: 'Player is not online' });
      return;
    }
    this.server.to(targetSocketId).emit('tradeRequestIncoming', { fromId: data.fromId, fromName: data.fromName });
  }

  @SubscribeMessage('tradeRequestResponse')
  handleTradeRequestResponse(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { requesterId: string; accepted: boolean; responderId: string; responderName: string },
  ) {
    const requesterSocketId = this.roomService.getSocketId(data.requesterId);
    if (!requesterSocketId) return;
    this.server.to(requesterSocketId).emit('tradeRequestResponse', {
      accepted: data.accepted,
      partnerId: data.responderId,
      partnerName: data.responderName,
    });
  }

  @SubscribeMessage('tradeOfferUpdate')
  handleTradeOfferUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetId: string; offer: TradeOffer },
  ) {
    const fromId = client.data.playerId as string | undefined;
    if (fromId) {
      this.tradeService.recordOffer(fromId, data.targetId, data.offer);
    }

    const targetSocketId = this.roomService.getSocketId(data.targetId);
    if (!targetSocketId) return;
    this.server.to(targetSocketId).emit('tradePartnerOfferUpdate', { offer: data.offer });
  }

  @SubscribeMessage('tradeLock')
  async handleTradeLock(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetId: string },
  ) {
    const fromId = client.data.playerId as string | undefined;
    const targetSocketId = this.roomService.getSocketId(data.targetId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('tradePartnerLocked', {});
    }
    if (!fromId) return;

    const bothLocked = this.tradeService.recordLock(fromId, data.targetId);
    if (!bothLocked) return;

    // Both sides locked — this is the only place a trade actually executes.
    // Everything before this point was UI relay; the mutation itself is
    // validated and applied atomically against persisted state.
    const result = await this.tradeService.executeTrade(fromId, data.targetId);
    const fromSocketId = this.roomService.getSocketId(fromId);

    if (result.success && result.results) {
      const fromResult = result.results.get(fromId);
      const targetResult = result.results.get(data.targetId);
      if (fromSocketId && fromResult) this.server.to(fromSocketId).emit('tradeExecuted', fromResult);
      if (targetSocketId && targetResult) this.server.to(targetSocketId).emit('tradeExecuted', targetResult);
    } else {
      const reason = result.reason ?? 'Trade failed.';
      if (fromSocketId) this.server.to(fromSocketId).emit('tradeFailed', { reason });
      if (targetSocketId) this.server.to(targetSocketId).emit('tradeFailed', { reason });
    }
  }

  @SubscribeMessage('tradeCancel')
  handleTradeCancel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetId: string },
  ) {
    const fromId = client.data.playerId as string | undefined;
    if (fromId) {
      this.tradeService.clearSession(fromId, data.targetId);
    }

    const targetSocketId = this.roomService.getSocketId(data.targetId);
    if (!targetSocketId) return;
    this.server.to(targetSocketId).emit('tradePartnerCancelled', {});
  }

  // ─── Party ───────────────────────────────────────────────────
  // Same consent-gated relay pattern as trading: the invitee must
  // explicitly accept before anything changes, replacing what used to be
  // a fake auto-accepted invite with no other player involved at all.
  // Roster composition itself is still client-side (not server-authoritative
  // party membership) — see TECH_DEBT.md.

  @SubscribeMessage('partyInviteRequest')
  handlePartyInviteRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { fromId: string; fromName: string; targetId: string },
  ) {
    const targetSocketId = this.roomService.getSocketId(data.targetId);
    if (!targetSocketId) {
      client.emit('partyInviteResponse', { accepted: false, partnerId: data.targetId, reason: 'Player is not online' });
      return;
    }
    this.server.to(targetSocketId).emit('partyInviteIncoming', { fromId: data.fromId, fromName: data.fromName });
  }

  @SubscribeMessage('partyInviteResponse')
  handlePartyInviteResponse(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { requesterId: string; accepted: boolean; responderId: string; responderName: string },
  ) {
    const requesterSocketId = this.roomService.getSocketId(data.requesterId);
    if (!requesterSocketId) return;
    this.server.to(requesterSocketId).emit('partyInviteResponse', {
      accepted: data.accepted,
      partnerId: data.responderId,
      partnerName: data.responderName,
    });
  }

  @SubscribeMessage('partySync')
  handlePartySync(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetIds: string[]; partyId: string | null; leaderId: string | null; members: PartyMember[] },
  ) {
    for (const targetId of data.targetIds) {
      const socketId = this.roomService.getSocketId(targetId);
      if (socketId) {
        this.server.to(socketId).emit('partyRosterUpdate', {
          partyId: data.partyId,
          leaderId: data.leaderId,
          members: data.members,
        });
      }
    }
  }
}
