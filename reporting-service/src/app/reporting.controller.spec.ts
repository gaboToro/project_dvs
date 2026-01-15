import { Test } from '@nestjs/testing';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';

describe('ReportingController', () => {
  let controller: ReportingController;
  const reportingMock = {
    buildElectionSummaryCsv: jest.fn().mockResolvedValue('csv-data'),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ReportingController],
      providers: [
        {
          provide: ReportingService,
          useValue: reportingMock,
        },
      ],
    }).compile();

    controller = moduleRef.get(ReportingController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns health payload', () => {
    expect(controller.health()).toEqual({ status: 'ok', service: 'reporting-service' });
  });

  it('returns csv response', async () => {
    const res: { setHeader: jest.Mock; send: jest.Mock } = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

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
