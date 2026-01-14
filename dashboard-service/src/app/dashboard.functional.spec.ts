import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { DashboardService } from './dashboard.service';

describe('DashboardService functional', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const dashboardMock = {
      getResults: jest.fn().mockResolvedValue({
        electionId: 'e1',
        results: { c1: 1 },
        lastUpdatedAt: new Date('2026-01-01T00:00:00Z'),
      }),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DashboardService)
      .useValue(dashboardMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.listen(0);

    const address = app.getHttpServer().address();
    if (!address || typeof address === 'string') {
      throw new Error('Failed to bind test server');
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns results from Mongo', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/e1`);
    const body = (await res.json()) as {
      electionId: string;
      results: Record<string, number>;
    };

    expect(res.status).toBe(200);
    expect(body.electionId).toBe('e1');
    expect(body.results).toEqual({ c1: 1 });
  });
});
