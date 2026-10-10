import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { searchAll } from '@/data/mockData';
import { useApp } from '@/hooks/useApp';

export default function SearchDropdown() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const { setCurrentPage } = useApp();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const results = query ? searchAll(query) : [];
  const categoryColors: Record<string, string> = {
    'POI của tôi': 'bg-primary-100 text-primary-700',
    'Nội dung audio': 'bg-blue-100 text-blue-700',
    'Thống kê': 'bg-primary-100 text-primary-700',
    'Tài khoản': 'bg-brown-200 text-brown-700',
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-brown-200 bg-white hover:border-primary-300 transition-colors w-full sm:w-64 lg:w-72"
      >
        <Search className="w-4 h-4 text-brown-400 flex-shrink-0" />
        <span className="text-sm text-brown-400 flex-1 text-left">Tìm kiếm...</span>
        <kbd className="hidden sm:inline text-[10px] text-brown-300 bg-brown-50 px-1.5 py-0.5 rounded border border-brown-100">⌘K</kbd>
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 sm:w-96 max-w-full bg-white rounded-xl shadow-xl border border-brown-100 z-50 animate-scale-in overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-brown-100">
            <Search className="w-4 h-4 text-brown-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Tìm POI, nội dung audio, thống kê..."
              className="flex-1 text-sm outline-none bg-transparent text-brown-800"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-brown-400 hover:text-brown-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {query === '' && (
              <div className="px-4 py-6 text-center text-sm text-brown-400">
                Nhập để tìm kiếm POI, nội dung audio, thống kê của bạn.
              </div>
            )}
            {query !== '' && results.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-brown-400">
                Không tìm thấy kết quả phù hợp.
              </div>
            )}
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => { setCurrentPage(r.link as never); setOpen(false); setQuery(''); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brown-50 transition-colors text-left"
              >
                <span className={`text-[10px] font-semibold px-2 py-1 rounded ${categoryColors[r.category] || 'bg-brown-100 text-brown-600'}`}>
                  {r.category}
                </span>
                <span className="text-sm text-brown-700 flex-1 truncate">{r.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
