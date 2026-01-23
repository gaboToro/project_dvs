import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardGateway } from './dashboard.gateway';
import { DashboardService } from './dashboard.service';
import { DashboardConsumer } from './mq/kafka.consumer';

@Module({
  controllers: [DashboardController],
  providers: [DashboardGateway, DashboardService, DashboardConsumer],
})
export class AppModule {}
