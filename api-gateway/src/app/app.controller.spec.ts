// test unitario / unit test
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtService } from '@nestjs/jwt';

// Suite: AppController - agrupa pruebas relacionadas / Suite: AppController - grouping of related tests
describe('AppController', () => {
  let controller: AppController;
  let jwtService: JwtService;

  // Mock del JwtService
  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  // Preparacion (beforeAll) - prepara el estado y los mocks / Setup (beforeAll) - prepare test state and mocks
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    jwtService = module.get<JwtService>(JwtService);
  });

  // Suite: health - agrupa pruebas relacionadas / Suite: health - grouping of related tests
  describe('health', () => {
    // Caso de prueba: should return health status - comportamiento esperado bajo condiciones especificas / Test case: should return health status - expected behavior under specific conditions
    it('should return health status', () => {
      expect(controller.health()).toEqual({ 
        status: 'ok', 
        service: 'api-gateway' 
      });
    });
  });

  // Suite: me - agrupa pruebas relacionadas / Suite: me - grouping of related tests
  describe('me', () => {
    // Caso de prueba: should return user payload for valid token - comportamiento esperado bajo condiciones especificas / Test case: should return user payload for valid token - expected behavior under specific conditions
    it('should return user payload for valid token', async () => {
      const mockPayload = { sub: '123', email: 'test@test.com' };
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      const result = await controller.me('Bearer valid-token');

      expect(result).toEqual({ ok: true, user: mockPayload });
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', expect.any(Object));
    });

    // Caso de prueba: should throw UnauthorizedException if no token provided - comportamiento esperado bajo condiciones especificas / Test case: should throw UnauthorizedException if no token provided - expected behavior under specific conditions
    it('should throw UnauthorizedException if no token provided', async () => {
      await expect(controller.me('')).rejects.toThrow('Missing Bearer token');
    });
  });
});