import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { authProxy, votingProxy, blockchainProxy, resultsProxy } from './app/proxy.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //const globalPrefix = 'api';

  app.use('/api/auth', authProxy);
  app.use('/api/votes', votingProxy);
  app.use('/api/chain', blockchainProxy);
  app.use('/api/results', resultsProxy);

  //app.setGlobalPrefix(globalPrefix);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  Logger.log(
    //`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
    `🚀 Application is running on: http://localhost:${port}`
  );
}

bootstrap();
