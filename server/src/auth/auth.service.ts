import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /** Create a guest player with anonymous token — no email/password required */
  async createGuestSession(playerName?: string): Promise<{ token: string; playerId: string; name: string }> {
    const guestToken = uuidv4();
    const name = playerName?.trim() || `Hero_${Math.floor(Math.random() * 9999)}`;

    const player = await this.prisma.player.create({
      data: {
        name,
        guestToken,
        worldSeed: this.generateWorldSeed(),
      },
    });

    const token = this.jwtService.sign({
      sub: player.id,
      name: player.name,
      guest: true,
    });

    return { token, playerId: player.id, name: player.name };
  }

  async validateToken(token: string): Promise<{ playerId: string; name: string } | null> {
    try {
      const payload = this.jwtService.verify(token) as { sub: string; name: string };
      return { playerId: payload.sub, name: payload.name };
    } catch {
      return null;
    }
  }

  private generateWorldSeed(): string {
    const adjectives = ['mystic', 'ancient', 'forgotten', 'eternal', 'shadow', 'golden', 'iron', 'crystal'];
    const nouns = ['realm', 'vale', 'peaks', 'depths', 'shores', 'woods', 'spire', 'gate'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj}-${noun}-${Date.now().toString(36)}`;
  }
}
