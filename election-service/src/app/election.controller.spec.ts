import { Test } from '@nestjs/testing';
import { ElectionController } from './election.controller';
import { ElectionService } from './election.service';
import { JwtService } from '@nestjs/jwt';

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

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';

    const moduleRef = await Test.createTestingModule({
      controllers: [ElectionController],
      providers: [
        { provide: ElectionService, useValue: serviceMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    controller = moduleRef.get(ElectionController);

    jest.clearAllMocks();
  });

  // ---------- PUBLIC ----------
  it('getActive should call service.getActiveElection', async () => {
    const res = await controller.getActive();
    expect(serviceMock.getActiveElection).toHaveBeenCalled();
    expect(res).toHaveProperty('id', 'e-active');
  });

  it('getById should call service.getElectionWithCandidates', async () => {
    const res = await controller.getById('e1');
    expect(serviceMock.getElectionWithCandidates).toHaveBeenCalledWith('e1');
    expect(res).toHaveProperty('id', 'e1');
  });

  // ---------- ADMIN AUTH ----------
  it('create should reject missing bearer token', async () => {
    await expect(controller.create(undefined, {} as any)).rejects.toHaveProperty('status', 401);
  });

  it('create should reject non-admin role', async () => {
    jwtMock.verifyAsync.mockResolvedValue({ sub: 'u1', roles: ['voter'] });

    await expect(controller.create('Bearer token', {} as any)).rejects.toHaveProperty('status', 403);
  });

  it('create should allow admin role', async () => {
    jwtMock.verifyAsync.mockResolvedValue({ sub: 'admin', roles: ['admin'] });

    const res = await controller.create('Bearer token', { title: 'Elec' } as any);

    expect(jwtMock.verifyAsync).toHaveBeenCalled();
    expect(serviceMock.createElection).toHaveBeenCalled();
    expect(res).toHaveProperty('id', 'e1');
  });

  it('open should allow admin role', async () => {
    jwtMock.verifyAsync.mockResolvedValue({ sub: 'admin', roles: ['admin'] });

    const res = await controller.open('Bearer token', 'e1');

    expect(serviceMock.openElection).toHaveBeenCalledWith('e1');
    expect(res).toHaveProperty('status', 'OPEN');
  });

  it('addCandidate should allow admin role', async () => {
    jwtMock.verifyAsync.mockResolvedValue({ sub: 'admin', roles: ['admin'] });

    const res = await controller.addCandidate('Bearer token', 'e1', { name: 'Cand' } as any);

    expect(serviceMock.addCandidate).toHaveBeenCalledWith('e1', { name: 'Cand' });
    expect(res).toHaveProperty('id', 'c1');
  });
});