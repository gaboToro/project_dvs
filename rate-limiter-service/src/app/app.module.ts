import { Module } from '@nestjs/common';
import { RateLimitController } from './ratelimit.controller';
import { RateLimitService } from './ratelimit.service';

@Module({
  imports: [],
  controllers: [RateLimitController],
  providers: [RateLimitService],
})
export class AppModule {}
