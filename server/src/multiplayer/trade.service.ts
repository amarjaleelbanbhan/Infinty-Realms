import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { TradeOffer, InventorySlot } from '@infinity-realms/shared/types';

interface PendingTrade {
  offers: Map<string, TradeOffer>;
  locked: Set<string>;
}

export interface TradeExecutionResult {
  success: boolean;
  reason?: string;
  results?: Map<string, { gold: number; inventory: InventorySlot[] }>;
}

/**
 * Server-authoritative trade execution. GameGateway relays offers/locks
 * between the two clients for UI display, but the actual gold/inventory
 * mutation only ever happens here, validated against each player's
 * persisted state, inside a single DB transaction — a client cannot make
 * itself receive more than it truly gave up.
 */
@Injectable()
export class TradeService {
  private sessions = new Map<string, PendingTrade>();

  constructor(private prisma: PrismaService) {}

  private sessionKey(playerA: string, playerB: string): string {
    return [playerA, playerB].sort().join('|');
  }

  recordOffer(playerId: string, partnerId: string, offer: TradeOffer): void {
    const key = this.sessionKey(playerId, partnerId);
    let session = this.sessions.get(key);
    if (!session) {
      session = { offers: new Map(), locked: new Set() };
      this.sessions.set(key, session);
    }
    session.offers.set(playerId, offer);
    // Changing your offer after locking un-locks you — you shouldn't be able
    // to lock in an offer, swap it out, and still trigger execution.
    session.locked.delete(playerId);
  }

  /** Returns true once both sides are locked with an offer on record — the caller should execute the trade. */
  recordLock(playerId: string, partnerId: string): boolean {
    const key = this.sessionKey(playerId, partnerId);
    const session = this.sessions.get(key);
    if (!session) return false;
    session.locked.add(playerId);
    return (
      session.locked.has(playerId) &&
      session.locked.has(partnerId) &&
      session.offers.has(playerId) &&
      session.offers.has(partnerId)
    );
  }

  clearSession(playerId: string, partnerId: string): void {
    this.sessions.delete(this.sessionKey(playerId, partnerId));
  }

  async executeTrade(playerAId: string, playerBId: string): Promise<TradeExecutionResult> {
    const key = this.sessionKey(playerAId, playerBId);
    const session = this.sessions.get(key);
    const offerA = session?.offers.get(playerAId);
    const offerB = session?.offers.get(playerBId);

    if (!offerA || !offerB) {
      this.clearSession(playerAId, playerBId);
      return { success: false, reason: 'Trade session is missing an offer.' };
    }

    try {
      const results = await this.prisma.$transaction(async (tx: any) => {
        const playerA = await tx.player.findUnique({ where: { id: playerAId } });
        const playerB = await tx.player.findUnique({ where: { id: playerBId } });
        if (!playerA || !playerB) throw new Error('Player not found.');

        const invA: InventorySlot[] = JSON.parse(playerA.inventoryJson);
        const invB: InventorySlot[] = JSON.parse(playerB.inventoryJson);

        if (playerA.gold < offerA.gold) throw new Error(`${playerA.name} does not have the offered gold.`);
        if (playerB.gold < offerB.gold) throw new Error(`${playerB.name} does not have the offered gold.`);

        for (const { item, quantity } of offerA.items) {
          const held = invA.find((slot) => slot.item.id === item.id);
          if (!held || held.quantity < quantity) {
            throw new Error(`${playerA.name} does not have the offered item: ${item.name}.`);
          }
        }
        for (const { item, quantity } of offerB.items) {
          const held = invB.find((slot) => slot.item.id === item.id);
          if (!held || held.quantity < quantity) {
            throw new Error(`${playerB.name} does not have the offered item: ${item.name}.`);
          }
        }

        const newInvA = this.applyTrade(invA, offerA, offerB);
        const newInvB = this.applyTrade(invB, offerB, offerA);
        const newGoldA = playerA.gold - offerA.gold + offerB.gold;
        const newGoldB = playerB.gold - offerB.gold + offerA.gold;

        await tx.player.update({
          where: { id: playerAId },
          data: { gold: newGoldA, inventoryJson: JSON.stringify(newInvA) },
        });
        await tx.player.update({
          where: { id: playerBId },
          data: { gold: newGoldB, inventoryJson: JSON.stringify(newInvB) },
        });

        const map = new Map<string, { gold: number; inventory: InventorySlot[] }>();
        map.set(playerAId, { gold: newGoldA, inventory: newInvA });
        map.set(playerBId, { gold: newGoldB, inventory: newInvB });
        return map;
      });

      this.clearSession(playerAId, playerBId);
      return { success: true, results };
    } catch (err) {
      this.clearSession(playerAId, playerBId);
      return { success: false, reason: err instanceof Error ? err.message : 'Trade failed.' };
    }
  }

  private applyTrade(inventory: InventorySlot[], myOffer: TradeOffer, partnerOffer: TradeOffer): InventorySlot[] {
    let result = inventory.map((slot) => ({ ...slot }));

    for (const { item, quantity } of myOffer.items) {
      const idx = result.findIndex((slot) => slot.item.id === item.id);
      result[idx] = { ...result[idx], quantity: result[idx].quantity - quantity };
    }
    result = result.filter((slot) => slot.quantity > 0);

    for (const { item, quantity } of partnerOffer.items) {
      const idx = result.findIndex((slot) => slot.item.id === item.id);
      if (idx >= 0) {
        result[idx] = { ...result[idx], quantity: result[idx].quantity + quantity };
      } else {
        result.push({ item, quantity });
      }
    }

    return result;
  }
}
