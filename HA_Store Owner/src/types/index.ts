export type ApprovalStatus = 'approved' | 'pending' | 'rejected';
export type POIStatus = 'active' | 'inactive';
export type AudioStatus = 'enabled' | 'disabled';
export type HistoryStatus = 'completed' | 'partial' | 'skipped';

export interface StallOwnerPOI {
  id: number;
  name: string;
  nameEn: string;
  category: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  radius: number;
  image: string;
  listeningSessions: number;
  avgTime: string;
  approvalStatus: ApprovalStatus;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  status: POIStatus;
}

export interface Language {
  id: number;
  name: string;
  code: string;
  status: boolean;
  isDefault: boolean;
}

export interface AudioContent {
  id: number;
  poiId: number;
  poiName: string;
  language: string;
  title: string;
  ttsVoice: string;
  duration: string;
  status: AudioStatus;
}

export interface ListeningHistoryEntry {
  id: number;
  datetime: string;
  poi: string;
  language: string;
  duration: string;
  status: HistoryStatus;
}

export interface ActivityLog {
  id: number;
  time: string;
  action: string;
  icon: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'poi' | 'audio' | 'system' | 'approval';
  link?: string;
}

export interface StallOwnerProfile {
  name: string;
  email: string;
  phone: string;
  stallName: string;
  address: string;
  createdAt: string;
  avatar: string;
  accountStatus: ApprovalStatus;
}
