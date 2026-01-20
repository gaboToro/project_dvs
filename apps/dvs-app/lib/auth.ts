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

export function decodeJwtRole(token: string): 'admin' | 'voter' | null {
  const parts = token.split('.');
  if (parts.length < 2 || typeof atob !== 'function') return null;
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  try {
    const payload = JSON.parse(atob(padded));
    const roles = payload?.roles ?? [];
    if (Array.isArray(roles)) {
      if (roles.includes('admin')) return 'admin';
      if (roles.includes('voter')) return 'voter';
    }
    return null;
  } catch {
    return null;
  }
}

export function decodeJwtSubject(token: string): string | null {
  const parts = token.split('.');
  if (parts.length < 2 || typeof atob !== 'function') return null;
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  try {
    const payload = JSON.parse(atob(padded));
    const sub = payload?.sub;
    return typeof sub === 'string' && sub ? sub : null;
  } catch {
    return null;
  }
}
