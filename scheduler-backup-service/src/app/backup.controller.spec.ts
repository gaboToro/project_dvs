import { Test } from '@nestjs/testing';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';

describe('BackupController', () => {
  let controller: BackupController;
  const backupMock = {
    runBackup: jest.fn().mockResolvedValue({ ok: true }),
    getLastResult: jest.fn().mockReturnValue(null),
  };

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

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.INTERNAL_SERVICE_TOKEN = 'token';
  });

  it('returns health payload', () => {
    expect(controller.health()).toEqual({ status: 'ok', service: 'scheduler-backup-service' });
  });

  it('rejects invalid token', async () => {
    await expect(controller.run('bad-token', { reason: 'manual' })).rejects.toHaveProperty(
      'status',
      401,
    );
  });

  it('starts backup when token matches', async () => {
    const res = await controller.run('token', { reason: 'manual' });
    expect(backupMock.runBackup).toHaveBeenCalledWith('manual');
    expect(res).toEqual({ ok: true });
  });
});
