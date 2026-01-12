import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';

describe('user-service e2e', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const { AppModule } = require('@org/user-service');

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

  it('returns health payload', async () => {
    const res = await fetch(`${baseUrl}/api/users/health`);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ status: 'ok', service: 'user-service' });
  });
});
