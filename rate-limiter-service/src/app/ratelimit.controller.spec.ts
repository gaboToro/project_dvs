// test unitario / unit test
/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitController } from './ratelimit.controller';
import { RateLimitService } from './ratelimit.service';

// Suite: RateLimitController - agrupa pruebas relacionadas / Suite: RateLimitController - grouping of related tests
describe('RateLimitController', () => {
  const limiterMock = {
    check: jest.fn(),
  };
  let moduleRef: TestingModule | undefined;
  let originalToken: string | undefined;

  // Preparacion (beforeEach) - prepara el estado y los mocks / Setup (beforeEach) - prepare test state and mocks
  beforeEach(() => {
    originalToken = process.env.INTERNAL_SERVICE_TOKEN;
    limiterMock.check.mockReset();
  });

  // Limpieza (afterEach) - limpia el estado y los mocks / Teardown (afterEach) - cleanup state and mocks
  afterEach(async () => {
    if (moduleRef) {
      await moduleRef.close();
      moduleRef = undefined;
    }

    if (originalToken === undefined) {
      delete process.env.INTERNAL_SERVICE_TOKEN;
    } else {
      process.env.INTERNAL_SERVICE_TOKEN = originalToken;
    }
  });

  // Caso de prueba: returns ok on health - comportamiento esperado bajo condiciones especificas / Test case: returns ok on health - expected behavior under specific conditions
  it('returns ok on health', async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [RateLimitController],
      providers: [{ provide: RateLimitService, useValue: limiterMock }],
    }).compile();

    const controller = moduleRef.get(RateLimitController);
    expect(controller.health()).toEqual({
      status: 'ok',
      service: 'rate-limiter-service',
    });
  });

  // Caso de prueba: denies when internal token is invalid - comportamiento esperado bajo condiciones especificas / Test case: denies when internal token is invalid - expected behavior under specific conditions
  it('denies when internal token is invalid', async () => {
    process.env.INTERNAL_SERVICE_TOKEN = 'token';
    moduleRef = await Test.createTestingModule({
      controllers: [RateLimitController],
      providers: [{ provide: RateLimitService, useValue: limiterMock }],
    }).compile();

    const controller = moduleRef.get(RateLimitController);
    const res = await controller.check('bad', { key: 'k', limit: 1, windowSec: 10 });

    expect(res.allowed).toBe(false);
    expect(limiterMock.check).not.toHaveBeenCalled();
  });

  // Caso de prueba: delegates to limiter when token ok - comportamiento esperado bajo condiciones especificas / Test case: delegates to limiter when token ok - expected behavior under specific conditions
  it('delegates to limiter when token ok', async () => {
    process.env.INTERNAL_SERVICE_TOKEN = 'token';
    limiterMock.check.mockResolvedValueOnce({
      allowed: true,
      remaining: 1,
      limit: 2,
      resetAt: Date.now(),
    });

    moduleRef = await Test.createTestingModule({
      controllers: [RateLimitController],
      providers: [{ provide: RateLimitService, useValue: limiterMock }],
    }).compile();

    const controller = moduleRef.get(RateLimitController);
    const res = await controller.check('token', { key: 'k', limit: 2, windowSec: 10 });

    expect(limiterMock.check).toHaveBeenCalledWith('k', 2, 10);
    expect(res.allowed).toBe(true);
  });
});
