import { useState } from 'react';
import {
  BarChart3, FileSpreadsheet, FileText, Download, Calendar,
  TrendingUp, Clock, Globe2, Smartphone, Users, Award, CheckCircle2,
  PieChart as PieIcon, Monitor, Tablet
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Card, CardHeader, Button, Badge } from '@/components/ui';
import { useToast } from '@/components/toast/ToastProvider';
import {
  top10Pois, avgTimeByPoi, avgTimeByLanguage, languageDistribution
} from '@/data/mockData';
import { classNames, formatNumber } from '@/utils/helpers';

const barColors = ['#a85f31', '#c07a3e', '#d99d2b', '#9a6d54', '#7e5742', '#cc9259', '#bd7a20', '#654536', '#b08870', '#cab09c'];

const deviceData = [
  { name: 'Điện thoại (Mobile)', value: 68, count: 8557, icon: Smartphone, color: '#a85f31' },
  { name: 'Máy tính bảng (Tablet)', value: 22, count: 2768, icon: Tablet, color: '#d99d2b' },
  { name: 'Máy tính (Desktop)', value: 10, count: 1259, icon: Monitor, color: '#9a6d54' },
];

const countryData = [
  { country: 'Việt Nam', flag: '🇻🇳', code: 'VN', sessions: 5420, percent: '43.1%' },
  { country: 'Hàn Quốc', flag: '🇰🇷', code: 'KR', sessions: 2350, percent: '18.7%' },
  { country: 'Nhật Bản', flag: '🇯🇵', code: 'JP', sessions: 1820, percent: '14.5%' },
  { country: 'Đài Loan / Trung Quốc', flag: '🇨🇳', code: 'TW/CN', sessions: 1450, percent: '11.5%' },
  { country: 'Châu Âu & Mỹ', flag: '🌍', code: 'EU/US', sessions: 1120, percent: '8.9%' },
  { country: 'Khác', flag: '🌐', code: 'OTHER', sessions: 424, percent: '3.3%' },
];

const reportTemplates = [
  { id: 'top_poi', label: 'Báo cáo POI được nghe nhiều nhất', desc: 'Thống kê xếp hạng chi tiết và tỷ trọng lượt nghe từng điểm di tích', format: 'Excel & PDF' },
  { id: 'avg_time', label: 'Báo cáo thời gian nghe trung bình', desc: 'Phân tích thời lượng nghe theo từng điểm POI và từng ngôn ngữ thuyết minh', format: 'Excel & PDF' },
  { id: 'access', label: 'Báo cáo thống kê truy cập & thiết bị', desc: 'Tổng hợp tỷ lệ thiết bị sử dụng, quốc gia và xu hướng giờ cao điểm', format: 'Excel & PDF' },
  { id: 'full_system', label: 'Báo cáo tổng hợp toàn hệ thống', desc: 'Toàn bộ số liệu lượt nghe, di sản, chủ gian hàng và nhật ký sử dụng', format: 'Excel & PDF' },
];

export default function Reports() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'top_poi' | 'avg_time' | 'access' | 'export'>('top_poi');

  // Export report states
  const [selectedReport, setSelectedReport] = useState('top_poi');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-27');
  const [exporting, setExporting] = useState(false);

  // Xử lý xuất báo cáo (7.3)
  const handleExport = (format: 'Excel' | 'PDF') => {
    if (!startDate || !endDate) {
      showToast('warning', 'Vui lòng chọn khoảng thời gian xuất báo cáo.');
      return;
    }
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      showToast('success', `Đã xuất ${format} báo cáo thành công! Tệp tin đã được tải xuống.`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brown-900 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-primary-600" />
          Báo cáo & Thống kê hệ thống
        </h1>
        <p className="text-sm text-brown-500 mt-1">
          Theo dõi POI nghe nhiều nhất, thời gian nghe trung bình, dữ liệu truy cập thiết bị & xuất báo cáo PDF/Excel.
        </p>
      </div>

      {/* Main Tabs Card */}
      <Card noPadding>
        {/* Navigation Tabs */}
        <div className="flex border-b border-brown-100 bg-brown-50/40 px-4 pt-3 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setActiveTab('top_poi')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'top_poi'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-brown-500 hover:text-brown-800'
            }`}
          >
            <Award className="w-4 h-4" />
            Điểm di tích nghe nhiều nhất
          </button>

          <button
            onClick={() => setActiveTab('avg_time')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'avg_time'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-brown-500 hover:text-brown-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            Thời lượng nghe trung bình
          </button>

          <button
            onClick={() => setActiveTab('access')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'access'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-brown-500 hover:text-brown-800'
            }`}
          >
            <Globe2 className="w-4 h-4" />
            Lưu lượng truy cập & Thiết bị
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'export'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-brown-500 hover:text-brown-800'
            }`}
          >
            <Download className="w-4 h-4" />
            Xuất dữ liệu báo cáo
          </button>
        </div>

        {/* TAB: POI ĐƯỢC NGHE NHIỀU NHẤT */}
        {activeTab === 'top_poi' && (
          <div className="p-5 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-brown-900">Biểu đồ xếp hạng di tích</h3>
                <p className="text-xs text-brown-400 mt-0.5">Top 10 điểm tham quan có số lượt nghe thuyết minh cao nhất</p>
              </div>
            </div>

            {/* Biểu đồ */}
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top10Pois} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e9e2" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8b5e3c' }} angle={-15} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: '#8b5e3c' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e0d1c3', fontSize: '12px' }}
                    cursor={{ fill: '#f5ebdb' }}
                  />
                  <Bar dataKey="sessions" radius={[6, 6, 0, 0]} name="Lượt nghe">
                    {top10Pois.map((_, i) => (
                      <Cell key={i} fill={barColors[i % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 7.1.1 Bảng xếp hạng */}
            <div>
              <h3 className="text-base font-bold text-brown-900 mb-3">Bảng xếp hạng chi tiết</h3>
              <div className="overflow-x-auto rounded-lg border border-brown-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brown-100 bg-brown-50/60">
                      <th className="px-4 py-3 text-center font-semibold text-brown-600 text-xs uppercase w-16">Thứ hạng</th>
                      <th className="px-4 py-3 text-left font-semibold text-brown-600 text-xs uppercase">Điểm tham quan (POI)</th>
                      <th className="px-4 py-3 text-right font-semibold text-brown-600 text-xs uppercase">Tổng lượt nghe</th>
                      <th className="px-4 py-3 text-right font-semibold text-brown-600 text-xs uppercase">Thời lượng TB</th>
                      <th className="px-4 py-3 text-right font-semibold text-brown-600 text-xs uppercase">Tỷ trọng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brown-50">
                    {(() => {
                      const total = top10Pois.reduce((s, p) => s + p.sessions, 0);
                      return top10Pois.map((poi, idx) => (
                        <tr key={idx} className="hover:bg-brown-50/30 transition-colors">
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              idx === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              idx === 1 ? 'bg-slate-200 text-slate-700' :
                              idx === 2 ? 'bg-orange-100 text-orange-800' : 'text-brown-500'
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-brown-900">{poi.name}</td>
                          <td className="px-4 py-3 text-right font-mono font-medium text-brown-700">{formatNumber(poi.sessions)}</td>
                          <td className="px-4 py-3 text-right text-xs text-brown-500">{poi.avgTime}</td>
                          <td className="px-4 py-3 text-right text-xs font-semibold text-primary-700">
                            {((poi.sessions / total) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7.2: THỜI GIAN NGHE TRUNG BÌNH */}
        {activeTab === 'avg_time' && (
          <div className="p-5 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 7.2.1 Theo POI */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-bold text-brown-900">Thời gian nghe trung bình theo POI</h3>
                  <p className="text-xs text-brown-400 mt-0.5">Thời lượng khách dừng lại nghe thuyết minh tại từng di tích</p>
                </div>
                <div className="space-y-2">
                  {avgTimeByPoi.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-brown-100 bg-white hover:bg-brown-50/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-xs text-brown-400 font-mono">#{i + 1}</span>
                        <span className="font-semibold text-brown-900 text-sm">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-primary-600" />
                        <span className="font-mono text-sm font-bold text-primary-800">{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7.2.2 Theo Ngôn ngữ */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-bold text-brown-900">Thời gian nghe trung bình theo Ngôn ngữ</h3>
                  <p className="text-xs text-brown-400 mt-0.5">So sánh mức độ quan tâm của du khách theo từng thứ tiếng</p>
                </div>
                <div className="space-y-2">
                  {avgTimeByLanguage.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-brown-100 bg-white hover:bg-brown-50/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <Globe2 className="w-4 h-4 text-brown-500" />
                        <span className="font-semibold text-brown-900 text-sm">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-primary-600" />
                        <span className="font-mono text-sm font-bold text-primary-800">{item.time} phút</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7.4: THỐNG KÊ TRUY CẬP (THIẾT BỊ & QUỐC GIA, ONLINE) */}
        {activeTab === 'access' && (
          <div className="p-5 space-y-6">
            {/* 7.4.2 Người dùng đang online */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-primary-600 to-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-ping" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-amber-100 font-bold">Người dùng đang online trong phố cổ</p>
                  <p className="text-2xl font-black mt-0.5">148 du khách</p>
                </div>
              </div>
              <div className="text-right text-xs text-amber-100">
                <p>Đang nghe thuyết minh: <strong>89</strong></p>
                <p>Đang duyệt bản đồ: <strong>59</strong></p>
              </div>
            </div>

            {/* 7.4.1 Thiết bị & Quốc gia */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Thiết bị */}
              <div className="space-y-3">
                <h3 className="text-base font-bold text-brown-900">Thiết bị truy cập (Device)</h3>
                <div className="space-y-3">
                  {deviceData.map((d, i) => {
                    const Icon = d.icon;
                    return (
                      <div key={i} className="p-3.5 rounded-lg border border-brown-100 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-brown-600" />
                            <span className="text-sm font-semibold text-brown-800">{d.name}</span>
                          </div>
                          <span className="text-sm font-bold text-primary-800">{d.value}% ({formatNumber(d.count)})</span>
                        </div>
                        <div className="w-full bg-brown-100 h-2 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${d.value}%`, backgroundColor: d.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quốc gia */}
              <div className="space-y-3">
                <h3 className="text-base font-bold text-brown-900">Quốc gia du khách (Country)</h3>
                <div className="space-y-2">
                  {countryData.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-brown-100 bg-white">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{c.flag}</span>
                        <span className="text-sm font-semibold text-brown-800">{c.country}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-brown-400 font-mono">{formatNumber(c.sessions)} lượt</span>
                        <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">{c.percent}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7.3: XUẤT BÁO CÁO (EXCEL / PDF) */}
        {activeTab === 'export' && (
          <div className="p-5 space-y-6">
            <div>
              <h3 className="text-base font-bold text-brown-900">Chọn loại báo cáo cần kết xuất</h3>
              <p className="text-xs text-brown-400 mt-0.5">Chọn mẫu báo cáo số liệu tổng hợp định kỳ phục vụ công tác quản lý</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reportTemplates.map(tpl => (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedReport(tpl.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedReport === tpl.id
                      ? 'border-primary-600 bg-primary-50/50 shadow-sm'
                      : 'border-brown-100 hover:border-brown-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className={`w-5 h-5 ${selectedReport === tpl.id ? 'text-primary-600' : 'text-brown-400'}`} />
                      <h4 className="font-semibold text-sm text-brown-900">{tpl.label}</h4>
                    </div>
                    {selectedReport === tpl.id && <CheckCircle2 className="w-5 h-5 text-primary-600" />}
                  </div>
                  <p className="text-xs text-brown-500 mt-2">{tpl.desc}</p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-brown-400">
                    <span>Định dạng: <strong>{tpl.format}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bộ lọc thời gian */}
            <div className="p-4 rounded-xl border border-brown-100 bg-brown-50/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-brown-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-brown-500" />
                  Khoảng thời gian:
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-brown-200 text-xs bg-white outline-none focus:border-primary-400"
                />
                <span className="text-xs text-brown-400">đến</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-brown-200 text-xs bg-white outline-none focus:border-primary-400"
                />
              </div>

              {/* 7.3.2 Nút xuất Excel / PDF */}
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  disabled={exporting}
                  onClick={() => handleExport('Excel')}
                  icon={<FileSpreadsheet className="w-4 h-4 text-green-600" />}
                >
                  Xuất Excel (.xlsx)
                </Button>
                <Button
                  variant="primary"
                  disabled={exporting}
                  onClick={() => handleExport('PDF')}
                  icon={<Download className="w-4 h-4" />}
                >
                  {exporting ? 'Đang tạo báo cáo…' : 'Xuất PDF (.pdf)'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
