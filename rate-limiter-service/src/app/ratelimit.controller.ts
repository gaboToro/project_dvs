import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { createHealthPayload } from '../../../libs/contracts/src/lib/health';
import { RateLimitService } from './ratelimit.service';

type CheckRequest = {
  key: string;
  limit?: number;
  windowSec?: number;
};

@Controller('ratelimit')
export class RateLimitController {
  constructor(private readonly limiter: RateLimitService) {}

  @Get('health')
  health() {
    return createHealthPayload('rate-limiter-service');
  }

  @Post('check')
  async check(
    @Headers('x-internal-token') token: string | undefined,
    @Body() body: CheckRequest,
  ) {
    const expected = process.env.INTERNAL_SERVICE_TOKEN;
    if (expected && token !== expected) {
      return { allowed: false, limit: 0, remaining: 0, resetAt: Date.now() };
    }

    const limit = Number(body.limit ?? process.env.RATE_LIMITER_LIMIT ?? 100);
    const windowSec = Number(body.windowSec ?? process.env.RATE_LIMITER_WINDOW_SEC ?? 60);
    const key = body.key || 'anonymous';

    return this.limiter.check(key, limit, windowSec);
  }
}

