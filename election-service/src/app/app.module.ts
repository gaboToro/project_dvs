import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { ElectionController } from './election.controller';
import { ElectionScheduler } from './election.scheduler';
import { ElectionService } from './election.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'super-secret-key-for-dev-only',
      signOptions: { expiresIn: '1h' },
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [ElectionController],
  providers: [ElectionService, ElectionScheduler],
})
export class AppModule {}
