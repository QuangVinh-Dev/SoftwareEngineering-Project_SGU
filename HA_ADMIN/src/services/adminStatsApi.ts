import { apiRequest } from '@/services/authApi';
import type { ListeningHistoryEntry } from '@/types';

export interface TopPoiItem {
  name: string;
  sessions: number;
  avgTime: string;
}

export interface NamedTimeItem {
  name: string;
  time: number;
}

export interface TrendItem {
  date: string;
  sessions: number;
}

export interface AnalyticsStats {
  top10Pois: TopPoiItem[];
  avgTimeByPoi: NamedTimeItem[];
  avgTimeByLanguage: NamedTimeItem[];
  listeningTrend30Days: TrendItem[];
  listeningTrend3Months: TrendItem[];
  listeningTrend1Year: TrendItem[];
}

export interface HeatmapArea {
  id: number;
  name: string;
  x: number;
  y: number;
  sessions: number;
  languages?: string[];
  peakHour?: string;
  topPoi?: string;
  topLang?: string;
  avgTime?: string;
}

/**
 * Lấy lịch sử nghe thực tế từ backend (listen_log)
 * GET /api/admin/stats/history
 */
export function getListeningHistoryApi(): Promise<ListeningHistoryEntry[]> {
  return apiRequest<ListeningHistoryEntry[]>('/api/admin/stats/history');
}

/**
 * Lấy dữ liệu phân tích thống kê top POI, thời gian nghe và xu hướng
 * GET /api/admin/stats/analytics
 */
export function getAnalyticsStatsApi(): Promise<AnalyticsStats> {
  return apiRequest<AnalyticsStats>('/api/admin/stats/analytics');
}

/**
 * Lấy dữ liệu phân bố mật độ nghe trên bản đồ nhiệt theo tọa độ POI
 * GET /api/admin/stats/heatmap
 */
export function getHeatmapStatsApi(): Promise<HeatmapArea[]> {
  return apiRequest<HeatmapArea[]>('/api/admin/stats/heatmap');
}
