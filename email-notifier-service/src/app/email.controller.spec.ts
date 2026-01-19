// test unitario / unit test
import { Test } from '@nestjs/testing';
import { EmailController } from './email.controller';
import { EmailQueue } from './email.queue';

// Suite: EmailController - agrupa pruebas relacionadas / Suite: EmailController - grouping of related tests
describe('EmailController', () => {
  let controller: EmailController;
  const queueMock = {
    publish: jest.fn(),
  };

  // Preparacion (beforeAll) - prepara el estado y los mocks / Setup (beforeAll) - prepare test state and mocks
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

  // Preparacion (beforeEach) - prepara el estado y los mocks / Setup (beforeEach) - prepare test state and mocks
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.INTERNAL_SERVICE_TOKEN = 'token';
  });

  // Caso de prueba: returns health payload - comportamiento esperado bajo condiciones especificas / Test case: returns health payload - expected behavior under specific conditions
  it('returns health payload', () => {
    expect(controller.health()).toEqual({ status: 'ok', service: 'email-notifier-service' });
  });

  // Caso de prueba: rejects invalid token - comportamiento esperado bajo condiciones especificas / Test case: rejects invalid token - expected behavior under specific conditions
  it('rejects invalid token', async () => {
    await expect(
      controller.enqueue('bad-token', {
        to: 'user@example.com',
        subject: 'Hello',
        text: 'Body',
      }),
    ).rejects.toHaveProperty('status', 401);
  });

  // Caso de prueba: publishes valid payload - comportamiento esperado bajo condiciones especificas / Test case: publishes valid payload - expected behavior under specific conditions
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
/// <reference types="jest" />
