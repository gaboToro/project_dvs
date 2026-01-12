import { Body, Controller, Get, Post, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { LoginRequestDto, LoginResponseDto } from '@org/contracts';

@Controller('auth')
export class AuthController {
  constructor(private readonly jwtService: JwtService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'auth-service' };
  }

  @Post('login')
  async login(@Body() body: LoginRequestDto): Promise<LoginResponseDto> {
    const { username, password } = body;

    const isAdmin = username === 'admin' && password === 'admin123';
    const isVoter = username === 'voter' && password === 'voter123';
    if (!isAdmin && !isVoter) throw new UnauthorizedException('Invalid credentials');

    const accessToken = await this.jwtService.signAsync({
      sub: username,
      roles: [isAdmin ? 'admin' : 'voter'],
    });

    return { accessToken, tokenType: 'Bearer' };
  }
}
