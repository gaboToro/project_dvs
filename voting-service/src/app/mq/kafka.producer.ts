import { Kafka, type Producer } from 'kafkajs';
import type { VoteCastEvent } from '@org/contracts';

const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const topic = process.env.KAFKA_TOPIC_VOTES || 'votes.cast.v1';

const kafka = new Kafka({
  clientId: 'voting-service',
  brokers,
});

let producer: Producer | null = null;
let connecting: Promise<Producer> | null = null;

async function getProducer(): Promise<Producer> {
  if (producer) return producer;
  if (connecting) return connecting;

  connecting = (async () => {
    const created = kafka.producer();
    await created.connect();
    producer = created;
    return created;
  })();

  return connecting;
}

export async function publishVoteCast(event: VoteCastEvent): Promise<void> {
  const active = await getProducer();
  await active.send({
    topic,
    messages: [{ key: event.voterId, value: JSON.stringify(event) }],
  });
}
