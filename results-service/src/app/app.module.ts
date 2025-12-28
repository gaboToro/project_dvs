import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResultsController } from './results.controller';

@Module({
  imports: [HttpModule],
  controllers: [AppController, ResultsController],
  providers: [AppService],
})
export class AppModule {}
