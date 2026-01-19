import { Injectable } from '@nestjs/common';
import { SQSClient, SendMessageCommand, DeleteMessageCommand, ReceiveMessageCommand } from '@aws-sdk/client-sqs';
import type { ReportJobMessage } from './reporting.types';

@Injectable()
export class ReportingQueue {
  private readonly client: SQSClient;

  constructor() {
    this.client = new SQSClient({
      region: process.env.AWS_REGION,
      credentials: process.env.AWS_ACCESS_KEY_ID
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
          }
        : undefined,
      endpoint: process.env.AWS_SQS_ENDPOINT,
    });
  }

  async send(jobId: string): Promise<void> {
    const queueUrl = this.getQueueUrl();
    const payload: ReportJobMessage = { jobId };
    const body = JSON.stringify(payload);
    await this.client.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: body,
      }),
    );
  }

  async receive(maxMessages = 5, waitTimeSeconds = 20) {
    const queueUrl = this.getQueueUrl();
    const result = await this.client.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: maxMessages,
        WaitTimeSeconds: waitTimeSeconds,
        VisibilityTimeout: Number(process.env.REPORTING_QUEUE_VISIBILITY_SEC ?? 60),
      }),
    );
    return result.Messages ?? [];
  }

  async ack(receiptHandle: string): Promise<void> {
    const queueUrl = this.getQueueUrl();
    await this.client.send(
      new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
      }),
    );
  }

  private getQueueUrl(): string {
    const url = process.env.REPORTING_SQS_QUEUE_URL;
    if (!url) {
      throw new Error('REPORTING_SQS_QUEUE_URL not configured');
    }
    return url;
  }
}
