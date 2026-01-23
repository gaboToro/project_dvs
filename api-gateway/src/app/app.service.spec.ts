// test unitario / unit test
import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

// Suite: AppService - agrupa pruebas relacionadas / Suite: AppService - grouping of related tests
describe('AppService', () => {
  let service: AppService;

  // Preparacion (beforeEach) - prepara el estado y los mocks / Setup (beforeEach) - prepare test state and mocks
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  // Caso de prueba: should return health status - comportamiento esperado bajo condiciones especificas / Test case: should return health status - expected behavior under specific conditions
  it('should return health status', () => {
    expect(service.getHealth()).toEqual({ 
      status: 'ok', 
      service: 'api-gateway' 
    });
  });
});