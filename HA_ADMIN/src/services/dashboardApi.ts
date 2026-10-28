import { apiRequest } from '@/services/authApi';

export interface DailyRevenue {
  /** Ngày dạng yyyy-MM-dd (múi giờ Việt Nam). */
  date: string;
  revenue: number;
  transactions: number;
}

export interface RevenueStats {  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  previousMonthRevenue: number;
  /** % tăng/giảm so với tháng trước. */
  growthPercent: number;
  paidTransactions: number;
  todayTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  averageOrderValue: number;
  daily: DailyRevenue[];
}

export interface TrafficPoint {
  /** Nhãn đã format sẵn từ backend: "08:00" hoặc "28/10". */
  label: string;
  visitors: number;
  listens: number;
}

export interface LanguageShare {
  code: string;
  listens: number;
  percent: number;
}

export interface RecentListen {
  id: number;
  poiName: string;
  languageCode: string;
  /** ISO kèm offset +07:00. */
  listenedAt: string;
}

export interface EngagementStats {
  totalListens: number;
  todayListens: number;
  weekListens: number;
  monthListens: number;
  todayDevices: number;
  totalDevices: number;
  totalVisitors: number;
  todayVisitors: number;
  completedListens: number;
  autoGpsListens: number;
  tapListens: number;
  day: TrafficPoint[];
  week: TrafficPoint[];
  month: TrafficPoint[];
  languages: LanguageShare[];
  recentListens: RecentListen[];
}

/**
 * Số tiền khách tham quan đã trả, backend chỉ tính giao dịch VNPay status = PAID.
 * GET /api/admin/stats/revenue (yêu cầu ROLE_ADMIN).
 */
export function getRevenueStats(): Promise<RevenueStats> {
  return apiRequest<RevenueStats>('/api/admin/stats/revenue');
}

/** Lượt nghe thuyết minh, lượt khách, ngôn ngữ — đều đọc từ listen_log/guest_session. */
export function getEngagementStats(): Promise<EngagementStats> {
  return apiRequest<EngagementStats>('/api/admin/stats/engagement');
}

/** 1234567 → "1.234.567" (không kèm ký hiệu tiền) */
export function formatVndNumber(value: number): string {
  return Math.round(value).toLocaleString('vi-VN');
}

/** 1.234.567 → "1.234.567 ₫" */
export function formatVnd(value: number): string {
  return `${formatVndNumber(value)} ₫`;
}

/** Rút gọn trục tiền: 320000 → "320k", 1250000 → "1,25tr" */
export function formatShortVnd(value: number): string {
  if (!Number.isFinite(value)) return '0';
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}tr`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${Math.round(value / 1_000)}k`;
  }
  return `${Math.round(value)}`;
}
