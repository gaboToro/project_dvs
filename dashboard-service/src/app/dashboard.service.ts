import { Injectable } from '@nestjs/common';
import type { VoteCastEvent } from '@org/contracts';
import { getMongoDb } from './db/mongo';

type DashboardDoc = {
  electionId: string;
  results: Record<string, number>;
  lastUpdatedAt: Date;
};

@Injectable()
export class DashboardService {
  async getResults(electionId: string): Promise<DashboardDoc | null> {
    const db = await getMongoDb();
    const collection = db.collection<DashboardDoc>('dashboard_results');
    const doc = await collection.findOne({ electionId });
    return doc
      ? {
          electionId: doc.electionId,
          results: doc.results || {},
          lastUpdatedAt: doc.lastUpdatedAt,
        }
      : null;
  }

  async applyVote(event: VoteCastEvent): Promise<DashboardDoc> {
    const db = await getMongoDb();
    const collection = db.collection<DashboardDoc>('dashboard_results');

    const now = new Date();
    const res = await collection.findOneAndUpdate(
      { electionId: event.electionId },
      {
        $inc: { [`results.${event.candidateId}`]: 1 },
        $set: { lastUpdatedAt: now },
      },
      { upsert: true, returnDocument: 'after' },
    );

    const doc = res.value ?? {
      electionId: event.electionId,
      results: {},
      lastUpdatedAt: now,
    };

    return {
      electionId: doc.electionId,
      results: doc.results || {},
      lastUpdatedAt: doc.lastUpdatedAt,
    };
  }
}
