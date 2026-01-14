/// <reference types="jest" />
describe('RateLimitService', () => {
  let RateLimitService: typeof import('./ratelimit.service').RateLimitService;
  const execMock = jest.fn();
  const expireMock = jest.fn().mockResolvedValue(1);

  beforeEach(async () => {
    execMock.mockReset();
    expireMock.mockClear();
    jest.resetModules();
    jest.doMock('ioredis', () =>
      jest.fn().mockImplementation(() => ({
        multi: () => ({
          incr: jest.fn(),
          ttl: jest.fn(),
          exec: execMock,
        }),
        expire: expireMock,
      })),
    );

    ({ RateLimitService } = await import('./ratelimit.service.js'));
  });

  it('allows when below limit and sets expiry', async () => {
    execMock.mockResolvedValueOnce([[null, 1], [null, -1]]);
    const svc = new RateLimitService();
    const res = await svc.check('ip1:/api', 5, 60);

    expect(res.allowed).toBe(true);
    expect(res.remaining).toBe(4);
    expect(expireMock).toHaveBeenCalledWith('ratelimit:ip1:/api', 60);
  });

  it('blocks when limit exceeded', async () => {
    execMock.mockResolvedValueOnce([[null, 6], [null, 10]]);
    const svc = new RateLimitService();
    const res = await svc.check('ip2:/api', 5, 60);

    expect(res.allowed).toBe(false);
    expect(res.remaining).toBe(0);
  });
});
