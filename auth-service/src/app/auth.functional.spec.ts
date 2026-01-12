import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';

describe('AuthService functional', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const { AppModule } = require('./app.module');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.listen(0);

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
    const res = await fetch(`${baseUrl}/api/auth/health`);
    const body = (await res.json()) as { status: string; service: string };

    expect(res.status).toBe(200);
    expect(body).toEqual({ status: 'ok', service: 'auth-service' });
  });

  it('logs in with admin credentials', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });

    expect(res.ok).toBe(true);
    const body = (await res.json()) as { accessToken: string; tokenType: string };
    expect(body.accessToken).toBeTruthy();
    expect(body.tokenType).toBe('Bearer');
  });
});
