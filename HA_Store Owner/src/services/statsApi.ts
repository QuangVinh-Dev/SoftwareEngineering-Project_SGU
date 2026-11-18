import { apiRequest } from '@/services/authApi';

export type ListeningRange = 'day' | 'week' | 'month';

export interface ListeningStats {
  totalSessions: number;
  todaySessions: number;
  weekSessions: number;
  monthSessions: number;
  trend: { date: string; sessions: number }[];
  poiStats: { poiId: number; poiName: string; sessions: number }[];
}

export function getListeningStats(range: ListeningRange) {
  return apiRequest<ListeningStats>(`/api/merchant/stats/listening?range=${range}`);
}
