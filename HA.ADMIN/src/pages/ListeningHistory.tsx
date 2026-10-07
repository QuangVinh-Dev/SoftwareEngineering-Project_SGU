import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsUpDown, Check, X, Filter, RotateCcw } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { useToast } from '@/components/toast/ToastProvider';
import { listeningHistory, pois, languages } from '@/data/mockData';
import type { ListeningHistoryEntry } from '@/types';
import { classNames } from '@/utils/helpers';

const timeFilters = ['Today', 'Last 7 days', 'Last 30 days', 'This month', 'Custom'];
const statusVariants: Record<ListeningHistoryEntry['status'], 'completed' | 'partial' | 'skipped'> = {
  completed: 'completed', partial: 'partial', skipped: 'skipped',
};

function MultiSelect({ options, selected, onChange, label }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void; label: string;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (val: string) => {
    if (selected.includes(val)) onChange(selected.filter(v => v !== val));
    else onChange([...selected, val]);
  };

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-brown-500 mb-1">{label}</label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-brown-200 text-sm text-brown-700 bg-white hover:border-primary-300 transition-colors"
      >
        <span className={selected.length === 0 ? 'text-brown-400' : 'text-brown-700'}>
          {selected.length === 0 ? 'All' : `${selected.length} selected`}
        </span>
        <ChevronsUpDown className="w-4 h-4 text-brown-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full bg-white rounded-lg shadow-xl border border-brown-100 max-h-56 overflow-y-auto scrollbar-thin animate-scale-in">
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-brown-50 transition-colors text-left text-sm text-brown-700"
              >
                <span className={classNames(
                  'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                  selected.includes(opt) ? 'bg-primary-600 border-primary-600' : 'border-brown-300'
                )}>
                  {selected.includes(opt) && <Check className="w-3 h-3 text-white" />}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ListeningHistory() {
  const { showToast } = useToast();
  const [timeFilter, setTimeFilter] = useState('Last 7 days');
  const [poiFilter, setPoiFilter] = useState<string[]>([]);
  const [langFilter, setLangFilter] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof ListeningHistoryEntry>('datetime');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [appliedFilters, setAppliedFilters] = useState({ poi: [] as string[], lang: [] as string[], time: 'Last 7 days' });
  const pageSize = 10;

  const poiNames = pois.map(p => p.name);
  const langNames = languages.map(l => l.name);

  const filtered = useMemo(() => {
    let result = [...listeningHistory];
    if (appliedFilters.poi.length > 0) result = result.filter(r => appliedFilters.poi.includes(r.poi));
    if (appliedFilters.lang.length > 0) result = result.filter(r => appliedFilters.lang.includes(r.language));
    if (search) result = result.filter(r =>
      r.poi.toLowerCase().includes(search.toLowerCase()) ||
      r.language.toLowerCase().includes(search.toLowerCase()) ||
      r.device.toLowerCase().includes(search.toLowerCase())
    );
    result.sort((a, b) => {
      const av = a[sortField]; const bv = b[sortField];
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [appliedFilters, search, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const applyFilters = () => {
    setAppliedFilters({ poi: poiFilter, lang: langFilter, time: timeFilter });
    setPage(1);
    showToast('info', 'Filters applied.');
  };

  const resetFilters = () => {
    setPoiFilter([]); setLangFilter([]); setTimeFilter('Last 7 days');
    setAppliedFilters({ poi: [], lang: [], time: 'Last 7 days' });
    setSearch(''); setPage(1);
    showToast('info', 'Filters reset.');
  };

  const toggleSort = (field: keyof ListeningHistoryEntry) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortHeader = ({ field, label }: { field: keyof ListeningHistoryEntry; label: string }) => (
    <th className="px-4 py-3 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">
      <button onClick={() => toggleSort(field)} className="flex items-center gap-1 hover:text-brown-700 transition-colors">
        {label}
        <ChevronsUpDown className={classNames('w-3 h-3', sortField === field ? 'text-primary-500' : 'text-brown-300')} />
      </button>
    </th>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brown-900">Listening History</h1>
        <p className="text-sm text-brown-400 mt-1">Anonymous listening logs across all POIs and languages.</p>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-brown-400" />
          <h3 className="text-sm font-semibold text-brown-800">Filters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-brown-500 mb-1">Time</label>
            <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm text-brown-700 bg-white outline-none focus:border-primary-400">
              {timeFilters.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <MultiSelect options={poiNames} selected={poiFilter} onChange={setPoiFilter} label="POI" />
          <MultiSelect options={langNames} selected={langFilter} onChange={setLangFilter} label="Language" />
          <div className="flex items-end gap-2">
            <Button onClick={applyFilters} size="sm" className="flex-1">Apply Filters</Button>
            <Button onClick={resetFilters} variant="secondary" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />}>Reset</Button>
          </div>
        </div>
        {(appliedFilters.poi.length > 0 || appliedFilters.lang.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-brown-100">
            <span className="text-xs text-brown-400">Active filters:</span>
            {appliedFilters.poi.map(p => (
              <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs">
                {p} <button onClick={() => { setPoiFilter(appliedFilters.poi.filter(x => x !== p)); setAppliedFilters({ ...appliedFilters, poi: appliedFilters.poi.filter(x => x !== p) }); }}><X className="w-3 h-3" /></button>
              </span>
            ))}
            {appliedFilters.lang.map(l => (
              <span key={l} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs">
                {l} <button onClick={() => { setLangFilter(appliedFilters.lang.filter(x => x !== l)); setAppliedFilters({ ...appliedFilters, lang: appliedFilters.lang.filter(x => x !== l) }); }}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card noPadding>
        <div className="p-4 border-b border-brown-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search history..."
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-brown-100 bg-brown-50/50">
                <SortHeader field="datetime" label="Date & Time" />
                <SortHeader field="poi" label="POI" />
                <SortHeader field="language" label="Language" />
                <SortHeader field="duration" label="Duration" />
                <SortHeader field="device" label="Device" />
                <th className="px-4 py-3 text-center font-medium text-brown-500 text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map(entry => (
                <tr key={entry.id} className="border-b border-brown-50 hover:bg-brown-50/30 transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-brown-600 font-mono text-xs">{entry.datetime}</td>
                  <td className="px-4 py-3 font-medium text-brown-800">{entry.poi}</td>
                  <td className="px-4 py-3 text-brown-600">{entry.language}</td>
                  <td className="px-4 py-3 text-brown-600 font-mono">{entry.duration}</td>
                  <td className="px-4 py-3 text-brown-500">{entry.device}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={statusVariants[entry.status]}>
                      {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pageData.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-brown-400">No listening history found.</div>
        )}

        <div className="px-4 py-3 border-t border-brown-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-brown-500">
          <span>
            Showing {pageData.length > 0 ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-brown-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronsUpDown className="w-4 h-4 rotate-90" />
            </button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-brown-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-xs font-medium text-brown-700">
              Page {page} of {totalPages || 1}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-brown-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-brown-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronsUpDown className="w-4 h-4 -rotate-90" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
