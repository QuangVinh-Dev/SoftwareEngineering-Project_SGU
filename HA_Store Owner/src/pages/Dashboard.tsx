import { useEffect, useState } from 'react';
import {
  MapPin, Clock, ArrowRight, CheckCircle2, AlertCircle, Plus, Eye,
  Edit3, RefreshCw, BarChart2
} from 'lucide-react';
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
  const [error, setError] = useState('');

  const loadData = async (activeRange: ListeningRange) => {
    try {
      const [poisRes, statsRes] = await Promise.all([
        getMerchantPois(),
        getListeningStats(activeRange),
      ]);
      setPoi(poisRes.length > 0 ? poisRes[0] : null);
      setStats(statsRes);
    } catch (cause: unknown) {
      if (cause instanceof ApiError && cause.status === 401) {
        signOut();
        return;
      }
      setError(cause instanceof Error ? cause.message : 'Không tải được dữ liệu.');
    } finally {
      setLoading(false);
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    void loadData(range);
  }, []);

  const handleRangeChange = (newRange: ListeningRange) => {
    setRange(newRange);
    setLoadingStats(true);
    getListeningStats(newRange)
      .then(res => setStats(res))
      .catch(() => {})
      .finally(() => setLoadingStats(false));
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
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#240c52] via-[#2e1065] to-[#7c3aed] p-6 lg:p-8 text-white shadow-xl shadow-purple-950/20 border border-purple-800/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <p className="text-purple-300 text-xs font-bold uppercase tracking-wider mb-1.5">
              Cổng quản trị gian hàng Hội An Heritage
            </p>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Xin chào, {authUser?.fullName || authUser?.stallName || 'Chủ gian hàng'}!
            </h1>
            <p className="mt-1.5 text-sm text-purple-100/80 max-w-xl leading-relaxed">
              Theo dõi trực tiếp lượt nghe thuyết minh tự động, tình trạng thẩm định và quản lý điểm tham quan (POI) duy nhất của bạn.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {poi ? (
              <Button
                onClick={() => setCurrentPage('my-poi')}
                className="bg-white text-purple-950 hover:bg-purple-50 shadow-lg font-bold text-xs px-4 py-2.5 rounded-xl border-none transition-transform active:scale-95"
              >
                <Eye className="w-4 h-4 mr-1.5 text-purple-700" />
                Xem POI của tôi
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentPage('my-poi')}
                className="bg-white text-purple-950 hover:bg-purple-50 shadow-lg font-bold text-xs px-4 py-2.5 rounded-xl border-none transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4 mr-1.5 text-purple-700" />
                Thiết lập POI
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Thẻ KPI Tinh Gọn (Không dùng các khối icon đóng hộp) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Trạng thái POI */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Trạng thái POI</span>
            {poi && (
              <Badge variant={isApproved ? 'active' : isPending ? 'partial' : 'skipped'}>
                {isApproved ? 'Hoạt động' : isPending ? 'Chờ duyệt' : 'Từ chối'}
              </Badge>
            )}
          </div>
          <div className="mt-3">
            <span className={`text-xl font-extrabold tracking-tight ${
              isApproved ? 'text-emerald-700' :
              isPending ? 'text-amber-600' :
              isRejected ? 'text-red-600' :
              'text-slate-700'
            }`}>
              {!poi ? 'Chưa thiết lập' : isApproved ? 'Đã kích hoạt' : isPending ? 'Chờ duyệt' : 'Bị từ chối'}
            </span>
            <p className="mt-1 text-xs text-slate-400 truncate">
              {poi ? poi.name : 'Vui lòng nộp hồ sơ POI'}
            </p>
          </div>
        </div>

        {/* KPI 2: Lượt nghe hôm nay */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lượt nghe hôm nay</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#7c3aed] tracking-tight tabular-nums">
                {stats?.todaySessions ? formatNumber(stats.todaySessions) : '0'}
              </span>
              <span className="text-xs font-semibold text-slate-500">lượt</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">Du khách ghé thăm hôm nay</p>
        </div>

        {/* KPI 3: Lượt nghe trong kỳ lọc */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Lượt nghe {ranges.find(r => r.key === range)?.label.toLowerCase()}
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#2e1065] tracking-tight tabular-nums">
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
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng lượt nghe tích lũy</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-700 tracking-tight tabular-nums">
                {stats?.totalSessions ? formatNumber(stats.totalSessions) : '0'}
              </span>
              <span className="text-xs font-semibold text-slate-500">lượt</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">Toàn thời gian phát sóng</p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* KHU VỰC THỐNG KÊ LƯỢT NGHE POI TÍCH HỢP */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900">
                Thống kê lượt nghe thuyết minh của gian hàng
              </h2>
              <Badge variant="active">Realtime</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {poi ? `Dữ liệu lượt nghe của "${poi.name}" kích hoạt tự động theo tọa độ GPS.` : 'Dữ liệu lắng nghe bài thuyết minh tự động.'}
            </p>
          </div>

          {/* Bộ lọc thời gian (Ngày / Tuần / Tháng) */}
          <div className="flex items-center gap-2.5">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              {ranges.map(item => (
                <button
                  key={item.key}
                  onClick={() => handleRangeChange(item.key)}
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
            <div className="inline-block w-8 h-8 border-4 border-purple-200 border-t-[#7c3aed] rounded-full animate-spin mb-2" />
            <p className="text-xs text-slate-500">Đang cập nhật biểu đồ thống kê…</p>
          </div>
        ) : stats?.totalSessions === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7c3aed] flex items-center justify-center mx-auto mb-3">
              <BarChart2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">Chưa có dữ liệu lượt nghe</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Khi du khách đến gần gian hàng và nghe bài thuyết minh tự động, biểu đồ thời gian thực sẽ hiển thị tại đây.
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
                      fill="url(#dashboardStatsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chi tiết từng mốc */}
            <div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Nhật ký lượt nghe gần nhất
                </p>
                <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin divide-y divide-slate-100">
                  {(stats?.trend || []).slice().reverse().map((point, idx) => (
                    <div key={idx} className="pt-2 pb-1 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{point.date}</p>
                        <p className="text-[10px] text-slate-400">Ghi nhận từ Geofence</p>
                      </div>
                      <span className="font-extrabold text-[#7c3aed] bg-purple-50 px-2 py-1 rounded-lg">
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

      {/* Main Single POI Overview Card & Quy trình */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Điểm tham quan (POI) của gian hàng"
              subtitle="Mỗi gian hàng quản lý duy nhất 1 điểm thuyết minh"
              action={
                poi && (
                  <Button size="sm" variant="secondary" onClick={() => setCurrentPage('my-poi')}>
                    Chi tiết POI
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                )
              }
            />

            {loading ? (
              <p className="py-12 text-center text-sm text-slate-400">Đang tải thông tin điểm tham quan...</p>
            ) : !poi ? (
              <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200">
                <MapPin className="w-10 h-10 text-purple-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-700">Chưa thiết lập điểm tham quan</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Hãy gửi hồ sơ điểm POI duy nhất của gian hàng để du khách có thể nghe thuyết minh khi đến gần.
                </p>
                <Button size="sm" className="mt-4" onClick={() => setCurrentPage('my-poi')}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Thiết lập POI ngay
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
                {poi.images[0] ? (
                  <img
                    src={resolveMerchantPoiImage(poi.images[0])}
                    alt={poi.name}
                    className="w-full sm:w-44 h-36 rounded-xl object-cover border border-slate-200 shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-full sm:w-44 h-36 rounded-xl bg-purple-50 text-purple-400 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-8 h-8" />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">{poi.name}</h3>
                    <Badge variant={isApproved ? 'active' : isPending ? 'partial' : 'skipped'}>
                      {isApproved ? 'Đã duyệt' : isPending ? 'Chờ duyệt' : 'Từ chối'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {poi.originalDescription || 'Chưa cập nhật nội dung giới thiệu.'}
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#7c3aed]" />
                      {poi.latitude.toFixed(4)}, {poi.longitude.toFixed(4)}
                    </span>
                    <span>·</span>
                    <span>Bán kính: <strong>{poi.radius}m</strong></span>
                    <span>·</span>
                    <span>Ảnh: <strong>{poi.images.length}/5</strong></span>
                  </div>
                  <div className="pt-3 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setCurrentPage('edit-poi')} icon={<Edit3 className="w-3.5 h-3.5 text-[#7c3aed]" />}>
                      Chỉnh sửa & Gửi duyệt lại
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

        {/* Quy trình phê duyệt POI với số thứ tự tinh gọn */}
        <div>
          <Card>
            <CardHeader title="Quy trình phê duyệt POI" subtitle="3 bước kiểm duyệt & phát sóng" />
            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Gửi thông tin POI</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Nhập tên, tọa độ GPS, bán kính quét và hình ảnh đại diện.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Ban quản lý xét duyệt</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Admin đối chiếu vị trí thực tế tại Phố Cổ và phê duyệt.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">
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
                className="w-full text-xs font-semibold text-purple-700 hover:bg-purple-50"
                onClick={() => setCurrentPage('approval-status')}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-purple-600" />
                Kiểm tra tiến trình xét duyệt
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
