import type { ApiError } from '../types/api';

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL ?? 'http://127.0.0.1:8186'}/api/v1`;

export class ApiRequestError extends Error {
  status: number;
  detail?: string;
  errors?: ApiError['errors'];

  constructor(status: number, body: ApiError) {
    super(body.detail || body.title || `Request failed with status ${status}`);
    this.name = 'ApiRequestError';
    this.status = status;
    this.detail = body.detail;
    this.errors = body.errors;
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('aether_api_token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let body: ApiError = {};
    try {
      body = await res.json();
    } catch {
      body = { detail: res.statusText };
    }
    throw new ApiRequestError(res.status, body);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }
  const res = await fetch(url.toString(), {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<T>(res);
}

export async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<T>(res);
}
