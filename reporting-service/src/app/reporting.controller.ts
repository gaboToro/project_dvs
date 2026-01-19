import { BadRequestException, Controller, Get, NotFoundException, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { ElectionStatus } from '@org/contracts';
import { ReportingService } from './reporting.service';
import { ReportingJobsService } from './reporting.jobs.service';

@Controller('reports')
export class ReportingController {
  constructor(
    private readonly reporting: ReportingService,
    private readonly jobs: ReportingJobsService,
  ) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'reporting-service' };
  }

  @Get('elections.csv')
  async electionsCsv(@Res() res: Response, @Query('status') status?: ElectionStatus) {
    const csv = await this.reporting.buildElectionSummaryCsv(status);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="election-summary.csv"');
    res.send(csv);
  }

  @Post('elections')
  async enqueueElectionsReport(@Query('status') status?: ElectionStatus) {
    const job = await this.jobs.requestElectionReport(status);
    return {
      jobId: job.id,
      status: job.status,
      createdAt: job.createdAt,
    };
  }

  @Get(':jobId')
  async getJob(@Param('jobId') jobId: string) {
    const job = await this.jobs.getJob(jobId);
    if (!job) throw new NotFoundException('Report not found');
    return job;
  }

  @Get(':jobId/download')
  async download(@Param('jobId') jobId: string) {
    const job = await this.jobs.getJob(jobId);
    if (!job) throw new NotFoundException('Report not found');
    if (job.status !== 'DONE') {
      throw new BadRequestException('Report not ready');
    }

    const url = await this.jobs.getDownloadUrl(jobId);
    return { url };
  }
}
