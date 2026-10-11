export interface AuthUser {
  id: number;
  username: string;
  fullName: string | null;
  email: string | null;
  role: string;
  accountType: 'ADMIN' | 'MERCHANT';
  merchantId: number | null;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthUser;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9999';

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = localStorage.getItem('ha_auth_token') || sessionStorage.getItem('ha_auth_token');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError('Không thể kết nối máy chủ. Vui lòng thử lại.', 0);
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof payload?.message === 'string'
      ? payload.message
      : `Yêu cầu thất bại (HTTP ${response.status})`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export function login(username: string, password: string) {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}
