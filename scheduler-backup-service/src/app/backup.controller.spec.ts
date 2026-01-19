// test unitario / unit test
import { Test } from '@nestjs/testing';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';

// Suite: BackupController - agrupa pruebas relacionadas / Suite: BackupController - grouping of related tests
describe('BackupController', () => {
  let controller: BackupController;
  const backupMock = {
    runBackup: jest.fn().mockResolvedValue({ ok: true }),
    getLastResult: jest.fn().mockReturnValue(null),
  };

  // Preparacion (beforeAll) - prepara el estado y los mocks / Setup (beforeAll) - prepare test state and mocks
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BackupController],
      providers: [
        {
          provide: BackupService,
          useValue: backupMock,
        },
      ],
    }).compile();

    controller = moduleRef.get(BackupController);
  });

  // Preparacion (beforeEach) - prepara el estado y los mocks / Setup (beforeEach) - prepare test state and mocks
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.INTERNAL_SERVICE_TOKEN = 'token';
  });

  // Caso de prueba: returns health payload - comportamiento esperado bajo condiciones especificas / Test case: returns health payload - expected behavior under specific conditions
  it('returns health payload', () => {
    expect(controller.health()).toEqual({ status: 'ok', service: 'scheduler-backup-service' });
  });

  // Caso de prueba: rejects invalid token - comportamiento esperado bajo condiciones especificas / Test case: rejects invalid token - expected behavior under specific conditions
  it('rejects invalid token', async () => {
    await expect(controller.run('bad-token', { reason: 'manual' })).rejects.toHaveProperty(
      'status',
      401,
    );
  });

  // Caso de prueba: starts backup when token matches - comportamiento esperado bajo condiciones especificas / Test case: starts backup when token matches - expected behavior under specific conditions
  it('starts backup when token matches', async () => {
    const res = await controller.run('token', { reason: 'manual' });
    expect(backupMock.runBackup).toHaveBeenCalledWith('manual');
    expect(res).toEqual({ ok: true });
  });
});
