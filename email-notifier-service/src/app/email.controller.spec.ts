import { Test } from '@nestjs/testing';
import { EmailController } from './email.controller';
import { EmailQueue } from './email.queue';

describe('EmailController', () => {
  let controller: EmailController;
  const queueMock = {
    publish: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [
        {
          provide: EmailQueue,
          useValue: queueMock,
        },
      ],
    }).compile();

    controller = moduleRef.get(EmailController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.INTERNAL_SERVICE_TOKEN = 'token';
  });

  it('returns health payload', () => {
    expect(controller.health()).toEqual({ status: 'ok', service: 'email-notifier-service' });
  });

  it('rejects invalid token', async () => {
    await expect(
      controller.enqueue('bad-token', {
        to: 'user@example.com',
        subject: 'Hello',
        text: 'Body',
      }),
    ).rejects.toHaveProperty('status', 401);
  });

  it('publishes valid payload', async () => {
    const res = await controller.enqueue('token', {
      to: 'user@example.com',
      subject: 'Hello',
      text: 'Body',
    });

    expect(res).toEqual({ ok: true });
    expect(queueMock.publish).toHaveBeenCalled();
  });
});
