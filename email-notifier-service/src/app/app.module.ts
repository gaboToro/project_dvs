import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailConsumer } from './email.consumer';
import { EmailQueue } from './email.queue';
import { EmailService } from './email.service';

@Module({
  controllers: [EmailController],
  providers: [EmailService, EmailQueue, EmailConsumer],
})
export class AppModule {}
