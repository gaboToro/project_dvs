// test funcional / functional test
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { getMongoDb } from './db/mongo';

jest.mock('./db/mongo', () => ({
  getMongoDb: jest.fn(),
}));

// Suite: ResultsService functional - agrupa pruebas relacionadas / Suite: ResultsService functional - grouping of related tests
describe('ResultsService functional', () => {
  let app: INestApplication;
  let baseUrl: string;
  const getMongoDbMock = getMongoDb as jest.Mock;

  // Preparacion (beforeAll) - prepara el estado y los mocks / Setup (beforeAll) - prepare test state and mocks
  beforeAll(async () => {
    const collection = {
      findOne: jest.fn().mockResolvedValue({
        electionId: 'e1',
        results: { c1: 1 },
        lastUpdatedAt: new Date('2026-01-01T00:00:00Z'),
      }),
    };

    getMongoDbMock.mockResolvedValue({
      collection: jest.fn().mockReturnValue(collection),
    });

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

  // Limpieza (afterAll) - limpia el estado y los mocks / Teardown (afterAll) - cleanup state and mocks
  afterAll(async () => {
    await app.close();
  });

  // Caso de prueba: returns results from Mongo - comportamiento esperado bajo condiciones especificas / Test case: returns results from Mongo - expected behavior under specific conditions
  it('returns results from Mongo', async () => {
    const res = await fetch(`${baseUrl}/api/results/e1`);
    const body = (await res.json()) as {
      electionId: string;
      results: Record<string, number>;
    };

    expect(res.status).toBe(200);
    expect(body.electionId).toBe('e1');
    expect(body.results).toEqual({ c1: 1 });
  });
});
