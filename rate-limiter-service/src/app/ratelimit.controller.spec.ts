/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitController } from './ratelimit.controller';
import { RateLimitService } from './ratelimit.service';

describe('RateLimitController', () => {
  const limiterMock = {
    check: jest.fn(),
  };
  let moduleRef: TestingModule | undefined;
  let originalToken: string | undefined;

  beforeEach(() => {
    originalToken = process.env.INTERNAL_SERVICE_TOKEN;
    limiterMock.check.mockReset();
  });

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
