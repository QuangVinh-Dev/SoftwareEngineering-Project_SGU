import { useState } from 'react';
import { MapPin, X, Headphones, Languages, Clock, Activity } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui';
import { heatmapAreas } from '@/data/mockData';
import { classNames, formatNumber } from '@/utils/helpers';

const dateRanges = ['Today', 'Last 7 Days', 'Last 30 Days', 'Custom'];

export default function Heatmap() {
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [selectedArea, setSelectedArea] = useState<typeof heatmapAreas[0] | null>(null);

  const maxSessions = Math.max(...heatmapAreas.map(a => a.sessions));

  const getIntensity = (sessions: number) => {
    const ratio = sessions / maxSessions;
    if (ratio > 0.8) return { bg: 'bg-red-500/70', border: 'border-red-400', label: 'Very High' };
    if (ratio > 0.6) return { bg: 'bg-orange-500/70', border: 'border-orange-400', label: 'High' };
    if (ratio > 0.4) return { bg: 'bg-gold-500/70', border: 'border-gold-400', label: 'Medium' };
    if (ratio > 0.2) return { bg: 'bg-primary-400/60', border: 'border-primary-300', label: 'Low' };
    return { bg: 'bg-primary-200/50', border: 'border-primary-100', label: 'Very Low' };
  };

  const totalSessions = heatmapAreas.reduce((s, a) => s + a.sessions, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brown-900">Anonymous Listening Heatmap</h1>
        <p className="text-sm text-brown-400 mt-1">Visualize listening density across Hoi An areas. No personal data is shown.</p>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1 bg-brown-50 rounded-lg p-1 flex-wrap">
            {dateRanges.map(r => (
              <button key={r} onClick={() => setDateRange(r)}
                className={classNames('px-3 py-1 text-xs font-medium rounded-md transition-colors',
                  dateRange === r ? 'bg-white text-primary-700 shadow-sm' : 'text-brown-500 hover:text-brown-700')}>
                {r}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-brown-500">
            <span>Legend:</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary-200/50" /> Very Low</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary-400/60" /> Low</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gold-500/70" /> Medium</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500/70" /> High</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/70" /> Very High</span>
          </div>
        </div>

        <div className="relative w-full h-[500px] rounded-xl border border-brown-200 bg-gradient-to-br from-green-50 via-brown-50 to-blue-50 overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 30px, #c0c0c0 30px, #c0c0c0 31px), repeating-linear-gradient(90deg, transparent, transparent 30px, #c0c0c0 30px, #c0c0c0 31px)'
          }} />

          <div className="absolute top-4 left-4 bg-white/90 rounded-lg px-3 py-2 text-xs text-brown-600 shadow-sm z-10">
            <p className="font-semibold text-brown-800">Hoi An Old Town</p>
            <p className="text-brown-400 mt-0.5">{dateRange} — {formatNumber(totalSessions)} total sessions</p>
          </div>

          <div className="absolute top-4 right-4 bg-white/90 rounded-lg px-3 py-2 text-xs shadow-sm z-10">
            <p className="text-brown-400">Mock Map — Click areas for details</p>
          </div>

          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            <path d="M 20% 60% Q 50% 65%, 80% 60%" stroke="#60a5fa" strokeWidth="8" fill="none" opacity="0.3" strokeLinecap="round" />
            <text x="50%" y="62%" textAnchor="middle" className="fill-blue-300 text-xs font-medium" style={{ fontSize: '11px' }}>Sông Hoài</text>
          </svg>

          {heatmapAreas.map(area => {
            const intensity = getIntensity(area.sessions);
            const size = 40 + (area.sessions / maxSessions) * 50;
            return (
              <button
                key={area.id}
                onClick={() => setSelectedArea(area)}
                className={classNames(
                  'absolute rounded-full border-2 transition-all hover:scale-110 hover:z-10 animate-fade-in',
                  intensity.bg, intensity.border,
                  selectedArea?.id === area.id && 'ring-4 ring-primary-300 scale-110 z-10'
                )}
                style={{
                  left: `${area.x}%`, top: `${area.y}%`,
                  width: `${size}px`, height: `${size}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                title={area.name}
              >
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white pointer-events-none">
                  {formatNumber(area.sessions)}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {heatmapAreas.map(area => {
          const intensity = getIntensity(area.sessions);
          return (
            <button key={area.id} onClick={() => setSelectedArea(area)}
              className="text-left bg-white rounded-xl border border-brown-100 shadow-card hover:shadow-card-hover transition-all p-4">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="w-4 h-4 text-primary-500" />
                <span className={classNames('text-[10px] font-semibold px-2 py-0.5 rounded-full',
                  intensity.label === 'Very High' ? 'bg-red-50 text-red-600' :
                  intensity.label === 'High' ? 'bg-orange-50 text-orange-600' :
                  intensity.label === 'Medium' ? 'bg-gold-100 text-gold-700' :
                  'bg-brown-50 text-brown-500'
                )}>{intensity.label}</span>
              </div>
              <p className="text-sm font-semibold text-brown-800 truncate">{area.name}</p>
              <p className="text-lg font-bold text-primary-600 mt-1">{formatNumber(area.sessions)}</p>
              <p className="text-xs text-brown-400">sessions</p>
            </button>
          );
        })}
      </div>

      {selectedArea && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedArea(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-brown-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-500" />
                <h3 className="text-lg font-semibold text-brown-900">{selectedArea.name}</h3>
              </div>
              <button onClick={() => setSelectedArea(null)} className="p-1 rounded-lg hover:bg-brown-50 text-brown-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-brown-50 rounded-lg">
                <Activity className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="text-xs text-brown-400">Listening Sessions</p>
                  <p className="text-xl font-bold text-brown-900">{formatNumber(selectedArea.sessions)}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-primary-400" />
                  <div>
                    <p className="text-xs text-brown-400">Most Popular POI</p>
                    <p className="text-sm font-semibold text-brown-800">{selectedArea.topPoi}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Languages className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-xs text-brown-400">Most Popular Language</p>
                    <p className="text-sm font-semibold text-brown-800">{selectedArea.topLang}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gold-50 rounded-lg">
                  <Clock className="w-5 h-5 text-gold-500" />
                  <div>
                    <p className="text-xs text-brown-400">Average Listening Time</p>
                    <p className="text-sm font-semibold text-brown-800">{selectedArea.avgTime}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                <Headphones className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-xs text-green-700">All data is anonymous. No personal information is collected or displayed.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
