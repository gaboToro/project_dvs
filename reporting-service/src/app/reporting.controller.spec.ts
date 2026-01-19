// test unitario / unit test
import { Test } from '@nestjs/testing';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { ReportingJobsService } from './reporting.jobs.service';

// Suite: ReportingController - agrupa pruebas relacionadas / Suite: ReportingController - grouping of related tests
describe('ReportingController', () => {
  let controller: ReportingController;
  const reportingMock = {
    buildElectionSummaryCsv: jest.fn().mockResolvedValue('csv-data'),
  };
  const jobsMock = {
    requestElectionReport: jest.fn(),
    getJob: jest.fn(),
    getDownloadUrl: jest.fn(),
  };

  // Preparacion (beforeAll) - prepara el estado y los mocks / Setup (beforeAll) - prepare test state and mocks
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ReportingController],
      providers: [
        {
          provide: ReportingService,
          useValue: reportingMock,
        },
        {
          provide: ReportingJobsService,
          useValue: jobsMock,
        },
      ],
    }).compile();

    controller = moduleRef.get(ReportingController);
  });

  // Preparacion (beforeEach) - prepara el estado y los mocks / Setup (beforeEach) - prepare test state and mocks
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Caso de prueba: returns health payload - comportamiento esperado bajo condiciones especificas / Test case: returns health payload - expected behavior under specific conditions
  it('returns health payload', () => {
    expect(controller.health()).toEqual({ status: 'ok', service: 'reporting-service' });
  });

  // Caso de prueba: returns csv response - comportamiento esperado bajo condiciones especificas / Test case: returns csv response - expected behavior under specific conditions
  it('returns csv response', async () => {
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as any;

    await controller.electionsCsv(res, 'OPEN');

    expect(reportingMock.buildElectionSummaryCsv).toHaveBeenCalledWith('OPEN');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="election-summary.csv"',
    );
    expect(res.send).toHaveBeenCalledWith('csv-data');
  });
});
