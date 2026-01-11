import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ResultsController } from './results.controller';
import { getMongoDb } from './db/mongo';

jest.mock('./db/mongo', () => ({
  getMongoDb: jest.fn(),
}));

describe('ResultsController', () => {
  let controller: ResultsController;
  const getMongoDbMock = getMongoDb as jest.Mock;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ResultsController],
    }).compile();

    controller = moduleRef.get(ResultsController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns health payload', () => {
    expect(controller.health()).toEqual({ status: 'ok', service: 'results-service' });
  });

  it('returns results when Mongo has data', async () => {
    const collection = {
      findOne: jest.fn().mockResolvedValue({
        electionId: 'e1',
        results: { c1: 2 },
        lastUpdatedAt: new Date('2026-01-01T00:00:00Z'),
      }),
    };

    getMongoDbMock.mockResolvedValue({
      collection: jest.fn().mockReturnValue(collection),
    });

    const res = await controller.byElection('e1');

    expect(collection.findOne).toHaveBeenCalledWith({ electionId: 'e1' });
    expect(res).toEqual({
      electionId: 'e1',
      results: { c1: 2 },
      lastUpdatedAt: new Date('2026-01-01T00:00:00Z'),
    });
  });

  it('throws NotFound when there are no results', async () => {
    const collection = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    getMongoDbMock.mockResolvedValue({
      collection: jest.fn().mockReturnValue(collection),
    });

    await expect(controller.byElection('e1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
