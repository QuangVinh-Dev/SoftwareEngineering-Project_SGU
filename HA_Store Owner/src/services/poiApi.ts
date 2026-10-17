import { apiRequest, API_BASE_URL } from '@/services/authApi';

export interface MerchantPoi {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  priorityLevel: number;
  originalDescription: string | null;
  directionLink: string | null;
  status: 'ACTIVE' | 'INACTIVE' | string;
  approvalStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | string;
  rejectionReason: string | null;
  images: string[];
}

export interface MerchantPoiInput {
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  priorityLevel: number;
  originalDescription: string;
  directionLink: string;
  status: 'ACTIVE';
}

export function getMerchantPois() {
  return apiRequest<MerchantPoi[]>('/api/merchant/pois');
}

export function createMerchantPoi(poi: MerchantPoiInput, images: File[]) {
  const formData = new FormData();
  formData.append('poi', new Blob([JSON.stringify(poi)], { type: 'application/json' }));
  images.forEach(image => formData.append('images', image));
  return apiRequest<MerchantPoi>('/api/merchant/pois', { method: 'POST', body: formData });
}

export function resolveMerchantPoiImage(path: string) {
  return new URL(path, API_BASE_URL ? `${API_BASE_URL}/` : `${window.location.origin}/`).toString();
}
