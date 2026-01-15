import { createProxyMiddleware } from 'http-proxy-middleware';

const AUTH = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001';
const VOTING = process.env.VOTING_SERVICE_URL ?? 'http://localhost:3002';
const BLOCKCHAIN = process.env.BLOCKCHAIN_SERVICE_URL ?? 'http://localhost:3003';
const RESULTS = process.env.RESULTS_SERVICE_URL ?? 'http://localhost:3004';
const DASHBOARD = process.env.DASHBOARD_SERVICE_URL ?? 'http://localhost:3008';
const EMAIL = process.env.EMAIL_NOTIFIER_SERVICE_URL ?? 'http://localhost:3009';
const REPORTING = process.env.REPORTING_SERVICE_URL ?? 'http://localhost:3012';
const USERS = process.env.USER_SERVICE_URL ?? 'http://localhost:3005';
const ELECTION = process.env.ELECTION_SERVICE_URL ?? 'http://localhost:3006';
const AUDIT = process.env.AUDIT_LOG_SERVICE_URL ?? 'http://localhost:3007';

export const authProxy = createProxyMiddleware({
  target: AUTH,
  changeOrigin: true,
  pathRewrite: (path) => `/api/auth${path}`,
});

export const votingProxy = createProxyMiddleware({
  target: VOTING,
  changeOrigin: true,
  pathRewrite: (path) => `/api/votes${path}`,
});

export const blockchainProxy = createProxyMiddleware({
  target: BLOCKCHAIN,
  changeOrigin: true,
  pathRewrite: (path) => `/api/chain${path}`,
});

export const resultsProxy = createProxyMiddleware({
  target: RESULTS,
  changeOrigin: true,
  pathRewrite: (path) => `/api/results${path}`,
});

export const dashboardProxy = createProxyMiddleware({
  target: DASHBOARD,
  changeOrigin: true,
  pathRewrite: (path) => `/api/dashboard${path}`,
});

export const emailProxy = createProxyMiddleware({
  target: EMAIL,
  changeOrigin: true,
  pathRewrite: (path) => `/api/email${path}`,
});

export const reportingProxy = createProxyMiddleware({
  target: REPORTING,
  changeOrigin: true,
  pathRewrite: (path) => `/api/reports${path}`,
});

export const usersProxy = createProxyMiddleware({
  target: USERS,
  changeOrigin: true,
  pathRewrite: (path) => `/api/users${path}`,
});

export const electionProxy = createProxyMiddleware({
  target: ELECTION,
  changeOrigin: true,
  pathRewrite: (path) => `/api/elections${path}`,
});

export const auditProxy = createProxyMiddleware({
  target: AUDIT,
  changeOrigin: true,
  pathRewrite: (path) => `/api/audit${path}`,
});
