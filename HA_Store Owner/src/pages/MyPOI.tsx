import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, MapPin, Plus, RefreshCw, Search, X, Send } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import { useApp } from '@/hooks/useApp';
import { ApiError } from '@/services/authApi';
import { getMerchantPois, createMerchantPoi, resolveMerchantPoiImage, type MerchantPoi, type MerchantPoiInput } from '@/services/poiApi';
import { useToast } from '@/components/toast/ToastProvider';
import ConfirmDialog from '@/components/modals/ConfirmDialog';

const approvalLabels: Record<string, string> = {
  APPROVED: 'Đã duyệt',
  PENDING: 'Chờ duyệt',
  REJECTED: 'Từ chối',
};

const emptyForm = { name: '', description: '', latitude: '', longitude: '', radius: '30', directionLink: '' };

// ────────────────────────────────────────────────────────────────
// Modal tạo POI mới
// ────────────────────────────────────────────────────────────────
interface CreatePoiModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreatePoiModal({ onClose, onCreated }: CreatePoiModalProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState<File[]>([]);
  const [formError, setFormError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitStarted = useRef(false);

  const setField = (field: keyof typeof emptyForm, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
    setFormError('');
  };

  const handleImages = (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (selected.length > 5) {
      setImages([]);
      setFormError('Mỗi POI được tải tối đa 5 hình ảnh.');
      return;
    }
    if (selected.some(file => file.size > 10 * 1024 * 1024)) {
      setImages([]);
      setFormError('Mỗi hình ảnh có dung lượng tối đa 10 MB.');
      return;
    }
    setImages(selected);
    setFormError('');
  };

  const validate = () => {
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    const radius = Number(form.radius);
    if (!form.name.trim()) return 'Vui lòng nhập tên POI.';
    if (!form.latitude) return 'Vui lòng nhập vĩ độ.';
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return 'Vĩ độ phải nằm trong khoảng -90 đến 90.';
    if (!form.longitude) return 'Vui lòng nhập kinh độ.';
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return 'Kinh độ phải nằm trong khoảng -180 đến 180.';
    if (!Number.isInteger(radius) || radius < 1 || radius > 10000) return 'Bán kính phải là số nguyên từ 1 đến 10000 mét.';
    return '';
  };

  const handleSubmit = () => {
    const error = validate();
    setFormError(error);
    if (!error) setConfirmOpen(true);
  };

  const confirmSubmit = async () => {
    if (submitStarted.current) return;
    submitStarted.current = true;
    setSubmitting(true);
    setFormError('');
    const poi: MerchantPoiInput = {
      name: form.name.trim(),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      radius: Number(form.radius),
      priorityLevel: 0,
      originalDescription: form.description.trim(),
      directionLink: form.directionLink.trim(),
      status: 'ACTIVE',
    };

    try {
      await createMerchantPoi(poi, images);
      setConfirmOpen(false);
      showToast('success', 'POI đã được gửi và đang chờ quản trị viên duyệt.');
      onCreated();
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Không gửi được POI. Vui lòng thử lại.');
      setConfirmOpen(false);
    } finally {
      submitStarted.current = false;
      setSubmitting(false);
    }
  };

  const inputClass = 'mt-1 w-full rounded-lg border border-brown-200 px-3 py-2 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all';

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[900] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={() => !submitting && onClose()}
      >
        <div
          className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-brown-100 flex-shrink-0">
            <div>
              <h2 className="text-lg font-semibold text-brown-900">Tạo POI mới</h2>
              <p className="text-xs text-brown-400 mt-0.5">POI và hình ảnh sẽ chờ quản trị viên duyệt trước khi hiển thị.</p>
            </div>
            <button
              onClick={() => !submitting && onClose()}
              className="p-1.5 rounded-lg hover:bg-brown-50 text-brown-400 hover:text-brown-700 transition-colors"
              disabled={submitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-4">
            {formError && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {formError}
              </p>
            )}

            {/* Tên POI */}
            <label className="block text-sm font-medium text-brown-700">
              Tên POI <span className="text-red-500">*</span>
              <input
                required
                maxLength={200}
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                className={inputClass}
                placeholder="Ví dụ: Chùa Cầu"
                disabled={submitting}
              />
            </label>

            {/* Mô tả */}
            <label className="block text-sm font-medium text-brown-700">
              Nội dung giới thiệu
              <textarea
                maxLength={10000}
                rows={3}
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                className={`${inputClass} resize-y`}
                placeholder="Mô tả điểm đến để hiển thị cho người dùng"
                disabled={submitting}
              />
            </label>

            {/* Toạ độ */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-brown-700">
                Vĩ độ <span className="text-red-500">*</span>
                <input
                  type="number"
                  min={-90}
                  max={90}
                  step="0.000001"
                  value={form.latitude}
                  onChange={e => setField('latitude', e.target.value)}
                  className={inputClass}
                  placeholder="15.8805"
                  disabled={submitting}
                />
              </label>
              <label className="block text-sm font-medium text-brown-700">
                Kinh độ <span className="text-red-500">*</span>
                <input
                  type="number"
                  min={-180}
                  max={180}
                  step="0.000001"
                  value={form.longitude}
                  onChange={e => setField('longitude', e.target.value)}
                  className={inputClass}
                  placeholder="108.3380"
                  disabled={submitting}
                />
              </label>
              <label className="block text-sm font-medium text-brown-700">
                Bán kính (m) <span className="text-red-500">*</span>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  step={1}
                  value={form.radius}
                  onChange={e => setField('radius', e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </label>
              <label className="block text-sm font-medium text-brown-700">
                Liên kết chỉ đường
                <input
                  maxLength={500}
                  value={form.directionLink}
                  onChange={e => setField('directionLink', e.target.value)}
                  className={inputClass}
                  placeholder="https://maps.google.com/..."
                  disabled={submitting}
                />
              </label>
            </div>

            {/* Hình ảnh */}
            <div>
              <label className="block text-sm font-medium text-brown-700">
                <span className="inline-flex items-center gap-2">
                  <ImagePlus className="h-4 w-4" /> Hình ảnh (tối đa 5)
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/bmp"
                  multiple
                  onChange={e => handleImages(e.target.files)}
                  className="mt-2 block w-full text-sm"
                  disabled={submitting}
                />
              </label>
              <p className="mt-1 text-xs text-brown-400">Chấp nhận JPG, PNG, GIF hoặc BMP; tối đa 10 MB mỗi file.</p>
              {images.length > 0 && (
                <ul className="mt-2 list-inside list-disc text-xs text-brown-600">
                  {images.map(file => <li key={`${file.name}-${file.lastModified}`}>{file.name}</li>)}
                </ul>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-brown-100 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-brown-400">
              <MapPin className="h-3.5 w-3.5" />
              POI phải có tọa độ hợp lệ để hiển thị trên bản đồ.
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={onClose} disabled={submitting}>Hủy</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                icon={<Send className="h-4 w-4" />}
              >
                {submitting ? 'Đang gửi…' : 'Gửi duyệt'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void confirmSubmit()}
        title="Gửi duyệt POI"
        message="POI sẽ chưa xuất hiện công khai cho tới khi quản trị viên duyệt. Bạn muốn gửi POI này không?"
        confirmLabel={submitting ? 'Đang gửi…' : 'Gửi duyệt'}
        cancelLabel="Hủy"
        variant="info"
      />
    </>
  );
}

// ────────────────────────────────────────────────────────────────
// Trang chính: POI của tôi
// ────────────────────────────────────────────────────────────────
export default function MyPOI() {
  const { setCurrentPage } = useApp();
  const [pois, setPois] = useState<MerchantPoi[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

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

  const handleCreated = () => {
    setCreateModalOpen(false);
    void loadPois();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-brown-900">POI của tôi</h1>
          <p className="mt-1 text-sm text-brown-400">POI bạn gửi và trạng thái xét duyệt từ quản trị viên.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void loadPois()} disabled={loading} icon={<RefreshCw className="h-4 w-4" />}>Tải lại</Button>
          <Button onClick={() => setCreateModalOpen(true)} icon={<Plus className="h-4 w-4" />}>Tạo POI mới</Button>
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
            : filtered.length === 0 ? <div className="px-4 py-12 text-center text-sm text-brown-400">{pois.length ? 'Không tìm thấy POI nào.' : 'Bạn chưa có POI nào. Nhấn "Tạo POI mới" để bắt đầu.'}</div>
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
                    {poi.approvalStatus === 'REJECTED' && (
                      <div className="mt-3">
                        <Button size="sm" variant="secondary" onClick={() => setCurrentPage('edit-poi')}>Chỉnh sửa & Gửi lại</Button>
                      </div>
                    )}
                  </div>
                </article>
              ))}</div>}
        <div className="border-t border-brown-100 px-4 py-3 text-sm text-brown-500">Hiển thị {filtered.length} / {pois.length} POI</div>
      </Card>

      <div className="flex items-center gap-2 text-xs text-brown-400"><MapPin className="h-4 w-4" /> POI chưa được duyệt sẽ không xuất hiện trong ứng dụng người dùng.</div>

      {createModalOpen && (
        <CreatePoiModal
          onClose={() => setCreateModalOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
