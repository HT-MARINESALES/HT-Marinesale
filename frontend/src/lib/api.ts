import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

async function doFetch(path: string, options: RequestInit): Promise<Response> {
  const headers = await getAuthHeaders();
  return fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body.error || `HTTP Error ${response.status}`;
  } catch {
    return `HTTP Error ${response.status}`;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await doFetch(path, options);

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),

  // Multipart upload
  async upload<T>(path: string, formData: FormData): Promise<T> {
    const getHeaders = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const h: Record<string, string> = {};
      if (session?.access_token) h['Authorization'] = `Bearer ${session.access_token}`;
      return h;
    };

    const response = await fetch(`${API_URL}/api${path}`, {
      method: 'POST', headers: await getHeaders(), body: formData,
    });
    if (!response.ok) {
      throw new Error(await parseError(response));
    }
    return response.json();
  },
};
