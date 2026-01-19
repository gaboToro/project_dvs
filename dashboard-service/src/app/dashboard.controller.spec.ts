// test unitario / unit test
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

// Suite: DashboardController - agrupa pruebas relacionadas / Suite: DashboardController - grouping of related tests
describe('DashboardController', () => {
  let controller: DashboardController;
  const dashboardMock = {
    getResults: jest.fn(),
  };

  // Preparacion (beforeAll) - prepara el estado y los mocks / Setup (beforeAll) - prepare test state and mocks
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

  // Preparacion (beforeEach) - prepara el estado y los mocks / Setup (beforeEach) - prepare test state and mocks
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Caso de prueba: returns health payload - comportamiento esperado bajo condiciones especificas / Test case: returns health payload - expected behavior under specific conditions
  it('returns health payload', () => {
    expect(controller.health()).toEqual({ status: 'ok', service: 'dashboard-service' });
  });

  // Caso de prueba: returns results when Mongo has data - comportamiento esperado bajo condiciones especificas / Test case: returns results when Mongo has data - expected behavior under specific conditions
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

  // Caso de prueba: throws NotFound when there are no results - comportamiento esperado bajo condiciones especificas / Test case: throws NotFound when there are no results - expected behavior under specific conditions
  it('throws NotFound when there are no results', async () => {
    dashboardMock.getResults.mockResolvedValue(null);

    await expect(controller.byElection('e1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
