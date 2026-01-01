import { Test } from '@nestjs/testing';
import { ResultsService } from './results.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('ResultsService', () => {
  let service: ResultsService;
  let http: HttpService;

  const httpMock = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ResultsService,
        { provide: HttpService, useValue: httpMock },
      ],
    }).compile();

    service = module.get<ResultsService>(ResultsService);
    http = module.get<HttpService>(HttpService);
  });

  it('should correctly aggregate votes', async () => {
    const mockChain = {
      data: [
        { index: 0, data: { electionId: 'e1', candidateId: 'genesis' } }, // Génesis
        { index: 1, data: { electionId: 'e1', candidateId: 'c1' } },
        { index: 2, data: { electionId: 'e1', candidateId: 'c1' } },
        { index: 3, data: { electionId: 'e1', candidateId: 'c2' } },
      ]
    };

    httpMock.get.mockReturnValue(of(mockChain));

    const result = await service.getResultsByElection('e1');

    expect(result.totalVotes).toBe(3);
    expect(result.results).toEqual({ c1: 2, c2: 1 });
  });
});