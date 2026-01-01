import { Test } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;

  const serviceMock = {
    health: jest.fn().mockReturnValue({ status: 'ok', service: 'voting-service' }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: serviceMock }],
    }).compile();

    controller = moduleRef.get(AppController);
  });

  it('GET /votes/health should return health payload', () => {
    expect(controller.health()).toEqual({ status: 'ok', service: 'voting-service' });
  });
});