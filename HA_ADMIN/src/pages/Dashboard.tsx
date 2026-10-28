import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/services/authApi';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Users, DollarSign, Headphones, MapPin, Store, Clock,
  ArrowUpRight, ArrowRight, Activity, Globe2, ShieldCheck,
  Radio, CheckCircle2, ChevronRight, Zap
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useApp } from '@/hooks/useApp';
import { formatNumber } from '@/utils/helpers';

// Dữ liệu biểu đồ cột kép (Double bar chart: Teal + Lime)
const trafficAndAudioData = {
  day: [
    { time: '08:00', visitors: 320, audio: 190 },
    { time: '10:00', visitors: 680, audio: 420 },
    { time: '12:00', visitors: 510, audio: 280 },
    { time: '14:00', visitors: 640, audio: 390 },
    { time: '16:00', visitors: 820, audio: 540 },
    { time: '18:00', visitors: 1150, audio: 780 },
    { time: '20:00', visitors: 1320, audio: 910 },
  ],
  week: [
    { time: 'Thứ 2', visitors: 3400, audio: 2100 },
    { time: 'Thứ 3', visitors: 3800, audio: 2450 },
    { time: 'Thứ 4', visitors: 3600, audio: 2300 },
    { time: 'Thứ 5', visitors: 4200, audio: 2800 },
    { time: 'Thứ 6', visitors: 5600, audio: 3900 },
    { time: 'Thứ 7', visitors: 7200, audio: 5100 },
    { time: 'Chủ nhật', visitors: 6800, audio: 4700 },
  ],
  month: [
    { time: 'Tuần 1', visitors: 24000, audio: 16500 },
    { time: 'Tuần 2', visitors: 26500, audio: 18200 },
    { time: 'Tuần 3', visitors: 29000, audio: 20100 },
    { time: 'Tuần 4', visitors: 32500, audio: 22800 },
  ],
};

// Dữ liệu biểu đồ đường (Line chart với màu Lime + điểm chấm)
const trendLineData = [
  { time: '06:00', value: 140 },
  { time: '08:00', value: 410 },
  { time: '10:00', value: 680 },
  { time: '12:00', value: 520 },
  { time: '14:00', value: 630 },
  { time: '16:00', value: 790 },
  { time: '18:00', value: 920 },
  { time: '20:00', value: 980 },
  { time: '22:00', value: 450 },
];

// Donut data: 41% quốc tế, 59% nội địa
const internationalData = [
  { name: 'Du khách quốc tế', value: 41, color: '#a4db77' }, // Lime
  { name: 'Du khách nội địa', value: 59, color: '#286b7b' },  // Teal
];

const recentActivities = [
  { id: 1, text: 'Quán Cao Lầu Thanh vừa nộp hồ sơ gian hàng mới', time: '5 phút trước' },
  { id: 2, text: 'Du khách quét mã QR kích hoạt thuyết minh tại Chùa Cầu', time: '14 phút trước' },
  { id: 3, text: 'Thanh toán gói đa ngôn ngữ 50.000đ qua VNPAY thành công', time: '25 phút trước' },
  { id: 4, text: 'Hệ thống AI TTS cập nhật bản dịch tiếng Hàn cho Hội quán Phúc Kiến', time: '40 phút trước' },
  { id: 5, text: 'Admin đã duyệt tọa độ Geofence Xưởng Thủ Công Mỹ Nghệ', time: '1 giờ trước' },
];

export default function Dashboard() {
  const { setCurrentPage } = useApp();
  const [cycle, setCycle] = useState<'day' | 'week' | 'month'>('week');
  const [onlineVisitors, setOnlineVisitors] = useState<number>(0);

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
          ROW 1: 3 TOP KPI CARDS (Bám sát giao diện mẫu)
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Du khách trực tuyến */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Du khách trực tuyến
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Trực tiếp
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-[#183a54] tracking-tight">
              {onlineVisitors.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              {onlineVisitors > 0 ? `${onlineVisitors} thiết bị` : 'Chờ kết nối'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Đang hoạt động trong bán kính phố cổ Hội An
          </p>
        </div>

        {/* Card 2: Lượt nghe thuyết minh */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Lượt nghe thuyết minh
            </span>
            <span className="p-1.5 rounded-lg bg-[#f0f8f9] text-[#286b7b]">
              <Headphones className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-[#183a54] tracking-tight">687</span>
            <span className="text-xs font-bold text-[#286b7b] bg-[#f0f8f9] px-2 py-0.5 rounded">
              +8.2%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Hôm nay · 89 thiết bị đang phát audio di tích
          </p>
        </div>

        {/* Card 3: Doanh thu VNPAY (VNĐ) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Doanh thu VNPAY (VNĐ)
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-[#183a54] tracking-tight">13,249,000</span>
            <span className="text-sm font-bold text-slate-500">₫</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded ml-1">
              +18.4%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Tổng thu gói thuyết minh & phí gian hàng tháng này
          </p>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: 2 MAIN CHARTS (Double Bar Chart + Line Chart with Dots)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Double Bar Chart (Teal & Lime) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-bold text-[#183a54]">
                Lượt du khách & Lượt nghe thuyết minh
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                So sánh lượng khách ghé thăm và tần suất nghe audio
              </p>
            </div>

            {/* Cycle Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
              <button
                onClick={() => setCycle('day')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  cycle === 'day' ? 'bg-[#286b7b] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hôm nay
              </button>
              <button
                onClick={() => setCycle('week')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  cycle === 'week' ? 'bg-[#286b7b] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tuần này
              </button>
              <button
                onClick={() => setCycle('month')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
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
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trafficAndAudioData[cycle]} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [formatNumber(Number(val)), '']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="visitors" name="Lượt du khách" fill="#286b7b" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="audio" name="Lượt nghe" fill="#a4db77" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Smooth Line Chart with Lime line & dots */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-[#183a54]">
                Xu hướng tương tác & Doanh thu theo giờ
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Mật độ kích hoạt thuyết minh tại các khung giờ cao điểm
              </p>
            </div>
            <span className="text-xs font-bold text-[#286b7b] bg-[#f0f8f9] px-2.5 py-1 rounded-full">
              Hôm nay
            </span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mb-4 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-1.5 rounded-full bg-[#a4db77]" />
              <span>Lượt tương tác hệ thống</span>
            </div>
          </div>

          {/* Line Chart */}
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendLineData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [formatNumber(Number(val)), 'Lượt tương tác']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#a4db77"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#a4db77', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#286b7b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 3: 3 BOTTOM CARDS (Donut with 41%, Capacity Bars, Activities)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Donut Chart with centered 41% */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#183a54]">
              Tỷ lệ du khách quốc tế
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Phân bổ ngôn ngữ ứng dụng & xuất xứ người nghe
            </p>

            <div className="relative h-[180px] flex items-center justify-center my-4">
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
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Number 41% exactly like in reference image */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-extrabold text-[#183a54]">41%</span>
                <span className="text-[11px] font-semibold text-slate-400">Quốc tế</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#a4db77]" />
                  Du khách quốc tế (EN, JA, KO, ZH)
                </span>
                <span className="font-bold text-[#183a54]">41%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#286b7b]" />
                  Du khách nội địa (Tiếng Việt)
                </span>
                <span className="font-bold text-[#183a54]">59%</span>
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
              Độ chính xác Geofence và tỷ lệ hoàn thành audio
            </p>

            <div className="space-y-4 my-4">
              {/* Metric 1 */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Định vị GPS / Geofence chuẩn xác</span>
                  <span className="text-[#286b7b] font-bold">94%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-[#286b7b] rounded-full" style={{ width: '94%' }} />
                </div>
              </div>

              {/* Metric 2 */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Tỷ lệ nghe hết thuyết minh (&gt;80%)</span>
                  <span className="text-[#87c33b] font-bold">78%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-[#a4db77] rounded-full" style={{ width: '78%' }} />
                </div>
              </div>

              {/* Metric 3 */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Quét mã QR tại điểm di tích</span>
                  <span className="text-[#286b7b] font-bold">65%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-[#286b7b] rounded-full" style={{ width: '65%' }} />
                </div>
              </div>

              {/* Metric 4 */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Tải máy chủ AI TTS &amp; CDN</span>
                  <span className="text-[#87c33b] font-bold">32%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-[#a4db77] rounded-full" style={{ width: '32%' }} />
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

        {/* Card 3: Activities & Operations */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#183a54] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#286b7b]" />
                Vận hành mới nhất
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="space-y-3.5">
              {recentActivities.map(act => (
                <div key={act.id} className="flex items-start gap-3 text-xs pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <span className="w-2 h-2 rounded-full bg-[#286b7b] mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-slate-700 font-medium leading-relaxed">{act.text}</p>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setCurrentPage('accounts')}
            className="w-full mt-6 py-2.5 px-4 rounded-xl bg-[#286b7b] hover:bg-[#205764] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            Xem nhật ký kiểm toán hệ thống <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
