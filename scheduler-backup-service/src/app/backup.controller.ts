import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { createHealthPayload } from '@org/contracts';
import { BackupService } from './backup.service';

@Controller('backup')
export class BackupController {
  constructor(private readonly backups: BackupService) {}

  @Get('health')
  health() {
    return createHealthPayload('scheduler-backup-service');
  }

  @Get('last')
  last() {
    return this.backups.getLastResult();
  }

  @Post('run')
  async run(
    @Headers('x-internal-token') token: string | undefined,
    @Body() body: { reason?: string } = {},
  ) {
    const expected = process.env.INTERNAL_SERVICE_TOKEN;
    if (expected && token !== expected) {
      throw new UnauthorizedException('Invalid internal token');
    }
    return this.backups.runBackup(body.reason ?? 'manual');
  }
}


