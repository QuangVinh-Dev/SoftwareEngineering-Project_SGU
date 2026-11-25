import { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Card, CardHeader, Badge, Button } from '@/components/ui';
import { useApp } from '@/hooks/useApp';
import { getMerchantPois, resolveMerchantPoiImage, type MerchantPoi } from '@/services/poiApi';
import { getListeningStats, type ListeningRange, type ListeningStats } from '@/services/statsApi';
import { formatNumber } from '@/utils/helpers';
import { ApiError } from '@/services/authApi';

const ranges: { key: ListeningRange; label: string; periodText: string }[] = [
  { key: 'day', label: 'Hôm nay', periodText: 'trong ngày hôm nay' },
  { key: 'week', label: '7 ngày qua', periodText: 'trong 7 ngày gần nhất' },
  { key: 'month', label: '30 ngày qua', periodText: 'trong 30 ngày gần nhất' },
];

export default function Dashboard() {
  const { setCurrentPage, authUser, signOut } = useApp();
  const [poi, setPoi] = useState<MerchantPoi | null>(null);
  const [stats, setStats] = useState<ListeningStats | null>(null);
  const [range, setRange] = useState<ListeningRange>('week');
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);

  const loadData = useCallback(async (activeRange: ListeningRange) => {
    try {
      const [poisResult, statsResult] = await Promise.allSettled([
        getMerchantPois(),
        getListeningStats(activeRange),
      ]);

      if (poisResult.status === 'fulfilled' && Array.isArray(poisResult.value)) {
        setPoi(poisResult.value.length > 0 ? poisResult.value[0] : null);
      }

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
      }
    } catch (cause: unknown) {
      if (cause instanceof ApiError && cause.status === 401) {
        signOut();
        return;
      }
    } finally {
      setLoading(false);
      setLoadingStats(false);
    }
  }, [signOut]);

  useEffect(() => {
    void loadData(range);
  }, [loadData, range]);

  const handleRangeChange = async (newRange: ListeningRange) => {
    setRange(newRange);
    setLoadingStats(true);
    try {
      const res = await getListeningStats(newRange);
      setStats(res);
    } catch {
      // Giữ nguyên stats cũ nếu lỗi
    } finally {
      setLoadingStats(false);
    }
  };

  const isApproved = poi?.approvalStatus === 'APPROVED';
  const isPending = poi?.approvalStatus === 'PENDING';
  const isRejected = poi?.approvalStatus === 'REJECTED';

  const selectedTotal = range === 'day'
    ? stats?.todaySessions
    : range === 'week'
    ? stats?.weekSessions
    : stats?.monthSessions;

  return (
    <div className="space-y-6">
      {/* 1. Welcome Banner Tinh Gọn & Sang Trọng */}
      <div className="rounded-2xl bg-gradient-to-r from-[#183a54] via-[#1f4f72] to-[#286b7b] p-6 lg:p-7 text-white shadow-sm border border-slate-700/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <p className="text-teal-200 text-xs font-bold uppercase tracking-wider mb-1">
              Cổng quản trị gian hàng • Hội An Heritage
            </p>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Xin chào, {authUser?.fullName || authUser?.username || 'Chủ gian hàng'}!
            </h1>
            <p className="mt-1 text-sm text-slate-200 max-w-xl leading-relaxed">
              Theo dõi lượt nghe thuyết minh tự động, tình trạng thẩm định và quản lý điểm tham quan (POI) của gian hàng.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {poi ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage('my-poi')}
                className="bg-white text-[#183a54] hover:bg-slate-100 font-bold border-none px-4 py-2"
              >
                Xem POI của tôi
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage('my-poi')}
                className="bg-white text-[#183a54] hover:bg-slate-100 font-bold border-none px-4 py-2"
              >
                Thiết lập POI mới
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. 4 Thẻ KPI Tinh Gọn (Không dùng icon màu mè rối mắt) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Trạng thái POI */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Trạng thái POI</span>
            {poi && (
              <Badge variant={isApproved ? 'approved' : isPending ? 'pending' : 'rejected'}>
                {isApproved ? 'Đã duyệt' : isPending ? 'Chờ duyệt' : 'Từ chối'}
              </Badge>
            )}
          </div>
          <div className="mt-3">
            <span className={`text-xl font-extrabold tracking-tight ${
              isApproved ? 'text-emerald-700' :
              isPending ? 'text-amber-600' :
              isRejected ? 'text-rose-600' :
              'text-slate-600'
            }`}>
              {!poi ? 'Chưa thiết lập' : isApproved ? 'Đang phát sóng' : isPending ? 'Đang xét duyệt' : 'Cần chỉnh sửa'}
            </span>
            <p className="mt-1 text-xs text-slate-500 truncate">
              {poi ? poi.name : 'Vui lòng nộp thông tin điểm POI'}
            </p>
          </div>
        </div>

        {/* KPI 2: Lượt nghe hôm nay */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Lượt nghe hôm nay</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#286b7b] tracking-tight tabular-nums">
                {stats?.todaySessions ? formatNumber(stats.todaySessions) : '0'}
              </span>
              <span className="text-xs font-semibold text-slate-500">lượt</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">Du khách ghé thăm trong ngày</p>
        </div>

        {/* KPI 3: Lượt nghe trong kỳ lọc */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Lượt nghe {ranges.find(r => r.key === range)?.label.toLowerCase()}
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#183a54] tracking-tight tabular-nums">
                {selectedTotal ? formatNumber(selectedTotal) : '0'}
              </span>
              <span className="text-xs font-semibold text-slate-500">lượt</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Kỳ lọc: {ranges.find(r => r.key === range)?.label}
          </p>
        </div>

        {/* KPI 4: Tổng lượt nghe tích lũy */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng lượt nghe tích lũy</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-700 tracking-tight tabular-nums">
                {stats?.totalSessions ? formatNumber(stats.totalSessions) : '0'}
              </span>
              <span className="text-xs font-semibold text-slate-500">lượt</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">Toàn thời gian kích hoạt</p>
        </div>
      </div>

      {/* 3. Khu vực Thống kê Lượt nghe & Biểu đồ Xu hướng */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Thống kê lượt nghe thuyết minh
              </h2>
              <Badge variant="active">Thời gian thực</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {poi ? `Dữ liệu lượt nghe của "${poi.name}" kích hoạt tự động theo tọa độ GPS.` : 'Dữ liệu lắng nghe bài thuyết minh tự động.'}
            </p>
          </div>

          {/* Bộ lọc thời gian (Ngày / Tuần / Tháng) & Nút Làm mới */}
          <div className="flex items-center gap-2.5">
            <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
              {ranges.map(item => (
                <button
                  key={item.key}
                  onClick={() => handleRangeChange(item.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    range === item.key
                      ? 'bg-[#286b7b] text-white shadow-sm'
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
              onClick={() => handleRangeChange(range)}
              disabled={loadingStats}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />}
            >
              Làm mới
            </Button>
          </div>
        </div>

        {/* Biểu đồ xu hướng AreaChart */}
        {loadingStats ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-[#286b7b] rounded-full animate-spin mb-2" />
            <p className="text-xs text-slate-500">Đang cập nhật biểu đồ thống kê…</p>
          </div>
        ) : stats?.totalSessions === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-bold text-slate-700">Chưa ghi nhận lượt nghe nào</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Khi du khách di chuyển vào bán kính GPS của gian hàng và nghe thuyết minh, số liệu sẽ tự động xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-5">
            {/* AreaChart */}
            <div className="lg:col-span-2">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashboardStatsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#286b7b" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#286b7b" stopOpacity={0.0} />
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
                        backgroundColor: '#183a54',
                        borderColor: '#286b7b',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      itemStyle={{ color: '#84c5cf' }}
                      formatter={(value) => [`${formatNumber(Number(value))} lượt nghe`, 'Lượt nghe']}
                    />
                    <Area
                      type="monotone"
                      dataKey="sessions"
                      stroke="#286b7b"
                      strokeWidth={2.5}
                      fill="url(#dashboardStatsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chi tiết từng mốc thời gian */}
            <div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Nhật ký ghi nhận gần nhất
                </p>
                <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin divide-y divide-slate-100">
                  {(stats?.trend || []).slice().reverse().map((point, idx) => (
                    <div key={idx} className="pt-2 pb-1 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{point.date}</p>
                        <p className="text-[10px] text-slate-400">Định vị GPS Geofence</p>
                      </div>
                      <span className="font-bold text-[#286b7b] bg-[#f0f8f9] px-2.5 py-1 rounded-md border border-[#286b7b]/20">
                        {formatNumber(point.sessions)} lượt
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Thông tin POI của gian hàng & Quy trình xét duyệt */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Điểm tham quan (POI) của gian hàng"
              subtitle="Mỗi gian hàng quản lý duy nhất 1 điểm thuyết minh tại Hội An"
              action={
                poi && (
                  <Button size="sm" variant="secondary" onClick={() => setCurrentPage('my-poi')}>
                    Chi tiết POI
                  </Button>
                )
              }
            />

            {loading ? (
              <p className="py-12 text-center text-sm text-slate-400">Đang tải thông tin điểm tham quan...</p>
            ) : !poi ? (
              <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200">
                <h4 className="text-sm font-bold text-slate-800">Chưa thiết lập điểm tham quan</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Hãy gửi hồ sơ điểm POI của gian hàng để du khách có thể nghe thuyết minh khi đến gần vị trí quán.
                </p>
                <Button size="sm" className="mt-4" onClick={() => setCurrentPage('my-poi')}>
                  Thiết lập POI ngay
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
                {poi.images && poi.images.length > 0 && poi.images[0] ? (
                  <img
                    src={resolveMerchantPoiImage(poi.images[0])}
                    alt={poi.name}
                    className="w-full sm:w-44 h-36 rounded-xl object-cover border border-slate-200 shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-full sm:w-44 h-36 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0 text-xs font-semibold border border-slate-200">
                    Chưa có ảnh
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">{poi.name}</h3>
                    <Badge variant={isApproved ? 'approved' : isPending ? 'pending' : 'rejected'}>
                      {isApproved ? 'Đã duyệt' : isPending ? 'Chờ duyệt' : 'Từ chối'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {poi.originalDescription || 'Chưa cập nhật nội dung giới thiệu thuyết minh.'}
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px]">
                      {poi.latitude.toFixed(4)}, {poi.longitude.toFixed(4)}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100">
                      Bán kính: <strong>{poi.radius}m</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100">
                      Hình ảnh: <strong>{poi.images ? poi.images.length : 0}/5</strong>
                    </span>
                  </div>
                  <div className="pt-3 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setCurrentPage('edit-poi')}>
                      Chỉnh sửa thông tin
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setCurrentPage('my-poi')}>
                      Xem chi tiết POI
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* 5. Quy trình 3 bước xét duyệt tinh gọn */}
        <div>
          <Card>
            <CardHeader title="Quy trình phê duyệt POI" subtitle="3 bước kiểm duyệt & phát sóng" />
            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-200">
                  1
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Gửi thông tin POI</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Nhập tên quán, tọa độ GPS, bán kính quét và hình ảnh đại diện.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-200">
                  2
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Ban quản lý xét duyệt</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Admin kiểm tra vị trí thực tế tại Phố Cổ và phê duyệt.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-200">
                  3
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Kích hoạt phát sóng</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Hệ thống tự động phát bài thuyết minh khi du khách đến gần.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs font-semibold text-[#286b7b] hover:bg-[#f0f8f9]"
                onClick={() => setCurrentPage('approval-status')}
              >
                Kiểm tra tiến trình xét duyệt
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
