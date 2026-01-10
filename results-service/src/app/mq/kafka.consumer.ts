import { Kafka } from 'kafkajs';
import { getMongoDb } from '../db/mongo';
import type { VoteCastEvent } from '@org/contracts';

const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

const kafka = new Kafka({
  clientId: 'results-service',
  brokers,
});

export async function startResultsConsumer() {
  const consumer = kafka.consumer({ groupId: 'results-service' });

  await consumer.connect();
  await consumer.subscribe({
    topic: process.env.KAFKA_TOPIC_VOTES || 'votes.cast.v1',
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const event = JSON.parse(message.value.toString()) as VoteCastEvent;

      const db = await getMongoDb();
      const collection = db.collection('election_results');

      await collection.updateOne(
        { electionId: event.electionId },
        {
          $inc: {
            [`results.${event.candidateId}`]: 1,
          },
          $set: {
            lastUpdatedAt: new Date(),
          },
        },
        { upsert: true },
      );

      console.log(
        `[Results] Updated election ${event.electionId} → candidate ${event.candidateId}`,
      );
    },
  });
}
