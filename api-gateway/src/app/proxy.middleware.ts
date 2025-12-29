import { createProxyMiddleware } from 'http-proxy-middleware';

const AUTH = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001';
const VOTING = process.env.VOTING_SERVICE_URL ?? 'http://localhost:3002';
const BLOCKCHAIN = process.env.BLOCKCHAIN_SERVICE_URL ?? 'http://localhost:3003';
const RESULTS = process.env.RESULTS_SERVICE_URL ?? 'http://localhost:3004';
const USERS = process.env.USER_SERVICE_URL ?? 'http://localhost:3005';

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

export const usersProxy = createProxyMiddleware({
  target: USERS,
  changeOrigin: true,
  pathRewrite: (path) => `/api/users${path}`,
});
