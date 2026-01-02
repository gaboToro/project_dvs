import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { JwtService } from '@nestjs/jwt';

describe('AuthController', () => {
  let controller: AuthController;

  const jwtMock = {
    signAsync: jest.fn().mockResolvedValue('test.jwt.token'),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: JwtService, useValue: jwtMock }],
    }).compile();

    controller = moduleRef.get(AuthController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /auth/health should return ok payload', () => {
    expect(controller.health()).toEqual({ status: 'ok', service: 'auth-service' });
  });

  it('POST /auth/login should reject invalid credentials', async () => {
    await expect(
      controller.login({ username: 'x', password: 'y' } as any),
    ).rejects.toHaveProperty('status', 401);
  });

  it('POST /auth/login should return access token for valid credentials', async () => {
    const res = await controller.login({ username: 'admin', password: 'admin123' } as any);

    expect(jwtMock.signAsync).toHaveBeenCalledWith({
      sub: 'admin',
      roles: ['admin'],
    });

    expect(res).toEqual({
      accessToken: 'test.jwt.token',
      tokenType: 'Bearer',
    });
  });
});
