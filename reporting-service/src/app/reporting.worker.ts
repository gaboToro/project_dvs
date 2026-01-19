import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ReportingQueue } from './reporting.queue';
import { ReportingJobsService } from './reporting.jobs.service';
import type { ReportJobMessage } from './reporting.types';

@Injectable()
export class ReportingWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportingWorker.name);
  private running = true;

  constructor(
    private readonly queue: ReportingQueue,
    private readonly jobs: ReportingJobsService,
  ) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    if (process.env.REPORTING_WORKER_ENABLED === 'false') return;
    if (!process.env.REPORTING_SQS_QUEUE_URL) {
      this.logger.warn('REPORTING_SQS_QUEUE_URL not configured; worker disabled');
      return;
    }

    try {
      void this.start();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Worker failed to start: ${message}`);
    }
  }

  async onModuleDestroy() {
    this.running = false;
  }

  private async start(): Promise<void> {
    while (this.running) {
      let messages;
      try {
        messages = await this.queue.receive();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`Queue receive failed: ${message}`);
        await this.sleep(1000);
        continue;
      }

      if (messages.length === 0) {
        continue;
      }

      for (const message of messages) {
        if (!message.Body || !message.ReceiptHandle) continue;
        let payload: ReportJobMessage | null = null;
        try {
          payload = JSON.parse(message.Body) as ReportJobMessage;
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          this.logger.warn(`Invalid job payload: ${msg}`);
        }

        if (!payload?.jobId) {
          await this.queue.ack(message.ReceiptHandle);
          continue;
        }

        await this.jobs.processJob(payload.jobId);
        await this.queue.ack(message.ReceiptHandle);
      }
    }
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
