import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';

@Module({
  imports: [HttpModule],
  controllers: [ReportingController],
  providers: [ReportingService],
})
export class AppModule {}
