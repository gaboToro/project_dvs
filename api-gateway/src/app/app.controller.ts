import {
  Controller,
  Get,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Controller()
export class AppController {
  constructor(private readonly jwtService: JwtService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'api-gateway' };
  }

  @Get('me')
  async me(@Headers('authorization') authHeader?: string) {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      });

      return {
        ok: true,
        user: payload,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}