// test funcional / functional test
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { UserDto } from '@org/contracts';
import { query } from './db/postgres';

jest.mock('./db/postgres', () => ({
  query: jest.fn(),
}));

// Suite: UserService functional - agrupa pruebas relacionadas / Suite: UserService functional - grouping of related tests
describe('UserService functional', () => {
  let app: INestApplication;
  let baseUrl: string;
  let jwt: JwtService;

  // Preparacion (beforeAll) - prepara el estado y los mocks / Setup (beforeAll) - prepare test state and mocks
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    (query as jest.Mock).mockResolvedValue([
      {
        id: 'u1',
        username: 'admin',
        full_name: 'Administrador',
        email: null,
        role: 'admin',
        enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
    const { AppModule } = require('./app.module');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

  // Caso de prueba: responds to health - comportamiento esperado bajo condiciones especificas / Test case: responds to health - expected behavior under specific conditions
  it('responds to health', async () => {
    const res = await fetch(`${baseUrl}/api/users/health`);
    const body = (await res.json()) as { status: string; service: string };

    expect(res.status).toBe(200);
    expect(body).toEqual({ status: 'ok', service: 'user-service' });
  });

  // Caso de prueba: lists users as admin - comportamiento esperado bajo condiciones especificas / Test case: lists users as admin - expected behavior under specific conditions
  it('lists users as admin', async () => {
    const token = await jwt.signAsync({ sub: 'admin', roles: ['admin'] });
    const res = await fetch(`${baseUrl}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as UserDto[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0]).toMatchObject({
      id: expect.any(String),
      username: expect.any(String),
      role: expect.any(String),
      enabled: expect.any(Boolean),
    });
  });
});
