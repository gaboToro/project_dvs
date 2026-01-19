// test funcional / functional test
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Suite: api-gateway functional - agrupa pruebas relacionadas / Suite: api-gateway functional - grouping of related tests
describe('api-gateway functional', () => {
  let app: INestApplication;
  let baseUrl: string;
  let jwt: JwtService;

  // Preparacion (beforeAll) - prepara el estado y los mocks / Setup (beforeAll) - prepare test state and mocks
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.RATE_LIMITER_ENABLED = 'false';
    const { AppModule } = require('./app.module');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.listen(0);

    jwt = moduleRef.get(JwtService);

    const address = app.getHttpServer().address();
    if (!address || typeof address === 'string') {
      throw new Error('Failed to bind test server');
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  // Limpieza (afterAll) - limpia el estado y los mocks / Teardown (afterAll) - cleanup state and mocks
  afterAll(async () => {
    await app.close();
  });

  // Caso de prueba: responds to health - comportamiento esperado bajo condiciones especificas / Test case: responds to health - expected behavior under specific conditions
  it('responds to health', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const body = (await res.json()) as { status: string; service: string };

    expect(res.status).toBe(200);
    expect(body).toEqual({ status: 'ok', service: 'api-gateway' });
  });

  // Caso de prueba: returns payload for /me with valid token - comportamiento esperado bajo condiciones especificas / Test case: returns payload for /me with valid token - expected behavior under specific conditions
  it('returns payload for /me with valid token', async () => {
    const token = await jwt.signAsync({ sub: 'admin', roles: ['admin'] });
    const res = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; user: { sub: string } };
    expect(body.ok).toBe(true);
    expect(body.user.sub).toBe('admin');
  });
});
