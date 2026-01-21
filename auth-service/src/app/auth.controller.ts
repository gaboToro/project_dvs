import { Body, Controller, Get, Post, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { createHealthPayload } from '../../../libs/contracts/src/lib/health';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import type { LoginRequestDto, LoginResponseDto } from '@org/contracts';
import { firstValueFrom } from 'rxjs';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly http: HttpService,
  ) {}

  @Get('health')
  health() {
    return createHealthPayload('auth-service');
  }

  @Post('login')
  async login(@Body() body: LoginRequestDto): Promise<LoginResponseDto> {
    const userServiceUrl = process.env.USER_SERVICE_URL ?? 'http://localhost:3005';
    const internalToken = process.env.INTERNAL_SERVICE_TOKEN;
    if (!internalToken) throw new ServiceUnavailableException('Internal token missing');

    try {
      const res = await firstValueFrom(
        this.http.post(
          `${userServiceUrl}/api/users/validate`,
          body,
          { headers: { 'x-internal-token': internalToken } },
        ),
      );

      const user = res.data as { id: string; role: string };
      const accessToken = await this.jwtService.signAsync(
        {
          sub: user.id,
          roles: [user.role],
        },
        { expiresIn: '5m' },
      );

      void this.audit('LOGIN_SUCCESS', user.id, user.role, {
        username: body.username,
      });

      return { accessToken, tokenType: 'Bearer' };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        void this.audit('LOGIN_FAILED', undefined, undefined, {
          username: body.username,
        });
        throw new UnauthorizedException('Invalid credentials');
      }
      void this.audit('LOGIN_ERROR', undefined, undefined, {
        username: body.username,
      });
      throw new ServiceUnavailableException('User service unavailable');
    }
  }

  private async audit(
    action: string,
    actorId?: string,
    actorRole?: string,
    metadata?: Record<string, unknown>,
  ) {
    const auditUrl = process.env.AUDIT_LOG_SERVICE_URL;
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    if (!auditUrl || !token) return;

    try {
      await firstValueFrom(
        this.http.post(
          `${auditUrl}/api/audit/log`,
          {
            actorId,
            actorRole,
            action,
            resource: 'auth',
            metadata,
          },
          { headers: { 'x-internal-token': token } },
        ),
      );
    } catch {
      // Best effort only.
    }
  }
}

