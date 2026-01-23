// test funcional / functional test
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

// Suite: VotingService functional - agrupa pruebas relacionadas / Suite: VotingService functional - grouping of related tests
describe('VotingService functional', () => {
  let app: INestApplication;
  let baseUrl: string;
  let jwt: JwtService;
  const httpMock = {
    post: jest.fn(),
    get: jest.fn(),
  };

  // Preparacion (beforeAll) - prepara el estado y los mocks / Setup (beforeAll) - prepare test state and mocks
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.VOTER_HASH_SECRET = 'test-hash';
    (query as jest.Mock).mockReset();
    (query as jest.Mock).mockImplementation((text: string) => {
      if (text.includes('SELECT id FROM votes')) return [];
      if (text.includes('SELECT full_name, email FROM users')) {
        return [{ full_name: 'Voter Demo', email: 'voter@example.com' }];
      }
      if (text.includes('INSERT INTO votes')) return [{ id: 'vote-1', cast_at: new Date() }];
      return [];
    });
    httpMock.get.mockReturnValue(
      of({
        data: {
          id: 'e1',
          title: 'Election 1',
          startsAt: '2026-01-01T00:00:00Z',
          endsAt: '2026-01-02T00:00:00Z',
          status: 'OPEN',
          candidates: [{ id: 'c1', electionId: 'e1', name: 'Candidate 1' }],
        },
      }),
    );
    httpMock.post.mockReturnValue(of({ data: { ok: true } }));
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

  // Limpieza (afterAll) - limpia el estado y los mocks / Teardown (afterAll) - cleanup state and mocks
  afterAll(async () => {
    await app.close();
  });

  // Caso de prueba: casts a vote when blockchain accepts it - comportamiento esperado bajo condiciones especificas / Test case: casts a vote when blockchain accepts it - expected behavior under specific conditions
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
