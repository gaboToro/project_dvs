// test e2e / e2e test
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';

const builder: any = {
  select: jest.fn(() => builder),
  eq: jest.fn(() => builder),
  order: jest.fn(() => builder),
  limit: jest.fn(() => builder),
  insert: jest.fn(() => builder),
  update: jest.fn(() => builder),
  delete: jest.fn(() => builder),
  single: jest.fn(async () => ({ data: null, error: null })),
  then: (resolve: any) => resolve({ data: [], error: null }),
};

const mockSupabase = {
  from: jest.fn(() => builder),
};

jest.mock('../../../election-service/src/app/supabase.client', () => ({
  getSupabaseAdmin: () => mockSupabase,
}));

const { AppModule } = require('@org/election-service');

// Suite: election-service e2e - agrupa pruebas relacionadas / Suite: election-service e2e - grouping of related tests
describe('election-service e2e', () => {
  let app: INestApplication;
  let baseUrl: string;

  // Preparacion (beforeAll) - prepara el estado y los mocks / Setup (beforeAll) - prepare test state and mocks
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';

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

  // Caso de prueba: returns health payload - comportamiento esperado bajo condiciones especificas / Test case: returns health payload - expected behavior under specific conditions
  it('returns health payload', async () => {
    const res = await fetch(`${baseUrl}/api/elections/health`);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ status: 'ok', service: 'election-service' });
  });
});
