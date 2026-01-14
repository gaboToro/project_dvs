import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { authProxy, votingProxy, blockchainProxy, resultsProxy, usersProxy, electionProxy, auditProxy } from './app/proxy.middleware';
import { rateLimitMiddleware } from './app/rate-limit.middleware';
import { createAuditMiddleware } from './app/audit.middleware';
import { JwtService } from '@nestjs/jwt';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //const globalPrefix = 'api';

  app.enableCors({
    origin: ['http://localhost:8081', 'http://localhost:19006', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const jwt = app.get(JwtService);
  app.use(createAuditMiddleware(jwt));
  app.use(rateLimitMiddleware);
  app.use('/api/auth', authProxy);
  app.use('/api/votes', votingProxy);
  app.use('/api/chain', blockchainProxy);
  app.use('/api/results', resultsProxy);
  app.use('/api/users', usersProxy);
  app.use('/api/elections', electionProxy);
  app.use('/api/audit', auditProxy);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}`
  );
}

bootstrap();
