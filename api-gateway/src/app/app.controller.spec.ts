import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtService } from '@nestjs/jwt';

describe('AppController', () => {
  let controller: AppController;
  let jwtService: JwtService;

  // Mock del JwtService
  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

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

  describe('health', () => {
    it('should return health status', () => {
      expect(controller.health()).toEqual({ 
        status: 'ok', 
        service: 'api-gateway' 
      });
    });
  });

  describe('me', () => {
    it('should return user payload for valid token', async () => {
      const mockPayload = { sub: '123', email: 'test@test.com' };
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      const result = await controller.me('Bearer valid-token');

      expect(result).toEqual({ ok: true, user: mockPayload });
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', expect.any(Object));
    });

    it('should throw UnauthorizedException if no token provided', async () => {
      await expect(controller.me('')).rejects.toThrow('Missing Bearer token');
    });
  });
});