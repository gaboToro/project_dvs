/// <reference types="jest" />
import { Test } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

describe('AuditController', () => {
  const auditMock = {
    create: jest.fn(),
    list: jest.fn(),
  };

  beforeEach(() => {
    auditMock.create.mockReset();
    auditMock.list.mockReset();
  });

  it('returns ok on health', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: auditMock }],
    }).compile();

    const controller = moduleRef.get(AuditController);
    expect(controller.health()).toEqual({ status: 'ok', service: 'audit-log-service' });
  });

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
