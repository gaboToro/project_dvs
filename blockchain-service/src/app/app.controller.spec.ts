// test unitario / unit test
import { Test } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Suite: AppController - agrupa pruebas relacionadas / Suite: AppController - grouping of related tests
describe('AppController', () => {
  let controller: AppController;

  const serviceMock = {
    health: jest.fn().mockReturnValue({ status: 'ok', service: 'blockchain-service' }),
  };

  // Preparacion (beforeAll) - prepara el estado y los mocks / Setup (beforeAll) - prepare test state and mocks
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: serviceMock }],
    }).compile();

    controller = moduleRef.get(AppController);
  });

  // Caso de prueba: GET /chain/health should return health payload - comportamiento esperado bajo condiciones especificas / Test case: GET /chain/health should return health payload - expected behavior under specific conditions
  it('GET /chain/health should return health payload', () => {
    expect(controller.health()).toEqual({ status: 'ok', service: 'blockchain-service' });
  });
});
