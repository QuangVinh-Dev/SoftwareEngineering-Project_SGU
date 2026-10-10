import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { MapPin, Headphones, Clock, Languages, ArrowRight, Edit, Plus, Download, Shield, Pause, LogIn } from 'lucide-react';
import KPICard from '@/components/cards/KPICard';
import { Card, CardHeader, Button } from '@/components/ui';
import { useApp } from '@/hooks/useApp';
import {
  listeningTrend7Days, listeningTrend30Days, listeningTrend3Months, listeningTrend1Year,
  languageDistribution, top10Pois, activityLogs,
} from '@/data/mockData';
import { classNames, formatNumber } from '@/utils/helpers';

const activityIcons: Record<string, typeof Edit> = {
  edit: Edit, plus: Plus, download: Download, shield: Shield, pause: Pause, login: LogIn, languages: Languages,
};

export default function Dashboard() {
  const { setCurrentPage } = useApp();
  const [trendRange, setTrendRange] = useState<'7' | '30' | '3m' | '1y'>('7');

  const trendData = {
    '7': listeningTrend7Days,
    '30': listeningTrend30Days,
    '3m': listeningTrend3Months,
    '1y': listeningTrend1Year,
  }[trendRange];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brown-900">Tổng quan</h1>
        <p className="text-sm text-brown-400 mt-1">Tổng quan hoạt động của hệ thống thuyết minh du lịch Hội An.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard label="Tổng số điểm tham quan" value="48" trend="+8.5%" trendUp sublabel="so với tháng trước" icon={MapPin} iconBg="bg-primary-100" iconColor="text-primary-600" />
        <KPICard label="Tổng lượt nghe" value="12,584" trend="+12.4%" trendUp sublabel="so với tháng trước" icon={Headphones} iconBg="bg-blue-100" iconColor="text-blue-600" />
        <KPICard label="Thời gian nghe trung bình" value="06:42" trend="+4.2%" trendUp sublabel="so với tháng trước" icon={Clock} iconBg="bg-gold-100" iconColor="text-gold-600" />
        <KPICard label="Ngôn ngữ đang hoạt động" value="6" trend="+1" trendUp sublabel="tháng này" icon={Languages} iconBg="bg-green-100" iconColor="text-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Lượt nghe theo thời gian"
              subtitle="Theo dõi hoạt động nghe theo thời gian"
              action={
                <div className="flex items-center gap-1 bg-brown-50 rounded-lg p-1">
                  {([['7', '7 ngày'], ['30', '30 ngày'], ['3m', '3 tháng'], ['1y', '1 năm']] as const).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setTrendRange(key)}
                      className={classNames(
                        'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                        trendRange === key ? 'bg-white text-primary-700 shadow-sm' : 'text-brown-500 hover:text-brown-700'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              }
            />
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #dbeafe', fontSize: '12px' }} />
                <Area type="monotone" dataKey="sessions" stroke="#2563eb" strokeWidth={2} fill="url(#colorSessions)" animationDuration={800} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card>
          <CardHeader title="Lượt nghe theo ngôn ngữ" subtitle="Phân bổ theo ngôn ngữ" />
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={languageDistribution} dataKey="sessions" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} animationDuration={800}>
                {languageDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #dbeafe', fontSize: '12px' }}
                formatter={(value, _name, props) => {
                  const total = languageDistribution.reduce((s, d) => s + d.sessions, 0);
                  const pct = ((Number(value) / total) * 100).toFixed(1);
                  const name = props?.payload?.name ?? '';
                  return [`${formatNumber(Number(value))} lượt nghe (${pct}%)`, name];
                }}
              />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card noPadding>
            <div className="p-5 pb-3">
              <CardHeader
                title="Điểm tham quan được nghe nhiều nhất"
                subtitle="Top 5 theo lượt nghe"
                action={<Button size="sm" variant="secondary" onClick={() => setCurrentPage('analytics')} icon={<ArrowRight className="w-3.5 h-3.5" />}>Xem tất cả</Button>}
              />
            </div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-brown-100 bg-brown-50/50">
                    <th className="px-5 py-2.5 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">STT</th>
                    <th className="px-5 py-2.5 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">Điểm tham quan</th>
                    <th className="px-5 py-2.5 text-right font-medium text-brown-500 text-xs uppercase tracking-wider">Lượt nghe</th>
                    <th className="px-5 py-2.5 text-right font-medium text-brown-500 text-xs uppercase tracking-wider">Thời gian nghe TB</th>
                  </tr>
                </thead>
                <tbody>
                  {top10Pois.slice(0, 5).map((poi, i) => (
                    <tr key={i} className="border-b border-brown-50 hover:bg-brown-50/30 transition-colors">
                      <td className="px-5 py-3">
                        <span className={classNames(
                          'inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold',
                          i === 0 ? 'bg-gold-100 text-gold-700' : i === 1 ? 'bg-brown-200 text-brown-700' : i === 2 ? 'bg-primary-100 text-primary-700' : 'bg-brown-50 text-brown-500'
                        )}>{i + 1}</span>
                      </td>
                      <td className="px-5 py-3 font-medium text-brown-800">{poi.name}</td>
                      <td className="px-5 py-3 text-right text-brown-700">{formatNumber(poi.sessions)}</td>
                      <td className="px-5 py-3 text-right text-brown-700">{poi.avgTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader
            title="Hoạt động gần đây"
            subtitle="Thao tác quản trị mới nhất"
            action={<Button size="sm" variant="ghost" onClick={() => setCurrentPage('settings')}>Xem tất cả</Button>}
          />
          <div className="space-y-3">
            {activityLogs.slice(0, 5).map(log => {
              const Icon = activityIcons[log.icon] || Edit;
              return (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brown-50 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-brown-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-brown-800 truncate">{log.action}</p>
                    <p className="text-xs text-brown-400 mt-0.5">{log.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
