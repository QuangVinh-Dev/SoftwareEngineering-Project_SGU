import { useEffect, useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Headphones, Calendar, TrendingUp, MapPin,
  Sparkles, Award, RefreshCw, BarChart2, Store
} from 'lucide-react';
import { Card, CardHeader, Button, Badge } from '@/components/ui';
import { useApp } from '@/hooks/useApp';
import { ApiError } from '@/services/authApi';
import { getListeningStats, type ListeningRange, type ListeningStats } from '@/services/statsApi';
import { getMerchantPois, type MerchantPoi } from '@/services/poiApi';
import { formatNumber } from '@/utils/helpers';

const ranges: { key: ListeningRange; label: string; periodText: string }[] = [
  { key: 'day', label: 'Hôm nay', periodText: 'trong ngày hôm nay' },
  { key: 'week', label: '7 ngày qua', periodText: 'trong 7 ngày gần nhất' },
  { key: 'month', label: '30 ngày qua', periodText: 'trong 30 ngày gần nhất' },
];

export default function Stats() {
  const { signOut } = useApp();
  const [range, setRange] = useState<ListeningRange>('week');
  const [data, setData] = useState<ListeningStats | null>(null);
  const [poi, setPoi] = useState<MerchantPoi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.allSettled([
      getListeningStats(range),
      getMerchantPois(),
    ]).then(([statsRes, poisRes]) => {
      if (!active) return;
      if (statsRes.status === 'fulfilled') {
        setData(statsRes.value);
      } else {
        const cause = statsRes.reason;
        if (cause instanceof ApiError && cause.status === 401) {
          signOut();
          return;
        }
        setError(
          cause instanceof ApiError && cause.status === 403
            ? 'Tài khoản hiện tại không có quyền xem thống kê gian hàng.'
            : cause instanceof Error ? cause.message : 'Không tải được thống kê. Vui lòng thử lại.'
        );
      }

      if (poisRes.status === 'fulfilled' && poisRes.value.length > 0) {
        setPoi(poisRes.value[0]);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [range, reload, signOut]);

  const selectedTotal = range === 'day'
    ? data?.todaySessions
    : range === 'week'
    ? data?.weekSessions
    : data?.monthSessions;

  const poiName = poi?.name || (data?.poiStats && data.poiStats.length > 0 ? data.poiStats[0].poiName : 'Điểm tham quan gian hàng');

  return (
    <div className="space-y-6">
      {/* Title & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#7c3aed] uppercase tracking-wider mb-1">
            <Store className="w-4 h-4" />
            <span>3. Xem thống kê lượt nghe POI của mình</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Thống kê lượt nghe POI
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Dữ liệu lắng nghe bài thuyết minh tự động của điểm tham quan gắn với gian hàng.
          </p>
        </div>

        {/* 3.1.1 Chọn POI & 3.2.1 Chọn khoảng thời gian */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 3.1.1 POI Badge / Selector (1 chủ gian hàng chỉ có 1 POI) */}
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-200/80 rounded-xl px-3.5 py-1.5 shadow-sm text-xs font-bold text-[#7c3aed]">
            <MapPin className="w-4 h-4 text-[#7c3aed] flex-shrink-0" />
            <span className="truncate max-w-[200px]">{poiName}</span>
          </div>

          {/* 3.2.1 Chọn khoảng thời gian (Ngày / Tuần / Tháng) */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            {ranges.map(item => (
              <button
                key={item.key}
                onClick={() => setRange(item.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  range === item.key
                    ? 'bg-[#7c3aed] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setReload(v => v + 1)}
            disabled={loading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between">
          <p>{error}</p>
          <Button size="sm" variant="secondary" onClick={() => setReload(v => v + 1)}>Thử lại</Button>
        </div>
      )}

      {loading && (
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-4 border-purple-200 border-t-[#7c3aed] rounded-full animate-spin mb-2" />
          <p className="text-sm text-slate-500 font-medium">Đang tải số liệu thống kê lượt nghe…</p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* POI Info Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-white to-purple-50/50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7c3aed] text-white flex items-center justify-center font-bold shadow-md shadow-purple-900/20">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-sm">{poiName}</h3>
                  <Badge variant="active">Đang phát sóng</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Điểm tham quan duy nhất của gian hàng · Định vị GPS kích hoạt tự động
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 bg-white px-3 py-1.5 rounded-xl border border-purple-100 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Chế độ thuyết minh đa ngôn ngữ</span>
            </div>
          </div>

          {/* 3.1.2 Xem số lượt nghe: 3 KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 border border-purple-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7c3aed] flex items-center justify-center flex-shrink-0">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Tổng lượt nghe tích lũy
                </p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">
                  {formatNumber(data.totalSessions)}
                </p>
                <p className="text-[11px] text-[#7c3aed] font-medium mt-0.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Toàn thời gian phát sóng
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 border border-purple-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Lượt nghe {ranges.find(r => r.key === range)?.periodText}
                </p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">
                  {formatNumber(selectedTotal ?? 0)}
                </p>
                <p className="text-[11px] text-violet-600 font-medium mt-0.5">
                  Bộ lọc: {ranges.find(r => r.key === range)?.label}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 border border-purple-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Lượt nghe hôm nay
                </p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">
                  {formatNumber(data.todaySessions)}
                </p>
                <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                  Du khách ghé thăm hôm nay
                </p>
              </div>
            </div>
          </div>

          {/* 3.2.2 Xem biểu đồ: Chart Area in Purple Theme */}
          {data.totalSessions === 0 ? (
            <Card>
              <div className="py-14 text-center">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7c3aed] flex items-center justify-center mx-auto mb-3">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <p className="text-base font-bold text-slate-800">Chưa có dữ liệu lượt nghe</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Khi du khách sử dụng ứng dụng Hội An Heritage để nghe thuyết minh điểm tham quan của bạn, biểu đồ thống kê sẽ hiển thị tại đây.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 3.2.2 Biểu đồ xu hướng lượt nghe theo thời gian */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader
                    title="Xu hướng du khách lắng nghe thuyết minh"
                    subtitle={`Dữ liệu ${ranges.find(item => item.key === range)?.periodText}`}
                  />
                  <div className="h-80 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="purpleStatsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#2e1065',
                            borderColor: '#3b0764',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '12px',
                          }}
                          itemStyle={{ color: '#c084fc' }}
                          formatter={(value) => [`${formatNumber(Number(value))} lượt nghe`, 'Lượt nghe']}
                        />
                        <Area
                          type="monotone"
                          dataKey="sessions"
                          stroke="#7c3aed"
                          strokeWidth={3}
                          fill="url(#purpleStatsGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* Chi tiết từng mốc thời gian */}
              <div>
                <Card noPadding>
                  <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Chi tiết lượt nghe theo mốc
                    </h3>
                    <Badge variant="active">Realtime</Badge>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto scrollbar-thin">
                    {data.trend.slice().reverse().map((point, idx) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{point.date}</p>
                          <p className="text-[11px] text-slate-400">Ghi nhận từ du khách</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-[#7c3aed]">
                            {formatNumber(point.sessions)}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">lượt</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 text-center">
                    <p className="text-[11px] text-slate-500">
                      Dữ liệu được cập nhật theo thời gian thực từ ứng dụng di động.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
