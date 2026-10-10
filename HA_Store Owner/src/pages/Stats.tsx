import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { Headphones, Clock, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardHeader, Button } from '@/components/ui';
import { useApp } from '@/hooks/useApp';
import { myPois, listeningTrend7Days, listeningTrend30Days, listeningTrend3Months, myPoiStats, avgTimeByPoi } from '@/data/mockData';
import { formatNumber } from '@/utils/helpers';

const timeRanges = [
  { key: 'today', label: 'Hôm nay' },
  { key: '7', label: '7 ngày qua' },
  { key: '30', label: '30 ngày qua' },
  { key: '3m', label: '3 tháng qua' },
  { key: 'custom', label: 'Tùy chọn khoảng ngày' },
];

export default function Stats() {
  const { setCurrentPage } = useApp();
  const approvedPois = myPois.filter(p => p.approvalStatus === 'approved');
  const [selectedPoi, setSelectedPoi] = useState<string>(approvedPois[0]?.name || '');
  const [timeRange, setTimeRange] = useState('7');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const poi = approvedPois.find(p => p.name === selectedPoi);
  const todaySessions = Math.floor((poi?.listeningSessions || 0) * 0.05);
  const sevenDaySessions = Math.floor((poi?.listeningSessions || 0) * 0.3);
  const thirtyDaySessions = Math.floor((poi?.listeningSessions || 0) * 0.7);

  const trendData = timeRange === 'today' ? listeningTrend7Days.slice(-1) :
    timeRange === '7' ? listeningTrend7Days :
    timeRange === '30' ? listeningTrend30Days :
    timeRange === '3m' ? listeningTrend3Months :
    customStart ? listeningTrend30Days.slice(0, 15) : listeningTrend7Days;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brown-900">Thống kê lượt nghe</h1>
        <p className="text-sm text-brown-400 mt-1">Xem thống kê lượt nghe POI thuộc gian hàng của bạn.</p>
      </div>

      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-brown-700 mb-1.5">Chọn POI</label>
            <select value={selectedPoi} onChange={e => setSelectedPoi(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm text-brown-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white">
              {approvedPois.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-brown-700 mb-1.5">Khoảng thời gian</label>
            <select value={timeRange} onChange={e => setTimeRange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm text-brown-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white">
              {timeRanges.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </div>
        </div>

        {timeRange === 'custom' && (
          <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-brown-100">
            <div className="flex-1">
              <label className="block text-sm font-medium text-brown-700 mb-1">Ngày bắt đầu</label>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-brown-700 mb-1">Ngày kết thúc</label>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
            </div>
            <div className="flex items-end gap-2">
              <Button size="md" onClick={() => { setCustomStart(''); setCustomEnd(''); }}>Đặt lại</Button>
              <Button size="md" variant="primary">Áp dụng</Button>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-brown-100 shadow-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-primary-600" />
            </div>
            <p className="text-sm text-brown-400">Tổng lượt nghe</p>
          </div>
          <p className="text-2xl font-bold text-brown-900">{formatNumber(poi?.listeningSessions || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-brown-100 shadow-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-brown-400">Lượt nghe hôm nay</p>
          </div>
          <p className="text-2xl font-bold text-brown-900">{formatNumber(todaySessions)}</p>
        </div>
        <div className="bg-white rounded-xl border border-brown-100 shadow-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-brown-400">Lượt nghe 7 ngày</p>
          </div>
          <p className="text-2xl font-bold text-brown-900">{formatNumber(sevenDaySessions)}</p>
        </div>
        <div className="bg-white rounded-xl border border-brown-100 shadow-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-sm text-brown-400">Lượt nghe 30 ngày</p>
          </div>
          <p className="text-2xl font-bold text-brown-900">{formatNumber(thirtyDaySessions)}</p>
        </div>
        <div className="bg-white rounded-xl border border-brown-100 shadow-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-brown-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-brown-600" />
            </div>
            <p className="text-sm text-brown-400">Thời gian nghe TB</p>
          </div>
          <p className="text-2xl font-bold text-brown-900 font-mono">{poi?.avgTime || '00:00'}</p>
        </div>
      </div>

      <Card>
        <CardHeader title="Lượt nghe theo thời gian" subtitle={`POI: ${selectedPoi}`} />
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="colorStats" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #dbeafe', fontSize: '12px' }} formatter={(value) => [`${formatNumber(Number(value))} lượt nghe`, 'Lượt nghe']} />
            <Area type="monotone" dataKey="sessions" stroke="#2563eb" strokeWidth={2} fill="url(#colorStats)" animationDuration={800} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Lượt nghe theo POI" subtitle="Tất cả POI đã duyệt" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={myPoiStats} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #dbeafe', fontSize: '12px' }} formatter={(value) => [`${formatNumber(Number(value))} lượt nghe`, 'Lượt nghe']} />
              <Bar dataKey="sessions" fill="#2563eb" radius={[6, 6, 0, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader title="Thời gian nghe trung bình theo POI" subtitle="Đơn vị: phút" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={avgTimeByPoi} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #dbeafe', fontSize: '12px' }} formatter={(value) => [`${Number(value).toFixed(1)} phút`, 'Thời gian TB']} />
              <Bar dataKey="time" fill="#3b82f6" radius={[6, 6, 0, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
