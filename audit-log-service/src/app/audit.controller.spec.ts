// test unitario / unit test
/// <reference types="jest" />
import { Test } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

// Suite: AuditController - agrupa pruebas relacionadas / Suite: AuditController - grouping of related tests
describe('AuditController', () => {
  const auditMock = {
    create: jest.fn(),
    list: jest.fn(),
  };

  // Preparacion (beforeEach) - prepara el estado y los mocks / Setup (beforeEach) - prepare test state and mocks
  beforeEach(() => {
    auditMock.create.mockReset();
    auditMock.list.mockReset();
  });

  // Caso de prueba: returns ok on health - comportamiento esperado bajo condiciones especificas / Test case: returns ok on health - expected behavior under specific conditions
  it('returns ok on health', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: auditMock }],
    }).compile();

    const controller = moduleRef.get(AuditController);
    expect(controller.health()).toEqual({ status: 'ok', service: 'audit-log-service' });
  });

  // Caso de prueba: denies when internal token is invalid - comportamiento esperado bajo condiciones especificas / Test case: denies when internal token is invalid - expected behavior under specific conditions
  it('denies when internal token is invalid', async () => {
    process.env.INTERNAL_SERVICE_TOKEN = 'token';
    const moduleRef = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: auditMock }],
    }).compile();

    const controller = moduleRef.get(AuditController);
    await expect(
      controller.create('bad', undefined, 'ua', {
        action: 'LOGIN',
        resource: 'auth',
      } as any),
    ).rejects.toHaveProperty('status', 401);

    expect(auditMock.create).not.toHaveBeenCalled();
  });

  // Caso de prueba: creates when token ok - comportamiento esperado bajo condiciones especificas / Test case: creates when token ok - expected behavior under specific conditions
  it('creates when token ok', async () => {
    process.env.INTERNAL_SERVICE_TOKEN = 'token';
    auditMock.create.mockResolvedValueOnce({
      id: 'a3',
      action: 'LOGIN',
      resource: 'auth',
      createdAt: new Date().toISOString(),
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: auditMock }],
    }).compile();

    const controller = moduleRef.get(AuditController);
    const res = await controller.create('token', '127.0.0.1', 'ua', {
      action: 'LOGIN',
      resource: 'auth',
    } as any);

    expect(auditMock.create).toHaveBeenCalled();
    expect(res.id).toBe('a3');
  });
});
