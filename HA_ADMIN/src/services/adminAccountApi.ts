import { apiRequest } from '@/services/authApi';

export interface AdminAccount {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'MERCHANT';
  accountType?: string;
  status: 'ACTIVE' | 'LOCKED';
  createdAt: string;
  lastLogin?: string;
}

export interface ActionLog {
  id: number;
  time: string;
  date: string;
  username: string;
  role: string;
  action: string;
  target: string;
  ip: string;
}

export interface CreateAccountPayload {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: string;
}

export interface UpdateAccountPayload {
  fullName: string;
  email: string;
  role: string;
}

export function getAdminAccounts(): Promise<AdminAccount[]> {
  return apiRequest<AdminAccount[]>('/api/admin/accounts');
}

export function updateAccountStatus(id: number, status?: string): Promise<AdminAccount> {
  return apiRequest<AdminAccount>(`/api/admin/accounts/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function createAdminAccount(data: CreateAccountPayload): Promise<AdminAccount> {
  return apiRequest<AdminAccount>('/api/admin/accounts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateAdminAccount(id: number, data: UpdateAccountPayload): Promise<AdminAccount> {
  return apiRequest<AdminAccount>(`/api/admin/accounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function getActionLogs(): Promise<ActionLog[]> {
  return apiRequest<ActionLog[]>('/api/admin/accounts/logs');
}
