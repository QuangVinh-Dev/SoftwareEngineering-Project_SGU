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

export interface MerchantRegistrationResponse {
  accountId: number;
  merchantId: number;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  message: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
  secret?: string;
  qrCodeUrl?: string;
  backupCodes?: string[];
}

export interface TwoFactorEnableRequest {
  code: string;
  password: string;
}

export interface TwoFactorDisableRequest {
  code: string;
  password: string;
}

export interface SessionInfo {
  id: string;
  device: string;
  browser: string;
  operatingSystem: string;
  country: string;
  ipAddress: string;
  lastActive: string;
  current: boolean;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9999';

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
    let message = typeof payload?.message === 'string'
      ? payload.message
      : `Yêu cầu thất bại (HTTP ${response.status})`;
    // BE trả lỗi validate dạng { message, errors: { field: "..." } } → hiển thị chi tiết lỗi đầu tiên.
    const fieldErrors = payload?.errors && typeof payload.errors === 'object'
      ? Object.values(payload.errors as Record<string, unknown>).filter(v => typeof v === 'string')
      : [];
    if (fieldErrors.length > 0) message = `${message}: ${fieldErrors[0]}`;
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

export interface RegisterMerchantInput {
  username?: string;
  password: string;
  fullName: string;
  email: string;
  merchantName: string;
  phoneNumber?: string;
  address?: string;
  category?: string;
  description?: string;
  /** data URI base64, tối đa 5 ảnh */
  merchantImages?: string[];
  plan?: { id: string; billing: string; totalPrice?: number };
}

export function registerMerchant(input: RegisterMerchantInput) {
  return apiRequest<MerchantRegistrationResponse>('/api/auth/register/merchant', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function changePassword(input: ChangePasswordRequest) {
  return apiRequest<ChangePasswordResponse>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getTwoFactorStatus() {
  return apiRequest<TwoFactorStatus>('/api/auth/2fa/status');
}

export function enableTwoFactor(input: TwoFactorEnableRequest) {
  return apiRequest<TwoFactorStatus>('/api/auth/2fa/enable', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function disableTwoFactor(input: TwoFactorDisableRequest) {
  return apiRequest<{ message: string }>('/api/auth/2fa/disable', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getSessions() {
  return apiRequest<SessionInfo[]>('/api/auth/sessions');
}

export function revokeSession(sessionId: string) {
  return apiRequest<{ message: string }>(`/api/auth/sessions/${sessionId}`, {
    method: 'DELETE',
  });
}

export function revokeAllOtherSessions() {
  return apiRequest<{ message: string; revokedCount: number }>('/api/auth/sessions/revoke-others', {
    method: 'POST',
  });
}
