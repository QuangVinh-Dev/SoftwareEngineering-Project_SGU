import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, apiMessage } from '@/services/authApi';
import {
  getRevenueStats,
  getEngagementStats,
  formatVnd,
  formatVndNumber,
  formatShortVnd,
  type RevenueStats,
  type EngagementStats,
  type TrafficPoint,
} from '@/services/dashboardApi';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Users, MapPin, Store, Clock,
  ArrowUpRight, ArrowRight, Activity, Globe2, ShieldCheck,
  Radio, CheckCircle2, ChevronRight, Zap, AlertCircle, LoaderCircle
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useApp } from '@/hooks/useApp';
import { formatNumber } from '@/utils/helpers';

// Nhãn ngày ngắn gọn cho trục biểu đồ doanh thu: "2026-10-28" → "28/10"
function formatDayLabel(isoDate: string) {
  const [, month, day] = isoDate.split('-');
  return day && month ? `${day}/${month}` : isoDate;
}

const LANGUAGE_NAMES: Record<string, string> = {
  vi: 'Tiếng Việt',
  en: 'Tiếng Anh',
  ja: 'Tiếng Nhật',
  ko: 'Tiếng Hàn',
  zh: 'Tiếng Trung',
};

function languageName(code: string) {
  return LANGUAGE_NAMES[code] ?? (code === 'unknown' ? 'Không xác định' : code.toUpperCase());
}

/** "2026-10-28T10:30:00+07:00" → "12 phút trước" */
function relativeTime(iso: string) {
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return '';
  const minutes = Math.floor((Date.now() - time) / 60_000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(time).toLocaleDateString('vi-VN');
}

function percentText(value: number) {
  return `${value.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`;
}


export default function Dashboard() {
  const { setCurrentPage } = useApp();
  const [cycle, setCycle] = useState<'day' | 'week' | 'month'>('week');
  const [onlineVisitors, setOnlineVisitors] = useState<number>(0);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState('');
  const [engagement, setEngagement] = useState<EngagementStats | null>(null);
  const [engagementLoading, setEngagementLoading] = useState(true);
  const [engagementError, setEngagementError] = useState('');

  // Dữ liệu thật: payment (doanh thu) + listen_log/guest_session (lượt nghe, lượt khách).
  const fetchStats = useCallback(async () => {
    const [revenueResult, engagementResult] = await Promise.allSettled([
      getRevenueStats(),
      getEngagementStats(),
    ]);

    if (revenueResult.status === 'fulfilled') {
      setRevenue(revenueResult.value);
      setRevenueError('');
    } else {
      setRevenueError(apiMessage(revenueResult.reason));
    }

    if (engagementResult.status === 'fulfilled') {
      setEngagement(engagementResult.value);
      setEngagementError('');
    } else {
      setEngagementError(apiMessage(engagementResult.reason));
    }

    setRevenueLoading(false);
    setEngagementLoading(false);
  }, []);

  useEffect(() => {
    void fetchStats();
    // Khách vừa thanh toán hoặc vừa nghe xong thì số liệu tự cập nhật sau 30 giây.
    const interval = setInterval(() => { void fetchStats(); }, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const revenueChartData = (revenue?.daily ?? []).map(point => ({
    label: formatDayLabel(point.date),
    revenue: point.revenue,
    transactions: point.transactions,
  }));

  const trafficAndAudioData: Record<'day' | 'week' | 'month', TrafficPoint[]> = {
    day: engagement?.day ?? [],
    week: engagement?.week ?? [],
    month: engagement?.month ?? [],
  };

  const languages = engagement?.languages ?? [];
  const totalLanguageListens = languages.reduce((sum, item) => sum + item.listens, 0);
  const domesticListens = languages.find(item => item.code === 'vi')?.listens ?? 0;
  const internationalListens = Math.max(totalLanguageListens - domesticListens, 0);
  const internationalPercent = totalLanguageListens > 0
    ? (internationalListens * 100) / totalLanguageListens
    : 0;
  const domesticPercent = totalLanguageListens > 0 ? 100 - internationalPercent : 0;
  const internationalData = [
    { name: 'Du khách quốc tế', value: internationalPercent, color: '#a4db77' },
    { name: 'Du khách nội địa', value: domesticPercent, color: '#286b7b' },
  ];
  const recentListens = engagement?.recentListens ?? [];

  const listenedCount = engagement?.totalListens ?? 0;
  const completionRate = listenedCount > 0
    ? ((engagement?.completedListens ?? 0) * 100) / listenedCount
    : 0;
  const autoGpsRate = listenedCount > 0
    ? ((engagement?.autoGpsListens ?? 0) * 100) / listenedCount
    : 0;
  const tapRate = listenedCount > 0
    ? ((engagement?.tapListens ?? 0) * 100) / listenedCount
    : 0;
  const listenerRate = engagement && engagement.totalVisitors > 0
    ? (engagement.totalDevices * 100) / engagement.totalVisitors
    : 0;

  useEffect(() => {
    let isMounted = true;
    const fetchOnlineCount = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/public/visitor/count`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && typeof data.onlineCount === 'number') {
            setOnlineVisitors(data.onlineCount);
          }
        }
      } catch {
        // fallback ignore
      }
    };

    fetchOnlineCount();
    const interval = setInterval(fetchOnlineCount, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* =========================================================================
          ROW 1: 3 TOP KPI CARDS — chỉ hiển thị số liệu chính
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Du khách trực tuyến */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow min-w-0">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Du khách trực tuyến
            </span>
          </div>
          <div className="mt-5 flex flex-wrap items-baseline gap-2">
            <span className="text-4xl 2xl:text-5xl font-extrabold text-[#183a54] tracking-tight tabular-nums">
              {onlineVisitors.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 2: Lượt nghe thuyết minh — số liệu thật từ bảng listen_log */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow min-w-0">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Lượt nghe thuyết minh
            </span>
          </div>

          {engagementError ? (
            <div className="mt-4 flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {engagementError}{' '}
                <button
                  type="button"
                  onClick={() => void fetchStats()}
                  className="font-bold underline underline-offset-2 hover:text-rose-900"
                >
                  Thử lại
                </button>
              </span>
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap items-baseline gap-2">
              <span className="text-4xl 2xl:text-5xl font-extrabold text-[#183a54] tracking-tight tabular-nums">
                {engagementLoading && !engagement ? '—' : formatNumber(engagement?.totalListens ?? 0)}
              </span>
              <span className="text-xs font-bold text-[#286b7b] bg-[#f0f8f9] px-2 py-0.5 rounded">
                {formatNumber(engagement?.todayListens ?? 0)} hôm nay
              </span>
            </div>
          )}
        </div>

        {/* Card 3: Doanh thu — số liệu thật từ /api/admin/stats/revenue */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow min-w-0">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Doanh thu (VNĐ)
            </span>
          </div>

          {revenueError ? (
            <div className="mt-4 flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {revenueError}{' '}
                <button
                  type="button"
                  onClick={() => void fetchStats()}
                  className="font-bold underline underline-offset-2 hover:text-rose-900"
                >
                  Thử lại
                </button>
              </span>
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap items-baseline gap-2">
              <span className="text-4xl 2xl:text-5xl font-extrabold text-[#183a54] tracking-tight tabular-nums">
                {revenueLoading && !revenue ? '—' : formatVndNumber(revenue?.totalRevenue ?? 0)}
              </span>
              <span className="text-base font-bold text-slate-500">₫</span>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          ROW 2: 2 MAIN CHARTS (Double Bar Chart + Line Chart with Dots)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Double Bar Chart (Teal & Lime) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 mb-6">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[#183a54] leading-snug">
                Lượt du khách & Lượt nghe thuyết minh
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Khách truy cập mới và lượt nghe thuyết minh thật từ hệ thống
              </p>
            </div>

            {/* Cycle Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg shrink-0">
              <button
                onClick={() => setCycle('day')}
                className={`px-3 py-1 text-xs font-bold rounded-md whitespace-nowrap transition-all ${
                  cycle === 'day' ? 'bg-[#286b7b] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hôm nay
              </button>
              <button
                onClick={() => setCycle('week')}
                className={`px-3 py-1 text-xs font-bold rounded-md whitespace-nowrap transition-all ${
                  cycle === 'week' ? 'bg-[#286b7b] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tuần này
              </button>
              <button
                onClick={() => setCycle('month')}
                className={`px-3 py-1 text-xs font-bold rounded-md whitespace-nowrap transition-all ${
                  cycle === 'month' ? 'bg-[#286b7b] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tháng này
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mb-4 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#286b7b]" />
              <span>Lượt du khách</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#a4db77]" />
              <span>Lượt nghe audio</span>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="h-[260px] w-full relative">
            {engagement && trafficAndAudioData[cycle].length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trafficAndAudioData[cycle]} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    interval={cycle === 'day' ? 3 : cycle === 'month' ? 4 : 0}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    formatter={(val: any, name: any) => [formatNumber(Number(val)), name]}
                    contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="visitors" name="Lượt du khách" fill="#286b7b" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="listens" name="Lượt nghe audio" fill="#a4db77" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 grid place-items-center text-center px-6">
                {engagementError ? (
                  <p className="text-xs text-rose-700 flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {engagementError}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                    Đang tải lượt nghe…
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Doanh thu 7 ngày gần nhất (số liệu thật) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-[#183a54]">
                Doanh thu 7 ngày gần nhất
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tiền khách tham quan đã thanh toán qua VNPay, cộng dồn theo ngày
              </p>
            </div>
            <span className="text-xs font-bold text-[#286b7b] bg-[#f0f8f9] px-2.5 py-1 rounded-full flex items-center gap-1 whitespace-nowrap shrink-0">
              {revenueLoading && <LoaderCircle className="w-3 h-3 animate-spin" />}
              {revenueLoading ? 'Đang cập nhật' : 'Trực tiếp'}
            </span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mb-4 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-1.5 rounded-full bg-[#a4db77]" />
              <span>Doanh thu (VNĐ)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-1.5 rounded-full bg-[#286b7b]" />
              <span>Số giao dịch</span>
            </div>
          </div>

          {/* Line Chart */}
          <div className="h-[260px] w-full relative">
            {revenue && revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueChartData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis
                    yAxisId="money"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={value => formatShortVnd(Number(value))}
                  />
                  <YAxis
                    yAxisId="count"
                    orientation="right"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => name === 'Doanh thu'
                      ? [formatVnd(Number(value)), 'Doanh thu']
                      : [`${formatNumber(Number(value))} giao dịch`, 'Số giao dịch']}
                    contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Line
                    yAxisId="money"
                    type="monotone"
                    dataKey="revenue"
                    name="Doanh thu"
                    stroke="#a4db77"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#a4db77', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#286b7b' }}
                  />
                  <Line
                    yAxisId="count"
                    type="monotone"
                    dataKey="transactions"
                    name="Số giao dịch"
                    stroke="#286b7b"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={{ r: 3, fill: '#286b7b', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 5, fill: '#a4db77' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 grid place-items-center text-center px-6">
                {revenueError ? (
                  <p className="text-xs text-rose-700 flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {revenueError}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                    Đang tải doanh thu…
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 3: 3 BOTTOM CARDS (Ngôn ngữ · Chất lượng vận hành · Lượt nghe mới nhất)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Donut Chart — tỷ lệ ngôn ngữ thật từ listen_log */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#183a54]">
              Tỷ lệ du khách quốc tế
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Phân bổ ngôn ngữ của {formatNumber(totalLanguageListens)} lượt nghe thuyết minh
            </p>

            <div className="relative h-[180px] flex items-center justify-center my-4">
              {totalLanguageListens > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={internationalData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {internationalData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any, name: any) => [percentText(Number(value)), name]} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-extrabold text-[#183a54]">
                      {percentText(internationalPercent)}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">Quốc tế</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400">Chưa có lượt nghe nào để tính tỷ lệ</p>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#a4db77]" />
                  Du khách quốc tế (EN, JA, KO, ZH)
                </span>
                <span className="font-bold text-[#183a54]">
                  {percentText(internationalPercent)}
                  <span className="ml-1 font-normal text-slate-400">
                    ({formatNumber(internationalListens)})
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#286b7b]" />
                  Du khách nội địa (Tiếng Việt)
                </span>
                <span className="font-bold text-[#183a54]">
                  {percentText(domesticPercent)}
                  <span className="ml-1 font-normal text-slate-400">
                    ({formatNumber(domesticListens)})
                  </span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setCurrentPage('reports')}
            className="w-full mt-6 py-2.5 px-4 rounded-xl bg-[#286b7b] hover:bg-[#205764] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            Xem báo cáo phân tích ngôn ngữ <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Performance & Geofence progress bars */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#183a54]">
              Chất lượng vận hành di sản
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Các tỷ lệ tính trực tiếp từ lượt nghe thật trong hệ thống
            </p>

            <div className="space-y-4 my-4">
              {/* Metric 1: khách đã mở audio */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Khách đã mở audio thuyết minh</span>
                  <span className="text-[#286b7b] font-bold">
                    {percentText(listenerRate)}
                    <span className="ml-1 font-normal text-slate-400">
                      ({formatNumber(engagement?.totalDevices ?? 0)}/{formatNumber(engagement?.totalVisitors ?? 0)})
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-[#286b7b] rounded-full" style={{ width: `${Math.min(listenerRate, 100)}%` }} />
                </div>
              </div>

              {/* Metric 2: nghe hết */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Tỷ lệ nghe hết thuyết minh</span>
                  <span className="text-[#87c33b] font-bold">
                    {percentText(completionRate)}
                    <span className="ml-1 font-normal text-slate-400">
                      ({formatNumber(engagement?.completedListens ?? 0)}/{formatNumber(listenedCount)})
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-[#a4db77] rounded-full" style={{ width: `${Math.min(completionRate, 100)}%` }} />
                </div>
              </div>

              {/* Metric 3: kích hoạt GPS */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Kích hoạt tự động bằng Geofence</span>
                  <span className="text-[#286b7b] font-bold">
                    {percentText(autoGpsRate)}
                    <span className="ml-1 font-normal text-slate-400">
                      ({formatNumber(engagement?.autoGpsListens ?? 0)})
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-[#286b7b] rounded-full" style={{ width: `${Math.min(autoGpsRate, 100)}%` }} />
                </div>
              </div>

              {/* Metric 4: chạm / quét QR */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Kích hoạt bằng chạm / quét QR</span>
                  <span className="text-[#87c33b] font-bold">
                    {percentText(tapRate)}
                    <span className="ml-1 font-normal text-slate-400">
                      ({formatNumber(engagement?.tapListens ?? 0)})
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-[#a4db77] rounded-full" style={{ width: `${Math.min(tapRate, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setCurrentPage('poi')}
            className="w-full mt-6 py-2.5 px-4 rounded-xl bg-[#286b7b] hover:bg-[#205764] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            Quản lý điểm tham quan POI <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Lượt nghe mới nhất — dữ liệu thật từ listen_log */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#183a54] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#286b7b]" />
                Lượt nghe mới nhất
              </h3>
              <span className={`w-2 h-2 rounded-full animate-pulse ${engagementError ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            </div>

            {engagementError && (
              <p className="text-xs text-rose-700 flex items-start gap-1.5 mb-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {engagementError}
              </p>
            )}

            <div className="space-y-3.5">
              {engagementLoading && !engagement && (
                <p className="text-xs text-slate-400 flex items-center gap-2">
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  Đang tải nhật ký nghe…
                </p>
              )}

              {!engagementLoading && recentListens.length === 0 && (
                <p className="text-xs text-slate-400">
                  Chưa có lượt nghe nào được ghi nhận.
                </p>
              )}

              {recentListens.map(item => (
                <div key={item.id} className="flex items-start gap-3 text-xs pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <span className="w-2 h-2 rounded-full bg-[#286b7b] mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-slate-700 font-medium leading-relaxed">
                      {item.poiName} · {languageName(item.languageCode)}
                    </p>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      {relativeTime(item.listenedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setCurrentPage('history')}
            className="w-full mt-6 py-2.5 px-4 rounded-xl bg-[#286b7b] hover:bg-[#205764] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            Xem nhật ký nghe du khách <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
