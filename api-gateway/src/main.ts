import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { authProxy, votingProxy, blockchainProxy, resultsProxy, usersProxy, electionProxy } from './app/proxy.middleware';
import { rateLimitMiddleware } from './app/rate-limit.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //const globalPrefix = 'api';

  app.enableCors({
    origin: ['http://localhost:8081', 'http://localhost:19006', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(rateLimitMiddleware);
  app.use('/api/auth', authProxy);
  app.use('/api/votes', votingProxy);
  app.use('/api/chain', blockchainProxy);
  app.use('/api/results', resultsProxy);
  app.use('/api/users', usersProxy);
  app.use('/api/elections', electionProxy);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}`
  );
}

bootstrap();
