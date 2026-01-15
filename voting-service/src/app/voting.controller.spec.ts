import { Test } from '@nestjs/testing';
import { VotingController } from './voting.controller';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { query } from './db/postgres';

jest.mock('./mq/kafka.producer', () => ({
  publishVoteCast: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('./db/postgres', () => ({
  query: jest.fn(),
}));

describe('VotingController', () => {
  let controller: VotingController;

  const jwtMock = {
    verifyAsync: jest.fn(),
  };

  const httpMock = {
    post: jest.fn(),
    get: jest.fn(),
  };

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.BLOCKCHAIN_SERVICE_URL = 'http://localhost:3003';
    process.env.VOTER_HASH_SECRET = 'test-hash';

    jwtMock.verifyAsync.mockResolvedValue({ sub: 'voter-1', roles: ['voter'] });
    httpMock.post.mockImplementation((url: string) => {
      if (url.includes('/api/chain/add')) {
        return of({ data: { ok: true, block: { hash: 'h', prevHash: 'p' } } });
      }
      return of({ data: { ok: true } });
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
    (query as jest.Mock).mockReset();
    (query as jest.Mock).mockImplementation((text: string) => {
      if (text.includes('SELECT id FROM votes')) return [];
      if (text.includes('SELECT full_name, email FROM users')) {
        return [{ full_name: 'Voter Demo', email: 'voter@example.com' }];
      }
      if (text.includes('INSERT INTO votes')) return [{ id: 'vote-1', cast_at: new Date() }];
      return [];
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [VotingController],
      providers: [
        { provide: JwtService, useValue: jwtMock },
        { provide: HttpService, useValue: httpMock },
      ],
    }).compile();

    controller = moduleRef.get(VotingController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should reject missing Bearer token', async () => {
    await expect(
      controller.castVote(undefined, undefined, { electionId: 'e1', candidateId: 'c1' } as any),
    ).rejects.toHaveProperty('status', 401);
  });

  it('should accept vote and anchor to blockchain', async () => {
    const res = await controller.castVote(
      'Bearer token',
      undefined,
      { electionId: 'e1', candidateId: 'c1' } as any,
    );

    expect(res.ok).toBe(true);
    expect(httpMock.get).toHaveBeenCalled();
    expect(httpMock.post).toHaveBeenCalled();
    expect(jwtMock.verifyAsync).toHaveBeenCalled();
  });

  it('should reject vote when blockchain is down', async () => {
    httpMock.post.mockImplementationOnce(
      throwError(() => Object.assign(new Error('ECONNREFUSED'), { code: 'ECONNREFUSED' })),
    );

    await expect(
      controller.castVote('Bearer token', undefined, { electionId: 'e1', candidateId: 'c1' } as any),
    ).rejects.toHaveProperty('status', 503);
  });
});
