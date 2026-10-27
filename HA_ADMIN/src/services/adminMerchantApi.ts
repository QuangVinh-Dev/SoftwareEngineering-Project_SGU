import { apiRequest, API_BASE_URL } from '@/services/authApi';

export interface AdminMerchant {
  id: number;
  accountId: number;
  username: string;
  email: string;
  name: string;
  phoneNumber: string | null;
  address: string | null;
  category: string | null;
  description: string | null;
  planId: string | null;
  billingCycle: string | null;
  images: string[];
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  rejectReason: string | null;
  registeredAt: string | null;
  approvedAt: string | null;
}

export function getAdminMerchants(status?: string): Promise<AdminMerchant[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest<AdminMerchant[]>(`/api/admin/merchants${query}`);
}

export function approveMerchant(id: number): Promise<AdminMerchant> {
  return apiRequest<AdminMerchant>(`/api/admin/merchants/${id}/approve`, {
    method: 'PATCH',
  });
}

export function rejectMerchant(id: number, reason?: string): Promise<AdminMerchant> {
  return apiRequest<AdminMerchant>(`/api/admin/merchants/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason: reason?.trim() || null }),
  });
}

export function resolveMerchantImageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return new URL(path, API_BASE_URL ? `${API_BASE_URL}/` : `${window.location.origin}/`).toString();
}
