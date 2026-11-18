import { useCallback, useEffect, useMemo, useState } from 'react';
import { Headphones, RefreshCw, Search } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import AudioPlayer from '@/components/AudioPlayer';
import { apiMessage } from '@/services/authApi';
import { getPoiAudios, getPoiContent, getPoiLocations, resolveAudioUrl, SUPPORTED_LANGUAGES, type PoiAudio } from '@/services/adminContentApi';

interface AudioRow {
  key: string;
  poiId: number;
  poiName: string;
  languageCode: string;
  languageName: string;
  translationStatus: string | null;
  audio: PoiAudio | null;
}

export default function AudioContent() {
  const [rows, setRows] = useState<AudioRow[]>([]);
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const pois = await getPoiLocations();
      const poiContent = await Promise.all(pois.map(async poi => ({ poi, content: await getPoiContent(poi.id) })));
      const next = await Promise.all(poiContent.flatMap(({ poi, content }) =>
        SUPPORTED_LANGUAGES.map(async language => {
          const translation = content.languages.find(item => item.code === language.code);
          const available = translation?.status === 'APPROVED' && translation.active
            ? await getPoiAudios(poi.id, language.code)
            : [];
          return {
            key: `${poi.id}-${language.code}`,
            poiId: poi.id,
            poiName: poi.name,
            languageCode: language.code,
            languageName: language.name,
            translationStatus: translation?.status ?? null,
            audio: available[0] ?? null,
          } satisfies AudioRow;
        }),
      ));
      setRows(next);
    } catch (loadError) {
      setError(apiMessage(loadError));
      setRows([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => rows.filter(row =>
    (row.poiName.toLowerCase().includes(search.trim().toLowerCase()) || row.languageName.toLowerCase().includes(search.trim().toLowerCase()))
    && (languageFilter === 'all' || row.languageCode === languageFilter),
  ), [rows, search, languageFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-brown-900">Trạng thái audio</h1><p className="text-sm text-brown-400 mt-1">Dữ liệu được tải từ API nội dung quản trị và API audio đã duyệt.</p></div>
        <Button variant="secondary" onClick={() => void load()} disabled={loading} icon={<RefreshCw className="w-4 h-4" />}>Tải lại trạng thái</Button>
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-brown-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm POI hoặc ngôn ngữ…" className="w-full pl-10 pr-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" /></div>
          <select value={languageFilter} onChange={event => setLanguageFilter(event.target.value)} className="px-3 py-2 rounded-lg border border-brown-200 text-sm text-brown-700 outline-none focus:border-primary-400 bg-white"><option value="all">Tất cả ngôn ngữ</option>{SUPPORTED_LANGUAGES.map(language => <option key={language.code} value={language.code}>{language.name}</option>)}</select>
        </div>
        {loading ? <div className="px-4 py-12 text-center text-sm text-brown-400">Đang kiểm tra trạng thái audio…</div>
          : error ? <div className="px-4 py-8 text-center"><p role="alert" className="mb-3 text-sm text-red-600">{error}</p><Button variant="secondary" onClick={() => void load()}>Thử lại</Button></div>
            : filtered.length === 0 ? <div className="px-4 py-12 text-center text-sm text-brown-400">Chưa có dữ liệu audio phù hợp.</div>
              : <div className="overflow-x-auto scrollbar-thin"><table className="w-full text-sm min-w-[800px]">
                <thead><tr className="border-b border-brown-100 bg-brown-50/50"><th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-brown-500">POI</th><th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-brown-500">Ngôn ngữ</th><th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-brown-500">Bản dịch</th><th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-brown-500">Audio / thời lượng</th><th className="px-4 py-3 text-center text-xs uppercase tracking-wider text-brown-500">Trạng thái</th></tr></thead>
                <tbody>{filtered.map(row => <tr key={row.key} className="border-b border-brown-50 hover:bg-brown-50/30">
                  <td className="px-4 py-3 font-medium text-brown-800">{row.poiName}<div className="text-xs text-brown-400">ID {row.poiId}</div></td>
                  <td className="px-4 py-3 text-brown-600">{row.languageName} <span className="text-xs text-brown-400">({row.languageCode})</span></td>
                  <td className="px-4 py-3"><Badge variant={row.translationStatus === 'APPROVED' ? 'active' : row.translationStatus === 'PENDING' ? 'partial' : 'inactive'}>{row.translationStatus === 'APPROVED' ? 'Đã duyệt' : row.translationStatus === 'PENDING' ? 'Chờ duyệt' : 'Chưa có'}</Badge></td>
                  <td className="px-4 py-3">{row.audio ? <div className="min-w-[240px] space-y-1"><p className="text-xs text-brown-600">{row.audio.voiceName} · backend {row.audio.durationSeconds ?? '—'} giây</p><AudioPlayer title={`${row.poiName} · ${row.languageName}`} src={resolveAudioUrl(row.audio.filePath) ?? ''} /></div> : <span className="text-xs text-brown-400">Chưa có audio được API phát audio công bố</span>}</td>
                  <td className="px-4 py-3 text-center">{row.audio ? <Badge variant="enabled"><Headphones className="w-3 h-3" /> Sẵn sàng</Badge> : <Badge variant="inactive">Chưa sẵn sàng</Badge>}</td>
                </tr>)}</tbody>
              </table><div className="px-4 py-3 border-t border-brown-100 text-sm text-brown-500">{filtered.length} trạng thái · tải theo dữ liệu backend</div></div>}
      </Card>
    </div>
  );
}
