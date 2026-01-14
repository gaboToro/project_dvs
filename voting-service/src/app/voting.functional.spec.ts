import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { query } from './db/postgres';

jest.mock('./mq/kafka.producer', () => ({
  publishVoteCast: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('./db/postgres', () => ({
  query: jest.fn(),
}));

describe('VotingService functional', () => {
  let app: INestApplication;
  let baseUrl: string;
  let jwt: JwtService;
  const httpMock = {
    post: jest.fn(),
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.VOTER_HASH_SECRET = 'test-hash';
    (query as jest.Mock).mockReset();
    (query as jest.Mock).mockImplementation((text: string) => {
      if (text.includes('SELECT id FROM votes')) return [];
      if (text.includes('INSERT INTO votes')) return [{ id: 'vote-1', cast_at: new Date() }];
      return [];
    });
    httpMock.post
      .mockReturnValueOnce(of({ data: { ok: true } }))
      .mockReturnValueOnce(of({ data: { ok: true } }));
    const { AppModule } = require('./app.module');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HttpService)
      .useValue(httpMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    jwt = moduleRef.get(JwtService);
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

  it('casts a vote when blockchain accepts it', async () => {
    const token = await jwt.signAsync({ sub: 'voter-001', roles: ['voter'] });
    const res = await fetch(`${baseUrl}/api/votes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ electionId: 'e1', candidateId: 'c1' }),
    });

    expect(res.ok).toBe(true);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});
