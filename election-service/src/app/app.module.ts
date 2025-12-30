import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ElectionController } from './election.controller';
import { ElectionService } from './election.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'super-secret-key-for-dev-only',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [ElectionController],
  providers: [ElectionService],
})
export class AppModule {}