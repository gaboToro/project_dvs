import type { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

type AuditPayload = {
  actorId?: string;
  actorRole?: string;
  action: string;
  resource: string;
  metadata?: Record<string, unknown>;
};

function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0];
  }
  return req.ip || req.socket.remoteAddress || undefined;
}

function getAuthPayload(jwt: JwtService, authHeader?: string) {
  if (!authHeader?.startsWith('Bearer ')) return undefined;
  const token = authHeader.replace('Bearer ', '');
  try {
    return jwt.verify(token, {
      secret: process.env.JWT_SECRET,
    }) as { sub?: string; roles?: string[] };
  } catch {
    return undefined;
  }
}

function mapActionResource(path: string, method: string) {
  if (path.startsWith('/api/auth/login')) return { action: 'LOGIN', resource: 'auth' };
  if (path.startsWith('/api/elections')) return { action: `${method}_ELECTION`, resource: 'elections' };
  if (path.startsWith('/api/votes')) return { action: 'VOTE_CAST', resource: 'votes' };
  if (path.startsWith('/api/users')) return { action: `${method}_USER`, resource: 'users' };
  return { action: `${method}_REQUEST`, resource: 'api' };
}

export function createAuditMiddleware(jwt: JwtService) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/health' || req.path.startsWith('/api/audit')) return next();

    const enabled = process.env.AUDIT_LOGGER_ENABLED !== 'false';
    const baseUrl = process.env.AUDIT_LOG_SERVICE_URL;
    if (!enabled || !baseUrl) return next();

    const start = Date.now();
    res.on('finish', () => {
      const auth = getAuthPayload(jwt, req.headers['authorization'] as string | undefined);
      const { action, resource } = mapActionResource(req.path, req.method);
      const payload: AuditPayload = {
        actorId: auth?.sub,
        actorRole: auth?.roles?.[0],
        action,
        resource,
        metadata: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMs: Date.now() - start,
        },
      };

      const internalToken = process.env.INTERNAL_SERVICE_TOKEN;
      const ip = getClientIp(req);
      const userAgent = req.headers['user-agent'];

      const timeoutMs = Number(process.env.AUDIT_LOGGER_TIMEOUT_MS ?? 800);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      void fetch(`${baseUrl}/api/audit/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(internalToken ? { 'x-internal-token': internalToken } : {}),
          ...(ip ? { 'x-forwarded-for': ip } : {}),
          ...(userAgent ? { 'user-agent': String(userAgent) } : {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
        .catch(() => undefined)
        .finally(() => clearTimeout(timeout));
    });

    next();
  };
}
