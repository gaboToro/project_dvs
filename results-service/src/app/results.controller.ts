import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { createHealthPayload } from '@org/contracts';
import { getMongoDb } from './db/mongo';

@Controller('results')
export class ResultsController {
  @Get('health')
  health() {
    return createHealthPayload('results-service');
  }

  @Get(':electionId')
  async byElection(@Param('electionId') electionId: string) {
    const db = await getMongoDb();
    const collection = db.collection('election_results');

    const doc = await collection.findOne({ electionId });

    if (!doc) {
      throw new NotFoundException('No results for this election');
    }

    return {
      electionId: doc.electionId,
      results: doc.results || {},
      lastUpdatedAt: doc.lastUpdatedAt,
    };
  }
}


