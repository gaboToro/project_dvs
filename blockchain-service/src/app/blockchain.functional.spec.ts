import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';

describe('BlockchainService functional', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
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

  it('adds and verifies chain', async () => {
    const addRes = await fetch(`${baseUrl}/api/chain/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voterId: 'v1',
        electionId: 'e1',
        candidateId: 'c1',
        timestamp: Date.now(),
      }),
    });

    expect(addRes.ok).toBe(true);

    const verifyRes = await fetch(`${baseUrl}/api/chain/verify`);
    const body = (await verifyRes.json()) as { valid: boolean };
    expect(body.valid).toBe(true);
  });
});
