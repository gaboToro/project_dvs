import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'dashboard-service' };
  }

  @Get(':electionId')
  async byElection(@Param('electionId') electionId: string) {
    const doc = await this.dashboard.getResults(electionId);
    if (!doc) throw new NotFoundException('No results for this election');
    return doc;
  }
}
