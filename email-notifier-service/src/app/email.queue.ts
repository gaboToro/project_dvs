import { Injectable, Logger } from '@nestjs/common';
import amqplib, { Channel, ChannelModel } from 'amqplib';
import type { EmailMessage } from './email.types';

@Injectable()
export class EmailQueue {
  private readonly logger = new Logger(EmailQueue.name);
  private connection?: ChannelModel;
  private channel?: Channel;

  async publish(message: EmailMessage): Promise<void> {
    const channel = await this.getChannel();
    const queue = this.getQueueName();
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      contentType: 'application/json',
      persistent: true,
    });
  }

  async consume(handler: (payload: EmailMessage) => Promise<void>) {
    const channel = await this.getChannel();
    const queue = this.getQueueName();
    await channel.assertQueue(queue, { durable: true });
    await channel.prefetch(5);

    await channel.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString()) as EmailMessage;
        await handler(payload);
        channel.ack(msg);
      } catch (error: any) {
        const requeue = process.env.EMAIL_REQUEUE_ON_ERROR === 'true';
        this.logger.warn(
          `Email processing failed: ${error?.message ?? 'unknown'} (requeue=${requeue})`,
        );
        channel.nack(msg, false, requeue);
      }
    });
  }

  private async getChannel(): Promise<Channel> {
    if (this.channel) return this.channel;
    const url = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';
    this.connection = await amqplib.connect(url);
    this.channel = await this.connection.createChannel();
    return this.channel;
  }

  private getQueueName(): string {
    return process.env.RABBITMQ_QUEUE_EMAIL ?? 'emails.send';
  }
}
