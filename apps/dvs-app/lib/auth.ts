import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'dvs.app.token';
const ROLE_KEY = 'dvs.app.role';

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string) {
  return AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(ROLE_KEY);
}

export async function setRole(role: 'admin' | 'voter') {
  return AsyncStorage.setItem(ROLE_KEY, role);
}

export async function getRole() {
  return AsyncStorage.getItem(ROLE_KEY);
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  const parts = token.split('.');
  if (parts.length < 2 || typeof atob !== 'function') return null;
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  try {
    return JSON.parse(atob(padded)) as Record<string, any>;
  } catch {
    return null;
  }
}

export function decodeJwtRole(token: string): 'admin' | 'voter' | null {
  const payload = decodeJwtPayload(token);
  const roles = payload?.roles ?? [];
  if (Array.isArray(roles)) {
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('voter')) return 'voter';
  }
  return null;
}

export function decodeJwtSubject(token: string): string | null {
  const payload = decodeJwtPayload(token);
  const sub = payload?.sub;
  return typeof sub === 'string' && sub ? sub : null;
}

export function decodeJwtExpiry(token: string): number | null {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  return typeof exp === 'number' ? exp : null;
}

export function isTokenExpired(token: string, skewSeconds = 10): boolean {
  const exp = decodeJwtExpiry(token);
  if (!exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return now >= exp - skewSeconds;
}
