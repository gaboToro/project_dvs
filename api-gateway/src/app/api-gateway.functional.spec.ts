import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

describe('api-gateway functional', () => {
  let app: INestApplication;
  let baseUrl: string;
  let jwt: JwtService;

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

  afterAll(async () => {
    await app.close();
  });

  it('responds to health', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const body = (await res.json()) as { status: string; service: string };

    expect(res.status).toBe(200);
    expect(body).toEqual({ status: 'ok', service: 'api-gateway' });
  });

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
