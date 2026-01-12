import { API_BASE_URL } from '@/lib/config';

type ApiError = {
  message: string;
  status?: number;
};

function buildUrl(path: string) {
  if (path.startsWith('http')) return path;
  const prefix = path.startsWith('/') ? '' : '/';
  return `${API_BASE_URL}${prefix}${path}`;
}

async function parseJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = options;
  const response = await fetch(buildUrl(path), {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(json ? { 'Content-Type': 'application/json' } : null),
      ...(headers ?? {}),
    },
    body: json ? JSON.stringify(json) : rest.body,
  });

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message?: string }).message)
        : typeof payload === 'string'
          ? payload
          : response.statusText) || 'Request failed';
    const error: ApiError = { message, status: response.status };
    throw error;
  }

  return payload as T;
}
