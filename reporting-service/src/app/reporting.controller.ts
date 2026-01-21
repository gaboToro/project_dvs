import { Controller, Get, Query, Res } from '@nestjs/common';
import { createHealthPayload } from '@org/contracts';
import type { Response } from 'express';
import type { ElectionStatus } from '@org/contracts';
import { ReportingService } from './reporting.service';

@Controller('reports')
export class ReportingController {
  constructor(private readonly reporting: ReportingService) {}

  @Get('health')
  health() {
    return createHealthPayload('reporting-service');
  }

  @Get('elections.csv')
  async electionsCsv(@Res() res: Response, @Query('status') status?: ElectionStatus) {
    const csv = await this.reporting.buildElectionSummaryCsv(status);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="election-summary.csv"');
    res.send(csv);
  }
}


