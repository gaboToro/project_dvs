// test unitario / unit test
import { Test } from '@nestjs/testing';
import { ElectionController } from './election.controller';
import { ElectionService } from './election.service';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';

// Suite: ElectionController (unit) - agrupa pruebas relacionadas / Suite: ElectionController (unit) - grouping of related tests
describe('ElectionController (unit)', () => {
  let controller: ElectionController;

  const serviceMock = {
    getActiveElection: jest.fn().mockResolvedValue({ id: 'e-active', status: 'OPEN' }),
    getElectionWithCandidates: jest.fn().mockResolvedValue({ id: 'e1', candidates: [] }),
    createElection: jest.fn().mockResolvedValue({ id: 'e1', status: 'DRAFT' }),
    updateElection: jest.fn().mockResolvedValue({ id: 'e1', status: 'DRAFT' }),
    openElection: jest.fn().mockResolvedValue({ id: 'e1', status: 'OPEN' }),
    closeElection: jest.fn().mockResolvedValue({ id: 'e1', status: 'CLOSED' }),
    addCandidate: jest.fn().mockResolvedValue({ id: 'c1', name: 'Cand' }),
    removeCandidate: jest.fn().mockResolvedValue({ ok: true }),
  };

  const jwtMock = {
    verifyAsync: jest.fn(),
  };
  const httpMock = {
    post: jest.fn(),
  };

  // Preparacion (beforeEach) - prepara el estado y los mocks / Setup (beforeEach) - prepare test state and mocks
  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';

    const moduleRef = await Test.createTestingModule({
      controllers: [ElectionController],
      providers: [
        { provide: ElectionService, useValue: serviceMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: HttpService, useValue: httpMock },
      ],
    }).compile();

    controller = moduleRef.get(ElectionController);

    jest.clearAllMocks();
    httpMock.post.mockReset();
  });

  // ---------- PUBLIC ----------
  // Caso de prueba: getActive should call service.getActiveElection - comportamiento esperado bajo condiciones especificas / Test case: getActive should call service.getActiveElection - expected behavior under specific conditions
  it('getActive should call service.getActiveElection', async () => {
    const res = await controller.getActive();
    expect(serviceMock.getActiveElection).toHaveBeenCalled();
    expect(res).toHaveProperty('id', 'e-active');
  });

  // Caso de prueba: getById should call service.getElectionWithCandidates - comportamiento esperado bajo condiciones especificas / Test case: getById should call service.getElectionWithCandidates - expected behavior under specific conditions
  it('getById should call service.getElectionWithCandidates', async () => {
    const res = await controller.getById('e1');
    expect(serviceMock.getElectionWithCandidates).toHaveBeenCalledWith('e1');
    expect(res).toHaveProperty('id', 'e1');
  });

  // ---------- ADMIN AUTH ----------
  // Caso de prueba: create should reject missing bearer token - comportamiento esperado bajo condiciones especificas / Test case: create should reject missing bearer token - expected behavior under specific conditions
  it('create should reject missing bearer token', async () => {
    await expect(controller.create(undefined, {} as any)).rejects.toHaveProperty('status', 401);
  });

  // Caso de prueba: create should reject non-admin role - comportamiento esperado bajo condiciones especificas / Test case: create should reject non-admin role - expected behavior under specific conditions
  it('create should reject non-admin role', async () => {
    jwtMock.verifyAsync.mockResolvedValue({ sub: 'u1', roles: ['voter'] });

    await expect(controller.create('Bearer token', {} as any)).rejects.toHaveProperty('status', 403);
  });

  // Caso de prueba: create should allow admin role - comportamiento esperado bajo condiciones especificas / Test case: create should allow admin role - expected behavior under specific conditions
  it('create should allow admin role', async () => {
    jwtMock.verifyAsync.mockResolvedValue({ sub: 'admin', roles: ['admin'] });

    const res = await controller.create('Bearer token', { title: 'Elec' } as any);

    expect(jwtMock.verifyAsync).toHaveBeenCalled();
    expect(serviceMock.createElection).toHaveBeenCalled();
    expect(res).toHaveProperty('id', 'e1');
  });

  // Caso de prueba: open should allow admin role - comportamiento esperado bajo condiciones especificas / Test case: open should allow admin role - expected behavior under specific conditions
  it('open should allow admin role', async () => {
    jwtMock.verifyAsync.mockResolvedValue({ sub: 'admin', roles: ['admin'] });

    const res = await controller.open('Bearer token', 'e1');

    expect(serviceMock.openElection).toHaveBeenCalledWith('e1');
    expect(res).toHaveProperty('status', 'OPEN');
  });

  // Caso de prueba: addCandidate should allow admin role - comportamiento esperado bajo condiciones especificas / Test case: addCandidate should allow admin role - expected behavior under specific conditions
  it('addCandidate should allow admin role', async () => {
    jwtMock.verifyAsync.mockResolvedValue({ sub: 'admin', roles: ['admin'] });

    const res = await controller.addCandidate('Bearer token', 'e1', { name: 'Cand' } as any);

    expect(serviceMock.addCandidate).toHaveBeenCalledWith('e1', { name: 'Cand' });
    expect(res).toHaveProperty('id', 'c1');
  });
});
