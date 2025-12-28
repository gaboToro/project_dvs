import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VotingController } from './voting.controller';

@Module({
  imports: [
    HttpModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET!,
    }),
  ],
  controllers: [AppController, VotingController],
  providers: [AppService],
})
export class AppModule {}