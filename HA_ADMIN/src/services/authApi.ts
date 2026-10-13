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

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
export const API_BASE_URL = (configuredBaseUrl || '').replace(/\/+$/, '');
const TOKEN_KEY = 'ha_admin_access_token';
const UNAUTHORIZED_EVENT = 'ha-admin:unauthorized';

export function getAccessToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function saveAccessToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function onUnauthorized(handler: () => void) {
  window.addEventListener(UNAUTHORIZED_EVENT, handler);
  return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
}

export function apiMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Đã xảy ra lỗi. Vui lòng thử lại.';
  if (error.status === 0) return 'Không thể kết nối máy chủ. Kiểm tra kết nối và thử lại.';
  if (error.status === 400) return error.message || 'Dữ liệu gửi lên không hợp lệ.';
  if (error.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (error.status === 403) return 'Tài khoản không có quyền thực hiện thao tác này.';
  if (error.status === 404) return 'Không tìm thấy POI hoặc dữ liệu yêu cầu.';
  if (error.status === 409) return error.message || 'Dữ liệu đang ở trạng thái không thể thực hiện thao tác.';
  if (error.status >= 500) return 'Máy chủ gặp lỗi. Vui lòng thử lại sau.';
  return error.message;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  const token = getAccessToken();
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  if (!API_BASE_URL && !path.startsWith('http')) {
    throw new ApiError('Thiếu cấu hình VITE_API_BASE_URL.', 0);
  }
  try {
    response = await fetch(path.startsWith('http') ? path : `${API_BASE_URL}${path}`, { ...init, headers, credentials: 'omit' });
  } catch {
    throw new ApiError('Không thể kết nối máy chủ.', 0);
  }

  const payload: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null && 'message' in payload
      && typeof payload.message === 'string'
      ? payload.message
      : `Yêu cầu thất bại (HTTP ${response.status})`;
    if (response.status === 401 && path !== '/api/auth/login') {
      clearAccessToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
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

export function getCurrentUser() {
  return apiRequest<AuthUser>('/api/auth/me');
}
