// test unitario / unit test
const createProxyMiddlewareMock = jest.fn((opts) => ({ __proxy_opts: opts }));

jest.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: (opts: any) => createProxyMiddlewareMock(opts),
}));

// Suite: proxy.middleware - agrupa pruebas relacionadas / Suite: proxy.middleware - grouping of related tests
describe('proxy.middleware', () => {
  // Preparacion (beforeEach) - prepara el estado y los mocks / Setup (beforeEach) - prepare test state and mocks
  beforeEach(() => {
    jest.resetModules();
    createProxyMiddlewareMock.mockClear();

    // Set deterministic env for targets
    process.env.AUTH_SERVICE_URL = 'http://auth:3001';
    process.env.VOTING_SERVICE_URL = 'http://voting:3002';
    process.env.BLOCKCHAIN_SERVICE_URL = 'http://bc:3003';
    process.env.RESULTS_SERVICE_URL = 'http://results:3004';
    process.env.USER_SERVICE_URL = 'http://users:3005';
    process.env.ELECTION_SERVICE_URL = 'http://election:3006';
    process.env.AUDIT_LOG_SERVICE_URL = 'http://audit:3007';
    process.env.DASHBOARD_SERVICE_URL = 'http://dashboard:3008';
    process.env.EMAIL_NOTIFIER_SERVICE_URL = 'http://email:3009';
    process.env.RATE_LIMITER_URL = 'http://ratelimit:3010';
    process.env.SCHEDULER_BACKUP_SERVICE_URL = 'http://backup:3011';
    process.env.REPORTING_SERVICE_URL = 'http://reporting:3012';
  });

  // Caso de prueba: should create all proxies with correct targets - comportamiento esperado bajo condiciones especificas / Test case: should create all proxies with correct targets - expected behavior under specific conditions
  it('should create all proxies with correct targets', async () => {
    const mod = await import('./proxy.middleware.js');

    // Ensure createProxyMiddleware was called 12 times
    expect(createProxyMiddlewareMock).toHaveBeenCalledTimes(12);

    const calls = createProxyMiddlewareMock.mock.calls.map((c) => c[0]);

    const targets = calls.map((c) => c.target);
    expect(targets).toEqual([
      'http://auth:3001',
      'http://voting:3002',
      'http://bc:3003',
      'http://results:3004',
      'http://dashboard:3008',
      'http://email:3009',
      'http://ratelimit:3010',
      'http://reporting:3012',
      'http://backup:3011',
      'http://users:3005',
      'http://election:3006',
      'http://audit:3007',
    ]);

    // Quick sanity: exported proxies exist
    expect(mod.authProxy).toBeDefined();
    expect(mod.votingProxy).toBeDefined();
    expect(mod.blockchainProxy).toBeDefined();
    expect(mod.resultsProxy).toBeDefined();
    expect(mod.dashboardProxy).toBeDefined();
    expect(mod.emailProxy).toBeDefined();
    expect(mod.rateLimitProxy).toBeDefined();
    expect(mod.reportingProxy).toBeDefined();
    expect(mod.backupProxy).toBeDefined();
    expect(mod.usersProxy).toBeDefined();
    expect(mod.electionProxy).toBeDefined();
    expect(mod.auditProxy).toBeDefined();
  });

  // Caso de prueba: should rewrite paths correctly - comportamiento esperado bajo condiciones especificas / Test case: should rewrite paths correctly - expected behavior under specific conditions
  it('should rewrite paths correctly', async () => {
    await import('./proxy.middleware.js');

    const calls = createProxyMiddlewareMock.mock.calls.map((c) => c[0]);

    const auth = calls[0];
    const votes = calls[1];
    const chain = calls[2];
    const results = calls[3];
    const dashboard = calls[4];
    const email = calls[5];
    const rateLimit = calls[6];
    const reporting = calls[7];
    const backup = calls[8];
    const users = calls[9];
    const elections = calls[10];
    const audit = calls[11];

    expect(auth.pathRewrite('/login')).toBe('/api/auth/login');
    expect(votes.pathRewrite('/')).toBe('/api/votes/');
    expect(chain.pathRewrite('/add')).toBe('/api/chain/add');
    expect(results.pathRewrite('/election-2025')).toBe('/api/results/election-2025');
    expect(dashboard.pathRewrite('/demo-2025')).toBe('/api/dashboard/demo-2025');
    expect(email.pathRewrite('/send')).toBe('/api/email/send');
    expect(rateLimit.pathRewrite('/check')).toBe('/api/ratelimit/check');
    expect(reporting.pathRewrite('/elections.csv')).toBe('/api/reports/elections.csv');
    expect(backup.pathRewrite('/health')).toBe('/api/backup/health');
    expect(users.pathRewrite('/eligibility/123')).toBe('/api/users/eligibility/123');
    expect(elections.pathRewrite('/active')).toBe('/api/elections/active');
    expect(audit.pathRewrite('/log')).toBe('/api/audit/log');
  });
});
