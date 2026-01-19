// test unitario / unit test
import { Test } from '@nestjs/testing';
import { AppService } from './app.service';

// Suite: AppService - agrupa pruebas relacionadas / Suite: AppService - grouping of related tests
describe('AppService', () => {
  let service: AppService;

  // Preparacion (beforeAll) - prepara el estado y los mocks / Setup (beforeAll) - prepare test state and mocks
  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  // Caso de prueba: should return health payload - comportamiento esperado bajo condiciones especificas / Test case: should return health payload - expected behavior under specific conditions
  it('should return health payload', () => {
    expect(service.health()).toEqual({ status: 'ok', service: 'voting-service' });
  });
});
