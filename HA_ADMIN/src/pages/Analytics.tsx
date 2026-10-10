import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Card, CardHeader } from '@/components/ui';
import { top10Pois, avgTimeByPoi, avgTimeByLanguage, listeningTrend30Days, listeningTrend3Months, listeningTrend1Year } from '@/data/mockData';
import { classNames, formatNumber } from '@/utils/helpers';

const barColors = ['#a85f31', '#c07a3e', '#d99d2b', '#9a6d54', '#7e5742', '#cc9259', '#bd7a20', '#654536', '#b08870', '#cab09c'];

export default function Analytics() {
  const [trendRange, setTrendRange] = useState<'30' | '3m' | '1y'>('30');

  const trendData = { '30': listeningTrend30Days, '3m': listeningTrend3Months, '1y': listeningTrend1Year }[trendRange];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brown-900">Statistics & Analytics</h1>
        <p className="text-sm text-brown-400 mt-1">Detailed analytics across POIs, languages, and time.</p>
      </div>

      <Card noPadding>
        <div className="p-5 pb-3">
          <CardHeader title="Top 10 Most Listened POIs" subtitle="Ranked by total listening sessions" />
        </div>
        <div className="px-5 pb-5">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={top10Pois} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e9e2" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9a6d54' }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 11, fill: '#9a6d54' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e0d1c3', fontSize: '12px' }} cursor={{ fill: '#f5ebdb' }} />
              <Bar dataKey="sessions" radius={[6, 6, 0, 0]} animationDuration={800}>
                {top10Pois.map((_, i) => <Cell key={i} fill={barColors[i % barColors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brown-100">
                  <th className="px-3 py-2 text-left font-medium text-brown-500 text-xs uppercase">Rank</th>
                  <th className="px-3 py-2 text-left font-medium text-brown-500 text-xs uppercase">POI</th>
                  <th className="px-3 py-2 text-right font-medium text-brown-500 text-xs uppercase">Sessions</th>
                  <th className="px-3 py-2 text-right font-medium text-brown-500 text-xs uppercase">Avg. Time</th>
                  <th className="px-3 py-2 text-right font-medium text-brown-500 text-xs uppercase">Share</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const total = top10Pois.reduce((s, p) => s + p.sessions, 0);
                  return top10Pois.map((poi, i) => (
                    <tr key={i} className="border-b border-brown-50 hover:bg-brown-50/30 transition-colors">
                      <td className="px-3 py-2.5">
                        <span className={classNames(
                          'inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold',
                          i < 3 ? 'bg-gold-100 text-gold-700' : 'bg-brown-50 text-brown-500'
                        )}>{i + 1}</span>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-brown-800">{poi.name}</td>
                      <td className="px-3 py-2.5 text-right text-brown-700">{formatNumber(poi.sessions)}</td>
                      <td className="px-3 py-2.5 text-right text-brown-600 font-mono">{poi.avgTime}</td>
                      <td className="px-3 py-2.5 text-right text-brown-500">{((poi.sessions / total) * 100).toFixed(1)}%</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Average Listening Time by POI" subtitle="Minutes per session" />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={avgTimeByPoi} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e9e2" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9a6d54' }} axisLine={false} tickLine={false} unit=" min" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#9a6d54' }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e0d1c3', fontSize: '12px' }} cursor={{ fill: '#f5ebdb' }} formatter={(v) => [`${Number(v).toFixed(1)} min`, 'Avg Time']} />
              <Bar dataKey="time" radius={[0, 6, 6, 0]} animationDuration={800} fill="#a85f31" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader title="Average Listening Time by Language" subtitle="Minutes per session" />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={avgTimeByLanguage} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e9e2" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9a6d54' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9a6d54' }} axisLine={false} tickLine={false} unit=" min" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e0d1c3', fontSize: '12px' }} cursor={{ fill: '#f5ebdb' }} formatter={(v) => [`${Number(v).toFixed(1)} min`, 'Avg Time']} />
              <Bar dataKey="time" radius={[6, 6, 0, 0]} animationDuration={800}>
                {avgTimeByLanguage.map((_, i) => <Cell key={i} fill={barColors[i % barColors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Listening Sessions Over Time"
          subtitle="Trend analysis"
          action={
            <div className="flex items-center gap-1 bg-brown-50 rounded-lg p-1">
              {([['30', '30 Days'], ['3m', '3 Months'], ['1y', '1 Year']] as const).map(([key, label]) => (
                <button key={key} onClick={() => setTrendRange(key)}
                  className={classNames('px-3 py-1 text-xs font-medium rounded-md transition-colors',
                    trendRange === key ? 'bg-white text-primary-700 shadow-sm' : 'text-brown-500 hover:text-brown-700')}>
                  {label}
                </button>
              ))}
            </div>
          }
        />
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0e9e2" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9a6d54' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9a6d54' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e0d1c3', fontSize: '12px' }} />
            <Line type="monotone" dataKey="sessions" stroke="#a85f31" strokeWidth={2.5} dot={{ r: 3, fill: '#a85f31' }} activeDot={{ r: 5 }} animationDuration={800} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
