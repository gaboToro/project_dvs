import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export type JwtPayload = { sub: string; roles?: string[] };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const auth = req.headers['authorization'] as string | undefined;

    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Missing Bearer token');
    const token = auth.replace('Bearer ', '');

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      });
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

export function requireAdminOrSelf(req: any, userId: string) {
  const payload: JwtPayload | undefined = req.user;
  if (!payload?.sub) throw new UnauthorizedException('Invalid token payload');

  const roles = payload.roles ?? [];
  const isAdmin = roles.includes('admin');
  const isSelf = payload.sub === userId;

  if (!isAdmin && !isSelf) throw new ForbiddenException('Not allowed');
}