// test unitario / unit test
import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';

// Suite: AuthController - agrupa pruebas relacionadas / Suite: AuthController - grouping of related tests
describe('AuthController', () => {
  let controller: AuthController;

  const jwtMock = {
    signAsync: jest.fn().mockResolvedValue('test.jwt.token'),
  };
  const httpMock = {
    post: jest.fn(),
  };

  // Preparacion (beforeAll) - prepara el estado y los mocks / Setup (beforeAll) - prepare test state and mocks
  beforeAll(async () => {
    process.env.INTERNAL_SERVICE_TOKEN = 'test-token';
    process.env.AUDIT_LOG_SERVICE_URL = 'http://audit:3007';
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: JwtService, useValue: jwtMock },
        { provide: HttpService, useValue: httpMock },
      ],
    }).compile();

    controller = moduleRef.get(AuthController);
  });

  // Preparacion (beforeEach) - prepara el estado y los mocks / Setup (beforeEach) - prepare test state and mocks
  beforeEach(() => {
    jest.clearAllMocks();
    httpMock.post.mockReset();
  });

  // Caso de prueba: GET /auth/health should return ok payload - comportamiento esperado bajo condiciones especificas / Test case: GET /auth/health should return ok payload - expected behavior under specific conditions
  it('GET /auth/health should return ok payload', () => {
    expect(controller.health()).toEqual({ status: 'ok', service: 'auth-service' });
  });

  // Caso de prueba: POST /auth/login should reject invalid credentials - comportamiento esperado bajo condiciones especificas / Test case: POST /auth/login should reject invalid credentials - expected behavior under specific conditions
  it('POST /auth/login should reject invalid credentials', async () => {
    httpMock.post.mockReturnValueOnce(
      throwError(() => ({ response: { status: 401 } })),
    );
    await expect(
      controller.login({ username: 'x', password: 'y' } as any),
    ).rejects.toHaveProperty('status', 401);
  });

  // Caso de prueba: POST /auth/login should return access token for valid credentials - comportamiento esperado bajo condiciones especificas / Test case: POST /auth/login should return access token for valid credentials - expected behavior under specific conditions
  it('POST /auth/login should return access token for valid credentials', async () => {
    httpMock.post
      .mockReturnValueOnce(of({ data: { id: 'admin-id', role: 'admin' } }))
      .mockReturnValueOnce(of({ data: { ok: true } }));
    const res = await controller.login({ username: 'admin', password: 'admin123' } as any);

    expect(jwtMock.signAsync).toHaveBeenCalledWith(
      {
        sub: 'admin-id',
        roles: ['admin'],
      },
      { expiresIn: '5m' },
    );

    expect(res).toEqual({
      accessToken: 'test.jwt.token',
      tokenType: 'Bearer',
    });
  });
});
