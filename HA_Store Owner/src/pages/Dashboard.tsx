import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { MapPin, Headphones, Clock, Send, ArrowRight, Edit, Plus, Download, Shield, Pause, LogIn, Check, X } from 'lucide-react';
import KPICard from '@/components/cards/KPICard';
import { Card, CardHeader, Badge, Button } from '@/components/ui';
import { useApp } from '@/hooks/useApp';
import {
  myPois, languageDistribution, listeningTrend7Days, listeningTrend30Days, listeningTrend3Months, activityLogs,
} from '@/data/mockData';
import { classNames, formatNumber } from '@/utils/helpers';

const activityIcons: Record<string, typeof Edit> = {
  edit: Edit, plus: Plus, download: Download, shield: Shield, pause: Pause, login: LogIn, check: Check, x: X,
};

const statusLabels: Record<string, string> = {
  approved: 'Đã duyệt',
  pending: 'Chờ duyệt',
  rejected: 'Từ chối',
};

export default function Dashboard() {
  const { setCurrentPage } = useApp();
  const [trendRange, setTrendRange] = useState<'7' | '30' | '3m'>('7');

  const totalPois = myPois.length;
  const approvedPois = myPois.filter(p => p.approvalStatus === 'approved').length;
  const pendingPois = myPois.filter(p => p.approvalStatus === 'pending').length;
  const totalSessions = myPois.reduce((s, p) => s + p.listeningSessions, 0);

  const trendData = {
    '7': listeningTrend7Days,
    '30': listeningTrend30Days,
    '3m': listeningTrend3Months,
  }[trendRange];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brown-900">Tổng quan</h1>
        <p className="text-sm text-brown-400 mt-1">Quản lý POI và theo dõi hoạt động thuyết minh của gian hàng.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard label="POI của tôi" value={String(totalPois)} trend={`${approvedPois} đã duyệt`} trendUp sublabel="Tổng số điểm tham quan" icon={MapPin} iconBg="bg-primary-100" iconColor="text-primary-600" />
        <KPICard label="POI đã duyệt" value={String(approvedPois)} trend={`${Math.round(approvedPois / totalPois * 100)}%`} trendUp sublabel="Đang hoạt động" icon={Check} iconBg="bg-green-100" iconColor="text-green-600" />
        <KPICard label="POI đang chờ duyệt" value={String(pendingPois)} trend={pendingPois > 0 ? 'Chờ xét duyệt' : 'Không có'} trendUp={pendingPois === 0} sublabel="Đang chờ quản trị viên" icon={Clock} iconBg="bg-orange-100" iconColor="text-orange-600" />
        <KPICard label="Tổng lượt nghe" value={formatNumber(totalSessions)} trend="+12.4%" trendUp sublabel="so với tháng trước" icon={Headphones} iconBg="bg-blue-100" iconColor="text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Lượt nghe theo thời gian"
              subtitle="Theo dõi lượt nghe POI của bạn"
              action={
                <div className="flex items-center gap-1 bg-brown-50 rounded-lg p-1">
                  {([['7', '7 ngày'], ['30', '30 ngày'], ['3m', '3 tháng']] as const).map(([key, label]) => (
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
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #dbeafe', fontSize: '12px' }} formatter={(value) => [`${formatNumber(Number(value))} lượt nghe`, 'Lượt nghe']} />
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
                title="Trạng thái POI của tôi"
                subtitle="Tất cả điểm tham quan thuộc gian hàng"
                action={<Button size="sm" variant="secondary" onClick={() => setCurrentPage('my-poi')} icon={<ArrowRight className="w-3.5 h-3.5" />}>Xem tất cả</Button>}
              />
            </div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-brown-100 bg-brown-50/50">
                    <th className="px-5 py-2.5 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">STT</th>
                    <th className="px-5 py-2.5 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">Điểm tham quan</th>
                    <th className="px-5 py-2.5 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">Danh mục</th>
                    <th className="px-5 py-2.5 text-right font-medium text-brown-500 text-xs uppercase tracking-wider">Lượt nghe</th>
                    <th className="px-5 py-2.5 text-center font-medium text-brown-500 text-xs uppercase tracking-wider">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {myPois.map((poi, i) => (
                    <tr key={poi.id} className="border-b border-brown-50 hover:bg-brown-50/30 transition-colors cursor-pointer" onClick={() => setCurrentPage('my-poi')}>
                      <td className="px-5 py-3 text-brown-500">{i + 1}</td>
                      <td className="px-5 py-3 font-medium text-brown-800">{poi.name}</td>
                      <td className="px-5 py-3 text-brown-600">{poi.category}</td>
                      <td className="px-5 py-3 text-right text-brown-700">{formatNumber(poi.listeningSessions)}</td>
                      <td className="px-5 py-3 text-center">
                        <Badge variant={poi.approvalStatus === 'approved' ? 'approved' : poi.approvalStatus === 'pending' ? 'pending' : 'rejected'}>
                          {statusLabels[poi.approvalStatus]}
                        </Badge>
                      </td>
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
            subtitle="Thao tác mới nhất"
            action={<Button size="sm" variant="ghost" onClick={() => setCurrentPage('account')}>Xem tất cả</Button>}
          />
          <div className="space-y-3">
            {activityLogs.slice(0, 6).map(log => {
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
