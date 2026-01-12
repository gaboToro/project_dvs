import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ElectionService } from './election.service';

@Injectable()
export class ElectionScheduler {
  private readonly logger = new Logger(ElectionScheduler.name);

  constructor(private readonly electionService: ElectionService) {}

  @Cron(CronExpression.EVERY_SECOND)
  async syncElectionStatus() {
    try {
      const result = await this.electionService.syncElectionWindows();
      if (result.closedCount > 0 || result.openedId) {
        this.logger.log(
          `Auto-sync complete: closed=${result.closedCount}, opened=${result.openedId ?? 'none'}`,
        );
      }
    } catch (error: any) {
      const message = error?.message ?? 'unknown error';
      this.logger.warn(`Auto-sync failed: ${message}`);
    }
  }
}
