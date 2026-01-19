import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { ReportingJobsService } from './reporting.jobs.service';
import { ReportingRepository } from './reporting.repository';
import { ReportingQueue } from './reporting.queue';
import { ReportingStorage } from './reporting.storage';
import { ReportingWorker } from './reporting.worker';

@Module({
  imports: [HttpModule],
  controllers: [ReportingController],
  providers: [
    ReportingService,
    ReportingJobsService,
    ReportingRepository,
    ReportingQueue,
    ReportingStorage,
    ReportingWorker,
  ],
})
export class AppModule {}
