import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@ApiTags('modding')
@Controller('modding')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ModdingController {
  constructor(
    private prisma: PrismaService,
    private ai: AiService,
  ) {}

  @Post('dungeons')
  @ApiOperation({ summary: 'Submit a custom dungeon for AI review' })
  async submitCustomDungeon(
    @Request() req: { user: { playerId: string } },
    @Body() body: { name: string; layoutJson: string }
  ) {
    // Phase 40 AI Moderation
    const prompt = `You are a Dungeon Master reviewing a user-generated dungeon layout. The layout is: ${body.layoutJson}. Does it contain inappropriate content, impossible paths, or unfair mechanics? Reply 'APPROVED' or 'REJECTED' with a reason.`;
    
    let isApproved = true;
    try {
      const response = await this.ai.generateDialogue({
        npcName: 'Dungeon Master',
        npcRole: 'moderator',
        personality: 'strict',
        playerMessage: prompt,
        memory: []
      });
      if (response && response.includes('REJECTED')) {
        isApproved = false;
        return { success: false, reason: response };
      }
    } catch (e) {
      console.warn('AI moderation failed, defaulting to manual review');
      isApproved = false;
    }

    const dungeon = await this.prisma.customDungeon.create({
      data: {
        authorId: req.user.playerId,
        name: body.name,
        layoutJson: body.layoutJson,
        isApproved
      }
    });

    return { success: true, dungeon };
  }
}
