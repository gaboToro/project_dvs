import { Test } from '@nestjs/testing';
import { ResultsController } from './results.controller';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';

describe('ResultsController', () => {
  let controller: ResultsController;

  const httpMock = {
    get: jest.fn(),
  };

  beforeAll(async () => {
    process.env.BLOCKCHAIN_SERVICE_URL = 'http://localhost:3003';

    const moduleRef = await Test.createTestingModule({
      controllers: [ResultsController],
      providers: [{ provide: HttpService, useValue: httpMock }],
    }).compile();

    controller = moduleRef.get(ResultsController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty results when chain is empty', async () => {
    httpMock.get.mockReturnValueOnce(of({ data: [] }));

    const res = await controller.byElection('e1');

    expect(httpMock.get).toHaveBeenCalledWith(
      'http://localhost:3003/api/chain',
    );

    expect(res).toEqual({
      electionId: 'e1',
      totalVotes: 0,
      results: {},
    });
  });

  it('should ignore genesis block (index 0) and count votes for the electionId', async () => {
    const chain = [
      // génesis (se ignora)
      { index: 0, data: { electionId: 'e1', candidateId: 'c1' } },

      // votos de e1
      { index: 1, data: { electionId: 'e1', candidateId: 'c1' } },
      { index: 2, data: { electionId: 'e1', candidateId: 'c2' } },
      { index: 3, data: { electionId: 'e1', candidateId: 'c1' } },

      // voto de otra elección (se ignora)
      { index: 4, data: { electionId: 'e2', candidateId: 'c9' } },
    ];

    httpMock.get.mockReturnValueOnce(of({ data: chain }));

    const res = await controller.byElection('e1');

    expect(res).toEqual({
      electionId: 'e1',
      totalVotes: 3,
      results: { c1: 2, c2: 1 },
    });
  });

  it('should handle missing data field safely (treat as empty chain)', async () => {
    httpMock.get.mockReturnValueOnce(of({}));

    const res = await controller.byElection('e1');

    expect(res).toEqual({
      electionId: 'e1',
      totalVotes: 0,
      results: {},
    });
  });

  it('should throw if blockchain service fails', async () => {
    httpMock.get.mockReturnValueOnce(
      throwError(() => new Error('ECONNREFUSED')),
    );

    await expect(controller.byElection('e1')).rejects.toThrow(
      'ECONNREFUSED',
    );
  });
});