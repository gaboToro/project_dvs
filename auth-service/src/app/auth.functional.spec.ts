import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import http from 'http';

describe('AuthService functional', () => {
  let app: INestApplication;
  let baseUrl: string;
  let stubServer: http.Server;
  let stubUrl: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.INTERNAL_SERVICE_TOKEN = 'test-token';
    stubServer = http.createServer((req, res) => {
      if (req.method === 'POST' && req.url === '/api/users/validate') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          const auth = req.headers['x-internal-token'];
          if (auth !== 'test-token') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Forbidden' }));
            return;
          }
          const parsed = JSON.parse(body || '{}');
          if (parsed.username === 'admin' && parsed.password === 'admin123') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ id: 'admin-id', role: 'admin' }));
            return;
          }
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Unauthorized' }));
        });
        return;
      }
      res.writeHead(404);
      res.end();
    });

    await new Promise<void>((resolve) => {
      stubServer.listen(0, () => resolve());
    });
    const stubAddress = stubServer.address();
    if (!stubAddress || typeof stubAddress === 'string') {
      throw new Error('Failed to bind stub server');
    }
    stubUrl = `http://127.0.0.1:${stubAddress.port}`;
    process.env.USER_SERVICE_URL = stubUrl;

    const { AppModule } = require('./app.module');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.listen(0);

    const appAddress = app.getHttpServer().address();
    if (!appAddress || typeof appAddress === 'string') {
      throw new Error('Failed to bind test server');
    }
    baseUrl = `http://127.0.0.1:${appAddress.port}`;
  });

  afterAll(async () => {
    await app.close();
    await new Promise<void>((resolve) => stubServer.close(() => resolve()));
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
