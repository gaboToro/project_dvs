const createProxyMiddlewareMock = jest.fn((opts) => ({ __proxy_opts: opts }));

jest.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: (opts: any) => createProxyMiddlewareMock(opts),
}));

describe('proxy.middleware', () => {
  beforeEach(() => {
    jest.resetModules();
    createProxyMiddlewareMock.mockClear();

    // Set deterministic env for targets
    process.env.AUTH_SERVICE_URL = 'http://auth:3001';
    process.env.VOTING_SERVICE_URL = 'http://voting:3002';
    process.env.BLOCKCHAIN_SERVICE_URL = 'http://bc:3003';
    process.env.RESULTS_SERVICE_URL = 'http://results:3004';
    process.env.DASHBOARD_SERVICE_URL = 'http://dashboard:3008';
    process.env.USER_SERVICE_URL = 'http://users:3005';
    process.env.ELECTION_SERVICE_URL = 'http://election:3006';
    process.env.AUDIT_LOG_SERVICE_URL = 'http://audit:3007';
  });

  it('should create all proxies with correct targets', async () => {
    const mod = await import('./proxy.middleware.js');

    // Ensure createProxyMiddleware was called 8 times
    expect(createProxyMiddlewareMock).toHaveBeenCalledTimes(8);

    const calls = createProxyMiddlewareMock.mock.calls.map((c) => c[0]);

    const targets = calls.map((c) => c.target);
    expect(targets).toEqual([
      'http://auth:3001',
      'http://voting:3002',
      'http://bc:3003',
      'http://results:3004',
      'http://dashboard:3008',
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
    expect(mod.usersProxy).toBeDefined();
    expect(mod.electionProxy).toBeDefined();
    expect(mod.auditProxy).toBeDefined();
  });

  it('should rewrite paths correctly', async () => {
    await import('./proxy.middleware.js');

    const calls = createProxyMiddlewareMock.mock.calls.map((c) => c[0]);

    const auth = calls[0];
    const votes = calls[1];
    const chain = calls[2];
    const results = calls[3];
    const dashboard = calls[4];
    const users = calls[5];
    const elections = calls[6];
    const audit = calls[7];

    expect(auth.pathRewrite('/login')).toBe('/api/auth/login');
    expect(votes.pathRewrite('/')).toBe('/api/votes/');
    expect(chain.pathRewrite('/add')).toBe('/api/chain/add');
    expect(results.pathRewrite('/election-2025')).toBe('/api/results/election-2025');
    expect(dashboard.pathRewrite('/demo-2025')).toBe('/api/dashboard/demo-2025');
    expect(users.pathRewrite('/eligibility/123')).toBe('/api/users/eligibility/123');
    expect(elections.pathRewrite('/active')).toBe('/api/elections/active');
    expect(audit.pathRewrite('/log')).toBe('/api/audit/log');
  });
});
