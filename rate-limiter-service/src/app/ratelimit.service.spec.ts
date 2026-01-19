// test unitario / unit test
/// <reference types="jest" />
// Suite: RateLimitService - agrupa pruebas relacionadas / Suite: RateLimitService - grouping of related tests
describe('RateLimitService', () => {
  let RateLimitService: typeof import('./ratelimit.service').RateLimitService;
  const execMock = jest.fn();
  const expireMock = jest.fn().mockResolvedValue(1);

  // Preparacion (beforeEach) - prepara el estado y los mocks / Setup (beforeEach) - prepare test state and mocks
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

  // Caso de prueba: allows when below limit and sets expiry - comportamiento esperado bajo condiciones especificas / Test case: allows when below limit and sets expiry - expected behavior under specific conditions
  it('allows when below limit and sets expiry', async () => {
    execMock.mockResolvedValueOnce([[null, 1], [null, -1]]);
    const svc = new RateLimitService();
    const res = await svc.check('ip1:/api', 5, 60);

    expect(res.allowed).toBe(true);
    expect(res.remaining).toBe(4);
    expect(expireMock).toHaveBeenCalledWith('ratelimit:ip1:/api', 60);
  });

  // Caso de prueba: blocks when limit exceeded - comportamiento esperado bajo condiciones especificas / Test case: blocks when limit exceeded - expected behavior under specific conditions
  it('blocks when limit exceeded', async () => {
    execMock.mockResolvedValueOnce([[null, 6], [null, 10]]);
    const svc = new RateLimitService();
    const res = await svc.check('ip2:/api', 5, 60);

    expect(res.allowed).toBe(false);
    expect(res.remaining).toBe(0);
  });
});
