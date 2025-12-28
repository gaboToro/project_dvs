import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlockchainController } from './blockchain.controller';
import { BlockchainService } from './blockchain.service';

@Module({
  imports: [],
  controllers: [AppController, BlockchainController],
  providers: [AppService, BlockchainService],
})
export class AppModule {}
