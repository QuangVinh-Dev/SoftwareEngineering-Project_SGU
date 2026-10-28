import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { Calendar, Headphones, TrendingUp } from 'lucide-react';
import { Card, CardHeader, Button } from '@/components/ui';
import { useApp } from '@/hooks/useApp';
import { ApiError } from '@/services/authApi';
import { getListeningStats, type ListeningRange, type ListeningStats } from '@/services/statsApi';
import { formatNumber } from '@/utils/helpers';

const ranges: { key: ListeningRange; label: string }[] = [
  { key: 'day', label: 'Ngày' },
  { key: 'week', label: 'Tuần' },
  { key: 'month', label: 'Tháng' },
];

export default function Stats() {
  const { signOut } = useApp();
  const [range, setRange] = useState<ListeningRange>('week');
  const [data, setData] = useState<ListeningStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getListeningStats(range)
      .then(result => { if (active) setData(result); })
      .catch((cause: unknown) => {
        if (!active) return;
        if (cause instanceof ApiError && cause.status === 401) {
          signOut();
          return;
        }
        setError(cause instanceof ApiError && cause.status === 403
          ? 'Tài khoản hiện tại không có quyền xem thống kê gian hàng.'
          : cause instanceof Error ? cause.message : 'Không tải được thống kê. Vui lòng thử lại.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [range, reload, signOut]);

  const selectedTotal = range === 'day' ? data?.todaySessions : range === 'week' ? data?.weekSessions : data?.monthSessions;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-brown-900">Thống kê lượt nghe</h1>
          <p className="mt-1 text-sm text-brown-400">Dữ liệu lượt nghe đã ghi nhận cho POI thuộc gian hàng của bạn.</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="stats-range" className="text-sm font-medium text-brown-700">Khoảng thời gian</label>
          <select id="stats-range" value={range} onChange={event => setRange(event.target.value as ListeningRange)}
            className="rounded-lg border border-brown-200 bg-white px-3 py-2 text-sm text-brown-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100">
            {ranges.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </div>
      </div>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p>{error}</p><Button className="mt-3" size="sm" variant="secondary" onClick={() => setReload(value => value + 1)}>Thử lại</Button>
      </div>}

      {loading && <p role="status" className="py-8 text-center text-sm text-brown-500">Đang tải thống kê…</p>}

      {!loading && !error && data && <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={<Headphones className="h-5 w-5 text-primary-600" />} label="Tổng lượt nghe" value={data.totalSessions} />
          <StatCard icon={<Calendar className="h-5 w-5 text-blue-600" />} label={`Lượt nghe ${range === 'day' ? 'hôm nay' : range === 'week' ? '7 ngày qua' : '30 ngày qua'}`} value={selectedTotal ?? 0} />
          <StatCard icon={<TrendingUp className="h-5 w-5 text-green-600" />} label="POI có lượt nghe" value={data.poiStats.filter(poi => poi.sessions > 0).length} />
        </div>

        {data.totalSessions === 0 ? <Card><p className="py-10 text-center text-sm text-brown-500">Chưa có dữ liệu lượt nghe cho các POI của gian hàng.</p></Card> : <>
          <Card>
            <CardHeader title="Lượt nghe theo thời gian" subtitle={ranges.find(item => item.key === range)?.label} />
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={data.trend} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <defs><linearGradient id="listeningStatsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [`${formatNumber(Number(value))} lượt nghe`, 'Lượt nghe']} />
                <Area type="monotone" dataKey="sessions" stroke="#2563eb" strokeWidth={2} fill="url(#listeningStatsFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <CardHeader title="Lượt nghe theo POI" subtitle="Trong khoảng thời gian đã chọn" />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.poiStats} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="poiName" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [`${formatNumber(Number(value))} lượt nghe`, 'Lượt nghe']} />
                <Bar dataKey="sessions" name="Lượt nghe" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>}
      </>}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="rounded-xl border border-brown-100 bg-white p-5 shadow-card">
    <div className="mb-2 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">{icon}</div><p className="text-sm text-brown-500">{label}</p></div>
    <p className="text-2xl font-bold text-brown-900">{formatNumber(value)}</p>
  </div>;
}
