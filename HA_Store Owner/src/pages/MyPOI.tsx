import { useCallback, useEffect, useMemo, useState } from 'react';
import { ImagePlus, MapPin, Plus, RefreshCw, Search } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import { useApp } from '@/hooks/useApp';
import { ApiError } from '@/services/authApi';
import { getMerchantPois, resolveMerchantPoiImage, type MerchantPoi } from '@/services/poiApi';

const approvalLabels: Record<string, string> = {
  APPROVED: 'Đã duyệt',
  PENDING: 'Chờ duyệt',
  REJECTED: 'Từ chối',
};

export default function MyPOI() {
  const { setCurrentPage } = useApp();
  const [pois, setPois] = useState<MerchantPoi[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPois = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPois(await getMerchantPois());
    } catch (cause) {
      const message = cause instanceof ApiError ? cause.message : 'Không tải được danh sách POI.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPois(); }, [loadPois]);

  const filtered = useMemo(() => pois.filter(poi => poi.name.toLowerCase().includes(search.trim().toLowerCase())), [pois, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-brown-900">POI của tôi</h1>
          <p className="mt-1 text-sm text-brown-400">POI bạn gửi và trạng thái xét duyệt từ quản trị viên.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void loadPois()} disabled={loading} icon={<RefreshCw className="h-4 w-4" />}>Tải lại</Button>
          <Button onClick={() => setCurrentPage('submit-poi')} icon={<Plus className="h-4 w-4" />}>Gửi POI mới</Button>
        </div>
      </div>

      <Card noPadding>
        <div className="border-b border-brown-100 p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brown-400" />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm POI theo tên…" className="w-full rounded-lg border border-brown-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-primary-400" />
          </div>
        </div>
        {loading ? <p className="px-4 py-12 text-center text-sm text-brown-400">Đang tải POI…</p>
          : error ? <div className="px-4 py-8 text-center"><p role="alert" className="mb-3 text-sm text-red-600">{error}</p><Button variant="secondary" onClick={() => void loadPois()}>Thử lại</Button></div>
            : filtered.length === 0 ? <div className="px-4 py-12 text-center text-sm text-brown-400">{pois.length ? 'Không tìm thấy POI nào.' : 'Bạn chưa gửi POI nào.'}</div>
              : <div className="divide-y divide-brown-100">{filtered.map(poi => (
                <article key={poi.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
                  {poi.images[0] ? <img src={resolveMerchantPoiImage(poi.images[0])} alt={poi.name} className="h-28 w-full rounded-lg object-cover sm:w-40" />
                    : <div className="flex h-28 w-full items-center justify-center rounded-lg bg-brown-50 text-brown-300 sm:w-40"><ImagePlus className="h-7 w-7" /></div>}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-brown-900">{poi.name}</h2>
                      <Badge variant={poi.approvalStatus === 'APPROVED' ? 'active' : poi.approvalStatus === 'PENDING' ? 'partial' : 'skipped'}>{approvalLabels[poi.approvalStatus] ?? poi.approvalStatus}</Badge>
                    </div>
                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-brown-600">{poi.originalDescription || 'Chưa có nội dung giới thiệu.'}</p>
                    <p className="mt-2 text-xs text-brown-400">{poi.images.length} hình · {poi.latitude}, {poi.longitude} · bán kính {poi.radius} m</p>
                    {poi.approvalStatus === 'REJECTED' && poi.rejectionReason && <p className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-700">Lý do từ chối: {poi.rejectionReason}</p>}
                    {poi.approvalStatus === 'PENDING' && <p className="mt-2 text-sm text-orange-700">POI chỉ hiển thị công khai sau khi được duyệt.</p>}
                  </div>
                </article>
              ))}</div>}
        <div className="border-t border-brown-100 px-4 py-3 text-sm text-brown-500">Hiển thị {filtered.length} / {pois.length} POI</div>
      </Card>
      <div className="flex items-center gap-2 text-xs text-brown-400"><MapPin className="h-4 w-4" /> POI chưa được duyệt sẽ không xuất hiện trong ứng dụng người dùng.</div>
    </div>
  );
}
