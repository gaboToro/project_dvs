import type { Request, Response, NextFunction } from 'express';

type RateLimitResponse = {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
};

function getClientKey(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0] || 'unknown';
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export async function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (process.env.RATE_LIMITER_ENABLED === 'false') return next();
  if (req.path === '/health') return next();

  const baseUrl = process.env.RATE_LIMITER_URL ?? 'http://localhost:3010';
  const limit = Number(process.env.RATE_LIMITER_LIMIT ?? 60);
  const windowSec = Number(process.env.RATE_LIMITER_WINDOW_SEC ?? 60);
  const key = getClientKey(req);

  const controller = new AbortController();
  const timeoutMs = Number(process.env.RATE_LIMITER_TIMEOUT_MS ?? 600);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/api/ratelimit/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.INTERNAL_SERVICE_TOKEN
          ? { 'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN }
          : {}),
      },
      body: JSON.stringify({ key, limit, windowSec }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return next();
    }

    const data = (await response.json()) as RateLimitResponse;
    res.setHeader('x-ratelimit-limit', String(data.limit));
    res.setHeader('x-ratelimit-remaining', String(data.remaining));
    res.setHeader('x-ratelimit-reset', String(data.resetAt));

    if (!data.allowed) {
      res.status(429).json({ message: 'Too many requests' });
      return;
    }

    return next();
  } catch {
    return next();
  } finally {
    clearTimeout(timeout);
  }
}
