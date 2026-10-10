import { useState } from 'react';
import { FileSpreadsheet, FileText, Download, Loader2, CheckCircle2, Calendar } from 'lucide-react';
import { Card, CardHeader, Button } from '@/components/ui';
import { useToast } from '@/components/toast/ToastProvider';
import { classNames } from '@/utils/helpers';

const reportTypes = [
  { id: 'listening', label: 'Listening Report', desc: 'Detailed listening session statistics', icon: FileText },
  { id: 'poi', label: 'POI Report', desc: 'Performance breakdown by point of interest', icon: FileText },
  { id: 'language', label: 'Language Report', desc: 'Usage distribution by language', icon: FileText },
  { id: 'avgtime', label: 'Average Listening Time', desc: 'Time analysis across POIs and languages', icon: FileText },
  { id: 'full', label: 'Full System Report', desc: 'Comprehensive system-wide analytics', icon: FileText },
];

export default function Reports() {
  const { showToast } = useToast();
  const [selectedType, setSelectedType] = useState('listening');
  const [startDate, setStartDate] = useState('2026-09-07');
  const [endDate, setEndDate] = useState('2026-10-07');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleExport = (format: 'excel' | 'pdf') => {
    if (!startDate || !endDate) {
      showToast('warning', 'Please select a date range.');
      return;
    }
    setGenerating(true);
    setGenerated(false);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
      showToast('success', `Report exported successfully. (${format.toUpperCase()})`);
      setTimeout(() => setGenerated(false), 3000);
    }, 2200);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brown-900">Reports</h1>
        <p className="text-sm text-brown-400 mt-1">Generate and export system reports.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Report Type" subtitle="Select the type of report to generate" />
            <div className="space-y-2">
              {reportTypes.map(rt => {
                const Icon = rt.icon;
                return (
                  <button
                    key={rt.id}
                    onClick={() => setSelectedType(rt.id)}
                    className={classNames(
                      'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                      selectedType === rt.id
                        ? 'border-primary-400 bg-primary-50 ring-1 ring-primary-200'
                        : 'border-brown-100 hover:border-brown-200 hover:bg-brown-50/50'
                    )}
                  >
                    <div className={classNames(
                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      selectedType === rt.id ? 'bg-primary-600 text-white' : 'bg-brown-50 text-brown-400'
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={classNames('text-sm font-semibold', selectedType === rt.id ? 'text-primary-700' : 'text-brown-800')}>{rt.label}</p>
                      <p className="text-xs text-brown-400">{rt.desc}</p>
                    </div>
                    <div className={classNames(
                      'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                      selectedType === rt.id ? 'border-primary-600 bg-primary-600' : 'border-brown-200'
                    )}>
                      {selectedType === rt.id && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHeader title="Date Range" subtitle="Select the period for the report" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1.5">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400 pointer-events-none" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-brown-200 text-sm text-brown-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1.5">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400 pointer-events-none" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-brown-200 text-sm text-brown-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {['Today', 'Last 7 days', 'Last 30 days', 'This month', 'This year'].map(preset => (
                <button
                  key={preset}
                  onClick={() => {
                    const end = new Date('2026-10-07');
                    const start = new Date(end);
                    if (preset === 'Today') {}
                    else if (preset === 'Last 7 days') start.setDate(start.getDate() - 7);
                    else if (preset === 'Last 30 days') start.setDate(start.getDate() - 30);
                    else if (preset === 'This month') start.setDate(1);
                    else if (preset === 'This year') start.setMonth(0, 1);
                    setStartDate(start.toISOString().slice(0, 10));
                    setEndDate(end.toISOString().slice(0, 10));
                  }}
                  className="px-3 py-1 text-xs font-medium rounded-lg border border-brown-200 text-brown-600 hover:bg-brown-50 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Export" subtitle="Generate and download the report" />
            {generating ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-3" />
                <p className="text-sm text-brown-600 font-medium">Generating report...</p>
                <p className="text-xs text-brown-400 mt-1">This may take a few seconds.</p>
              </div>
            ) : generated ? (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
                <p className="text-sm font-semibold text-brown-800">Report exported successfully.</p>
                <p className="text-xs text-brown-400 mt-1">The file has been downloaded to your device.</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => handleExport('excel')} variant="success" size="lg" className="flex-1" icon={<FileSpreadsheet className="w-5 h-5" />}>
                  Export Excel
                </Button>
                <Button onClick={() => handleExport('pdf')} variant="danger" size="lg" className="flex-1" icon={<FileText className="w-5 h-5" />}>
                  Export PDF
                </Button>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Report Summary" subtitle="Current selection" />
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-brown-400">Type</span>
                <span className="font-medium text-brown-800">{reportTypes.find(r => r.id === selectedType)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brown-400">Start Date</span>
                <span className="font-medium text-brown-800">{startDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brown-400">End Date</span>
                <span className="font-medium text-brown-800">{endDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brown-400">Format</span>
                <span className="font-medium text-brown-800">Excel / PDF</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Recent Reports" subtitle="Previously generated" />
            <div className="space-y-2">
              {[
                { name: 'Monthly Listening Report', date: 'Oct 2026', type: 'Excel' },
                { name: 'POI Performance Q3', date: 'Sep 2026', type: 'PDF' },
                { name: 'Language Distribution', date: 'Sep 2026', type: 'Excel' },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-brown-50 transition-colors">
                  <div className={classNames('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    r.type === 'Excel' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}>
                    {r.type === 'Excel' ? <FileSpreadsheet className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brown-800 truncate">{r.name}</p>
                    <p className="text-xs text-brown-400">{r.date} — {r.type}</p>
                  </div>
                  <Download className="w-4 h-4 text-brown-300" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
