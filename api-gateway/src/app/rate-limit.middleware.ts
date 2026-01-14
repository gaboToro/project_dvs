import type { Request, Response, NextFunction } from 'express';

type RateLimitResponse = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

function getClientKey(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0] ?? 'unknown';
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/health') return next();

  const enabled = process.env.RATE_LIMITER_ENABLED === 'true';
  if (!enabled) return next();

  const baseUrl = process.env.RATE_LIMITER_URL ?? 'http://localhost:3010';
  const limit = Number(process.env.RATE_LIMITER_LIMIT ?? '60');
  const windowSec = Number(process.env.RATE_LIMITER_WINDOW_SEC ?? '60');
  const key = `${getClientKey(req)}:${req.path}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1000);

  try {
    const internalToken = process.env.INTERNAL_SERVICE_TOKEN;
    const response = await fetch(`${baseUrl}/api/ratelimit/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(internalToken ? { 'x-internal-token': internalToken } : {}),
      },
      body: JSON.stringify({ key, limit, windowSec }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return next();
    }

    const payload = (await response.json()) as RateLimitResponse;
    res.setHeader('X-RateLimit-Limit', String(payload.limit));
    res.setHeader('X-RateLimit-Remaining', String(payload.remaining));
    res.setHeader('X-RateLimit-Reset', String(payload.resetAt));

    if (!payload.allowed) {
      return res.status(429).json({
        statusCode: 429,
        message: 'Too many requests',
      });
    }

    return next();
  } catch {
    return next();
  } finally {
    clearTimeout(timeout);
  }
}
