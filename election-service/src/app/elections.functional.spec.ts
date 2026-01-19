// test funcional / functional test
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';

const builder: any = {};
let listData: any[] = [];

Object.assign(builder, {
  select: jest.fn(() => builder),
  eq: jest.fn(() => builder),
  order: jest.fn(() => builder),
  limit: jest.fn(() => builder),
  insert: jest.fn(() => builder),
  update: jest.fn(() => builder),
  delete: jest.fn(() => builder),
  single: jest.fn(async () => ({ data: null, error: null })),
  then: (resolve: any) => resolve({ data: listData, error: null }),
});

const mockSupabase = {
  from: jest.fn(() => builder),
};

jest.mock('./supabase.client', () => ({
  getSupabaseAdmin: () => mockSupabase,
}));

const { AppModule } = require('./app.module');

// Suite: ElectionService functional - agrupa pruebas relacionadas / Suite: ElectionService functional - grouping of related tests
describe('ElectionService functional', () => {
  let app: INestApplication;
  let baseUrl: string;

  // Preparacion (beforeAll) - prepara el estado y los mocks / Setup (beforeAll) - prepare test state and mocks
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';

    listData = [
      {
        id: 'e1',
        title: 'Demo',
        description: null,
        starts_at: '2026-01-01T00:00:00Z',
        ends_at: '2026-01-02T00:00:00Z',
        status: 'OPEN',
        created_at: '2026-01-01T00:00:00Z',
      },
    ];

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

  // Caso de prueba: responds to health - comportamiento esperado bajo condiciones especificas / Test case: responds to health - expected behavior under specific conditions
  it('responds to health', async () => {
    const res = await fetch(`${baseUrl}/api/elections/health`);
    const body = (await res.json()) as { status: string; service: string };

    expect(res.status).toBe(200);
    expect(body).toEqual({ status: 'ok', service: 'election-service' });
  });

  // Caso de prueba: lists elections - comportamiento esperado bajo condiciones especificas / Test case: lists elections - expected behavior under specific conditions
  it('lists elections', async () => {
    const res = await fetch(`${baseUrl}/api/elections`);
    const body = (await res.json()) as Array<{ id: string; status: string }>;

    expect(res.status).toBe(200);
    expect(body.length).toBe(1);
    expect(body[0].id).toBe('e1');
    expect(body[0].status).toBe('OPEN');
  });
});
