import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import type { VoteCastEvent } from '@org/contracts';
import { DashboardGateway } from '../dashboard.gateway';
import { DashboardService } from '../dashboard.service';

const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

const kafka = new Kafka({
  clientId: 'dashboard-service',
  brokers,
});

@Injectable()
export class DashboardConsumer implements OnModuleInit {
  private readonly logger = new Logger(DashboardConsumer.name);

  constructor(
    private readonly dashboard: DashboardService,
    private readonly gateway: DashboardGateway,
  ) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    if (process.env.DASHBOARD_CONSUMER_ENABLED === 'false') return;
    await this.start();
  }

  private async start() {
    const consumer = kafka.consumer({ groupId: 'dashboard-service' });

    await consumer.connect();
    await consumer.subscribe({
      topic: process.env.KAFKA_TOPIC_VOTES || 'votes.cast.v1',
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;

        let event: VoteCastEvent;
        try {
          event = JSON.parse(message.value.toString()) as VoteCastEvent;
        } catch (error: any) {
          this.logger.warn(`Invalid message payload: ${error?.message ?? 'unknown'}`);
          return;
        }

        const doc = await this.dashboard.applyVote(event);
        this.gateway.emitUpdate(doc.electionId, doc.results, doc.lastUpdatedAt);
      },
    });
  }
}
