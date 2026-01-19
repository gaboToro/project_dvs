import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { ElectionStatus } from '@org/contracts';
import { ReportingService } from './reporting.service';
import { ReportingRepository } from './reporting.repository';
import { ReportingQueue } from './reporting.queue';
import { ReportingStorage } from './reporting.storage';
import type { ReportJob } from './reporting.types';

@Injectable()
export class ReportingJobsService {
  private readonly logger = new Logger(ReportingJobsService.name);

  constructor(
    private readonly reporting: ReportingService,
    private readonly repo: ReportingRepository,
    private readonly queue: ReportingQueue,
    private readonly storage: ReportingStorage,
  ) {}

  async requestElectionReport(status?: ElectionStatus): Promise<ReportJob> {
    const jobId = randomUUID();
    const job = await this.repo.createJob(jobId, 'ELECTIONS_CSV', {
      status: status ?? null,
    });
    await this.queue.send(jobId);
    return job;
  }

  async getJob(jobId: string): Promise<ReportJob | null> {
    return this.repo.getJob(jobId);
  }

  async getDownloadUrl(jobId: string): Promise<string> {
    const job = await this.repo.getJob(jobId);
    if (!job || !job.s3Bucket || !job.s3Key) {
      throw new Error('Report artifact not available');
    }
    return this.storage.getDownloadUrl(job.s3Bucket, job.s3Key);
  }

  async processJob(jobId: string): Promise<void> {
    const job = await this.repo.getJob(jobId);
    if (!job) {
      this.logger.warn(`Job not found: ${jobId}`);
      return;
    }

    if (job.status === 'DONE') {
      return;
    }

    await this.repo.markRunning(jobId);

    try {
      const status = (job.params?.status as ElectionStatus | null) ?? undefined;
      const csv = await this.reporting.buildElectionSummaryCsv(status);
      const stored = await this.storage.storeCsv(jobId, csv);
      await this.repo.markDone(jobId, stored.bucket, stored.key);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await this.repo.markFailed(jobId, message);
    }
  }
}
