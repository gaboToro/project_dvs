import type { NextFunction, Request, Response } from 'express';

type RateLimitResponse = {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
};

function getClientKey(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() ?? 'anonymous';
  }
  return req.ip || req.socket?.remoteAddress || 'anonymous';
}

export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  if (process.env.RATE_LIMITER_ENABLED !== 'true') {
    return next();
  }

  const baseUrl = process.env.RATE_LIMITER_URL ?? 'http://localhost:3010';
  const limit = Number(process.env.RATE_LIMITER_LIMIT ?? 60);
  const windowSec = Number(process.env.RATE_LIMITER_WINDOW_SEC ?? 60);
  const token = process.env.INTERNAL_SERVICE_TOKEN;

  try {
    const response = await fetch(`${baseUrl}/api/ratelimit/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'x-internal-token': token } : {}),
      },
      body: JSON.stringify({
        key: getClientKey(req),
        limit,
        windowSec,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as RateLimitResponse;
      if (!data.allowed) {
        return res.status(429).json({
          statusCode: 429,
          message: 'Too many requests',
          limit: data.limit,
          remaining: data.remaining,
          resetAt: data.resetAt,
        });
      }
    }
  } catch {
    // Fail open on rate-limiter errors.
  }

  return next();
}
