import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';

@Module({
  imports: [HttpModule],
  controllers: [ResultsController],
  providers: [ResultsService],
})
export class AppModule {}
