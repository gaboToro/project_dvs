import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EmailQueue } from './email.queue';
import { EmailService } from './email.service';

@Injectable()
export class EmailConsumer implements OnModuleInit {
  private readonly logger = new Logger(EmailConsumer.name);

  constructor(
    private readonly queue: EmailQueue,
    private readonly email: EmailService,
  ) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    if (process.env.EMAIL_CONSUMER_ENABLED === 'false') return;

    await this.queue.consume(async (payload) => {
      this.logger.log(`Sending email to ${payload.to}`);
      await this.email.send(payload);
    });
  }
}
