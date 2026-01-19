// test unitario / unit test
/**
 * Unit test for main.ts bootstrap.
 * We mock NestFactory to verify routing middleware is registered.
 */
import type { INestApplication } from '@nestjs/common';

const useMock = jest.fn();
const listenMock = jest.fn().mockResolvedValue(undefined);
const enableCorsMock = jest.fn();
const getMock = jest.fn().mockReturnValue({});

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn().mockResolvedValue({
      use: useMock,
      enableCors: enableCorsMock,
      get: getMock,
      listen: listenMock,
    } as Partial<INestApplication>),
  },
}));

// Mock proxies so main.ts can import them without executing real middleware
jest.mock('./proxy.middleware', () => ({
  authProxy: { name: 'authProxy' },
  votingProxy: { name: 'votingProxy' },
  blockchainProxy: { name: 'blockchainProxy' },
  resultsProxy: { name: 'resultsProxy' },
  dashboardProxy: { name: 'dashboardProxy' },
  emailProxy: { name: 'emailProxy' },
  reportingProxy: { name: 'reportingProxy' },
  backupProxy: { name: 'backupProxy' },
  usersProxy: { name: 'usersProxy' },
  electionProxy: { name: 'electionProxy' },
  auditProxy: { name: 'auditProxy' },
}));

jest.mock('./audit.middleware', () => ({
  createAuditMiddleware: () => ({ name: 'auditMiddleware' }),
}));

jest.mock('./rate-limit.middleware', () => ({
  rateLimitMiddleware: { name: 'rateLimitMiddleware' },
}));

// Suite: api-gateway bootstrap - agrupa pruebas relacionadas / Suite: api-gateway bootstrap - grouping of related tests
describe('api-gateway bootstrap', () => {
  // Preparacion (beforeEach) - prepara el estado y los mocks / Setup (beforeEach) - prepare test state and mocks
  beforeEach(() => {
    jest.resetModules();
    useMock.mockClear();
    listenMock.mockClear();
    enableCorsMock.mockClear();
    getMock.mockClear();
    process.env.PORT = '3000';
  });

  // Caso de prueba: should register proxy routes and start listening - comportamiento esperado bajo condiciones especificas / Test case: should register proxy routes and start listening - expected behavior under specific conditions
  it('should register proxy routes and start listening', async () => {
    // Importing main.ts should run bootstrap()
    await import('../main.js');

    expect(useMock).toHaveBeenCalledWith({ name: 'auditMiddleware' });
    expect(useMock).toHaveBeenCalledWith({ name: 'rateLimitMiddleware' });
    expect(useMock).toHaveBeenCalledWith('/api/auth', { name: 'authProxy' });
    expect(useMock).toHaveBeenCalledWith('/api/votes', { name: 'votingProxy' });
    expect(useMock).toHaveBeenCalledWith('/api/chain', { name: 'blockchainProxy' });
    expect(useMock).toHaveBeenCalledWith('/api/results', { name: 'resultsProxy' });
    expect(useMock).toHaveBeenCalledWith('/api/dashboard', { name: 'dashboardProxy' });
    expect(useMock).toHaveBeenCalledWith('/api/email', { name: 'emailProxy' });
    expect(useMock).toHaveBeenCalledWith('/api/reports', { name: 'reportingProxy' });
    expect(useMock).toHaveBeenCalledWith('/api/backup', { name: 'backupProxy' });
    expect(useMock).toHaveBeenCalledWith('/api/users', { name: 'usersProxy' });
    expect(useMock).toHaveBeenCalledWith('/api/elections', { name: 'electionProxy' });
    expect(useMock).toHaveBeenCalledWith('/api/audit', { name: 'auditProxy' });

    expect(listenMock).toHaveBeenCalledWith('3000');
  });
});
