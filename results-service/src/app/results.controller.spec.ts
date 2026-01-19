// test unitario / unit test
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ResultsController } from './results.controller';
import { getMongoDb } from './db/mongo';

jest.mock('./db/mongo', () => ({
  getMongoDb: jest.fn(),
}));

// Suite: ResultsController - agrupa pruebas relacionadas / Suite: ResultsController - grouping of related tests
describe('ResultsController', () => {
  let controller: ResultsController;
  const getMongoDbMock = getMongoDb as jest.Mock;

  // Preparacion (beforeAll) - prepara el estado y los mocks / Setup (beforeAll) - prepare test state and mocks
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ResultsController],
    }).compile();

    controller = moduleRef.get(ResultsController);
  });

  // Preparacion (beforeEach) - prepara el estado y los mocks / Setup (beforeEach) - prepare test state and mocks
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Caso de prueba: returns health payload - comportamiento esperado bajo condiciones especificas / Test case: returns health payload - expected behavior under specific conditions
  it('returns health payload', () => {
    expect(controller.health()).toEqual({ status: 'ok', service: 'results-service' });
  });

  // Caso de prueba: returns results when Mongo has data - comportamiento esperado bajo condiciones especificas / Test case: returns results when Mongo has data - expected behavior under specific conditions
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

  // Caso de prueba: throws NotFound when there are no results - comportamiento esperado bajo condiciones especificas / Test case: throws NotFound when there are no results - expected behavior under specific conditions
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
