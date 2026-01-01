import { Test } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;

  const serviceMock = {
    health: jest.fn().mockReturnValue({ status: 'ok', service: 'blockchain-service' }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: serviceMock }],
    }).compile();

    controller = moduleRef.get(AppController);
  });

  it('GET /chain/health should return health payload', () => {
    expect(controller.health()).toEqual({ status: 'ok', service: 'blockchain-service' });
  });
});
