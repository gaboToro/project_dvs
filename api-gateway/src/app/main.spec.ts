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

describe('api-gateway bootstrap', () => {
  beforeEach(() => {
    jest.resetModules();
    useMock.mockClear();
    listenMock.mockClear();
    enableCorsMock.mockClear();
    getMock.mockClear();
    process.env.PORT = '3000';
  });

  it('should register proxy routes and start listening', async () => {
    // Importing main.ts should run bootstrap()
    await import('../main.js');

    expect(useMock).toHaveBeenCalledWith({ name: 'auditMiddleware' });
    expect(useMock).toHaveBeenCalledWith({ name: 'rateLimitMiddleware' });
    expect(useMock).toHaveBeenCalledWith('/api/auth', { name: 'authProxy' });
    expect(useMock).toHaveBeenCalledWith('/api/votes', { name: 'votingProxy' });
    expect(useMock).toHaveBeenCalledWith('/api/chain', { name: 'blockchainProxy' });
    expect(useMock).toHaveBeenCalledWith('/api/results', { name: 'resultsProxy' });
    expect(useMock).toHaveBeenCalledWith('/api/users', { name: 'usersProxy' });
    expect(useMock).toHaveBeenCalledWith('/api/elections', { name: 'electionProxy' });
    expect(useMock).toHaveBeenCalledWith('/api/audit', { name: 'auditProxy' });

    expect(listenMock).toHaveBeenCalledWith('3000');
  });
});
