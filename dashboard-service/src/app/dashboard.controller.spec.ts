import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  const dashboardMock = {
    getResults: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: dashboardMock,
        },
      ],
    }).compile();

    controller = moduleRef.get(DashboardController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns health payload', () => {
    expect(controller.health()).toEqual({ status: 'ok', service: 'dashboard-service' });
  });

  it('returns results when Mongo has data', async () => {
    dashboardMock.getResults.mockResolvedValue({
      electionId: 'e1',
      results: { c1: 2 },
      lastUpdatedAt: new Date('2026-01-01T00:00:00Z'),
    });

    const res = await controller.byElection('e1');

    expect(dashboardMock.getResults).toHaveBeenCalledWith('e1');
    expect(res).toEqual({
      electionId: 'e1',
      results: { c1: 2 },
      lastUpdatedAt: new Date('2026-01-01T00:00:00Z'),
    });
  });

  it('throws NotFound when there are no results', async () => {
    dashboardMock.getResults.mockResolvedValue(null);

    await expect(controller.byElection('e1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
