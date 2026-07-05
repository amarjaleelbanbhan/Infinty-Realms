import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IsString, IsOptional, MaxLength } from 'class-validator';

class GuestLoginDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  name?: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('guest')
  @ApiOperation({ summary: 'Create a guest session (no account required)' })
  async guestLogin(@Body() dto: GuestLoginDto) {
    return this.auth.createGuestSession(dto.name);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current player info from token' })
  async me(@Request() req: { user: { playerId: string; name: string } }) {
    return req.user;
  }
}
