import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { ReportingService } from './reporting.service';

describe('ReportingService functional', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ReportingService)
      .useValue({
        buildElectionSummaryCsv: jest.fn().mockResolvedValue('a,b\n1,2'),
      })
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

  it('returns CSV output', async () => {
    const res = await fetch(`${baseUrl}/api/reports/elections.csv`);
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(body).toBe('a,b\n1,2');
  });
});
