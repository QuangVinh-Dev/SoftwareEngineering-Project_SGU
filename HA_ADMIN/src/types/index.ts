export type POIStatus = 'active' | 'inactive';
export type AudioStatus = 'enabled' | 'disabled';
export type HistoryStatus = 'completed' | 'partial' | 'skipped';

export interface POI {
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
  device: string;
  status: HistoryStatus;
}

export interface TTSVoice {
  id: number;
  voice: string;
  language: string;
  gender: 'Male' | 'Female';
  status: boolean;
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
  type: 'poi' | 'report' | 'language' | 'system';
  link?: string;
}

export interface KPIData {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  sublabel: string;
  icon: string;
  color: string;
}
