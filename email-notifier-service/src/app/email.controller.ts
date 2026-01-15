import { Body, Controller, Headers, Post, Get, UnauthorizedException } from '@nestjs/common';
import type { EmailMessage } from './email.types';
import { EmailQueue } from './email.queue';

@Controller('email')
export class EmailController {
  constructor(private readonly queue: EmailQueue) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'email-notifier-service' };
  }

  @Post('send')
  async enqueue(
    @Headers('x-internal-token') token: string | undefined,
    @Body() body: EmailMessage,
  ) {
    const expected = process.env.INTERNAL_SERVICE_TOKEN;
    if (expected && token !== expected) {
      throw new UnauthorizedException('Invalid internal token');
    }

    if (!body?.to || !body?.subject || (!body.text && !body.html)) {
      return { ok: false, message: 'Invalid email payload' };
    }

    await this.queue.publish(body);
    return { ok: true };
  }
}
