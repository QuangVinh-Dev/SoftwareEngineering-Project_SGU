import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ImagePlus, MapPin, Plus, RefreshCw, X, Send, Edit3,
  AlertCircle, CheckCircle2, Clock, Mail, ExternalLink, Headphones, Sparkles, Store,
  Navigation
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import { useApp } from '@/hooks/useApp';
import { ApiError } from '@/services/authApi';
import {
  getMerchantPois,
  createMerchantPoi,
  updateMerchantPoi,
  resolveMerchantPoiImage,
  type MerchantPoi,
  type MerchantPoiInput
} from '@/services/poiApi';
import { useToast } from '@/components/toast/ToastProvider';
import ConfirmDialog from '@/components/modals/ConfirmDialog';

const approvalLabels: Record<string, string> = {
  APPROVED: 'Đã duyệt',
  PENDING: 'Chờ duyệt',
  REJECTED: 'Từ chối',
};

interface PoiFormState {
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  radius: string;
  directionLink: string;
}

const emptyForm: PoiFormState = {
  name: '',
  description: '',
  latitude: '15.8805',
  longitude: '108.3380',
  radius: '30',
  directionLink: '',
};

// ────────────────────────────────────────────────────────────────
// Modal Tạo / Chỉnh sửa POI duy nhất của gian hàng
// ────────────────────────────────────────────────────────────────
interface PoiModalProps {
  initialPoi?: MerchantPoi | null;
  onClose: () => void;
  onSaved: () => void;
}

function PoiModal({ initialPoi, onClose, onSaved }: PoiModalProps) {
  const isEdit = Boolean(initialPoi);
  const { showToast } = useToast();
  const [form, setForm] = useState<PoiFormState>(() => {
    if (initialPoi) {
      return {
        name: initialPoi.name || '',
        description: initialPoi.originalDescription || '',
        latitude: String(initialPoi.latitude ?? '15.8805'),
        longitude: String(initialPoi.longitude ?? '108.3380'),
        radius: String(initialPoi.radius ?? '30'),
        directionLink: initialPoi.directionLink || '',
      };
    }
    return emptyForm;
  });

  const [images, setImages] = useState<File[]>([]);
  const [formError, setFormError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gettingGPS, setGettingGPS] = useState(false);
  const submitStarted = useRef(false);

  const setField = (field: keyof PoiFormState, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
    setFormError('');
  };

  const handleGetCurrentGPS = () => {
    if (!navigator.geolocation) {
      setFormError('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }
    setGettingGPS(true);
    setFormError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setForm(curr => ({
          ...curr,
          latitude: lat,
          longitude: lng,
        }));
        setGettingGPS(false);
        showToast('success', `Đã lấy tọa độ GPS thành công: ${lat}, ${lng}`);
      },
      err => {
        setGettingGPS(false);
        let msg = 'Không thể lấy vị trí hiện tại.';
        if (err.code === 1) msg = 'Bạn đã từ chối quyền truy cập vị trí trên trình duyệt. Vui lòng cấp quyền hoặc nhập thủ công.';
        else if (err.code === 2) msg = 'Không tìm thấy tín hiệu vị trí GPS.';
        else if (err.code === 3) msg = 'Quá thời gian xác định vị trí GPS. Vui lòng thử lại hoặc nhập thủ công.';
        setFormError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleImages = (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (selected.length > 5) {
      setImages([]);
      setFormError('Điểm tham quan được tải tối đa 5 hình ảnh.');
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
    if (!form.name.trim()) return 'Vui lòng nhập tên điểm tham quan (POI).';
    if (!form.latitude) return 'Vui lòng nhập vĩ độ GPS.';
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return 'Vĩ độ phải nằm trong khoảng -90 đến 90.';
    if (!form.longitude) return 'Vui lòng nhập kinh độ GPS.';
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return 'Kinh độ phải nằm trong khoảng -180 đến 180.';
    if (!Number.isInteger(radius) || radius < 1 || radius > 10000) return 'Bán kính quét phải là số nguyên từ 1 đến 10.000 mét.';
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

    const payload: MerchantPoiInput = {
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
      if (isEdit && initialPoi) {
        await updateMerchantPoi(initialPoi.id, payload, images);
        showToast('success', 'Đã lưu chỉnh sửa POI và gửi duyệt lại cho ban quản lý!');
      } else {
        await createMerchantPoi(payload, images);
        showToast('success', 'Đã gửi điểm tham quan thành công! Vui lòng chờ phê duyệt.');
      }
      setConfirmOpen(false);
      onSaved();
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Không thể lưu POI. Vui lòng thử lại sau.');
      setConfirmOpen(false);
    } finally {
      submitStarted.current = false;
      setSubmitting(false);
    }
  };

  const inputClass = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all';

  return (
    <>
      <div
        className="fixed inset-0 z-[900] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={() => !submitting && onClose()}
      >
        <div
          className="relative bg-white rounded-2xl shadow-2xl border border-purple-100 w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50/60 to-white flex-shrink-0">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEdit ? 'Chỉnh sửa & Gửi duyệt lại POI gian hàng' : 'Thiết lập POI điểm tham quan của gian hàng'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Mỗi chủ gian hàng sở hữu duy nhất 1 điểm tham quan (POI) trên bản đồ Hội An.
              </p>
            </div>
            <button
              onClick={() => !submitting && onClose()}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              disabled={submitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5">
            {formError && (
              <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {isEdit && initialPoi?.rejectionReason && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-800 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Lý do bị từ chối trước đó:
                </p>
                <p className="pl-5 text-amber-900">{initialPoi.rejectionReason}</p>
              </div>
            )}

            {/* 2.1.1 Tên POI */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Tên điểm tham quan (POI) <span className="text-red-500">*</span>
              </label>
              <input
                required
                maxLength={200}
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                className={inputClass}
                placeholder="Ví dụ: Tiệm Trà Cung Đình Hội An"
                disabled={submitting}
              />
            </div>

            {/* 2.3.2 Nhập mô tả POI */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Nội dung thuyết minh / giới thiệu điểm đến
              </label>
              <textarea
                maxLength={10000}
                rows={4}
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                className={`${inputClass} resize-y leading-relaxed`}
                placeholder="Giới thiệu câu chuyện văn hóa, đặc sản, trải nghiệm đặc sắc tại gian hàng..."
                disabled={submitting}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Nội dung này được hệ thống sử dụng để phát âm thanh thuyết minh tự động khi du khách đến gần.
              </p>
            </div>

            {/* 2.1.2 Chọn vị trí (2 cách: Lấy GPS hiện tại hoặc Nhập thủ công) */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[#7c3aed] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> 2.1.2 Định vị GPS điểm tham quan
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGetCurrentGPS}
                    disabled={gettingGPS || submitting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-100 hover:bg-purple-200 text-[#6b21a8] transition-all shadow-xs border border-purple-200 disabled:opacity-50"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${gettingGPS ? 'animate-spin' : ''}`} />
                    {gettingGPS ? 'Đang lấy GPS…' : 'Lấy GPS hiện tại'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm(curr => ({ ...curr, latitude: '15.880500', longitude: '108.338000' }));
                      showToast('info', 'Đã đặt tọa độ trung tâm Phố Cổ Hội An');
                    }}
                    disabled={submitting}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline"
                  >
                    Mặc định Hội An
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-100/80 text-[11px] text-purple-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>
                  <strong>2 cách chọn vị trí:</strong> Bấm <em>"Lấy GPS hiện tại"</em> khi bạn đang đứng ở gian hàng, hoặc <em>nhập trực tiếp Vĩ độ & Kinh độ</em> thủ công vào các ô dưới.
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600">Vĩ độ (Latitude) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min={-90}
                    max={90}
                    step="0.000001"
                    value={form.latitude}
                    onChange={e => setField('latitude', e.target.value)}
                    className={inputClass}
                    placeholder="15.880500"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">Kinh độ (Longitude) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min={-180}
                    max={180}
                    step="0.000001"
                    value={form.longitude}
                    onChange={e => setField('longitude', e.target.value)}
                    className={inputClass}
                    placeholder="108.338000"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">Bán kính quét kích hoạt (mét) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    step={1}
                    value={form.radius}
                    onChange={e => setField('radius', e.target.value)}
                    className={inputClass}
                    placeholder="30"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">Liên kết chỉ đường (Google Maps)</label>
                  <input
                    maxLength={500}
                    value={form.directionLink}
                    onChange={e => setField('directionLink', e.target.value)}
                    className={inputClass}
                    placeholder="https://maps.app.goo.gl/..."
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* 2.3.1 Tải ảnh lên */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <ImagePlus className="h-4 w-4 text-[#7c3aed]" /> Hình ảnh điểm tham quan (Tối đa 5 ảnh)
                </span>
              </label>

              {isEdit && initialPoi?.images && initialPoi.images.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-slate-500 mb-1.5 font-medium">Ảnh hiện tại:</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {initialPoi.images.map((img, i) => (
                      <img
                        key={i}
                        src={resolveMerchantPoiImage(img)}
                        alt={`Ảnh ${i + 1}`}
                        className="w-16 h-16 rounded-lg object-cover border border-slate-200 shadow-sm"
                      />
                    ))}
                  </div>
                </div>
              )}

              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/bmp"
                multiple
                onChange={e => handleImages(e.target.files)}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-[#7c3aed] hover:file:bg-purple-100 transition-all cursor-pointer"
                disabled={submitting}
              />
              <p className="mt-1 text-[11px] text-slate-400">Định dạng: JPG, PNG, GIF, BMP. Tối đa 10MB mỗi ảnh.</p>
              {images.length > 0 && (
                <div className="mt-2 p-2.5 bg-purple-50/60 rounded-xl border border-purple-100 text-xs text-[#6b21a8]">
                  <p className="font-semibold mb-1">Đã chọn {images.length} tệp ảnh mới:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {images.map(file => (
                      <li key={`${file.name}-${file.lastModified}`}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Mail className="h-3.5 w-3.5 text-[#7c3aed]" />
              Kết quả thẩm định sẽ được gửi qua email.
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={onClose} disabled={submitting}>Hủy</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                icon={<Send className="h-4 w-4" />}
              >
                {submitting ? 'Đang gửi…' : isEdit ? 'Gửi duyệt lại' : 'Gửi duyệt'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void confirmSubmit()}
        title={isEdit ? 'Xác nhận gửi duyệt lại' : 'Xác nhận gửi duyệt POI'}
        message={isEdit
          ? 'Điểm tham quan của bạn sẽ được cập nhật và chuyển sang trạng thái "Chờ duyệt". Bạn có chắc chắn muốn gửi lại?'
          : 'Hồ sơ điểm tham quan sẽ được gửi lên hệ thống và chuyển sang trạng thái "Chờ duyệt" để ban quản lý thẩm định. Bạn muốn tiếp tục?'
        }
        confirmLabel={submitting ? 'Đang gửi…' : isEdit ? 'Gửi duyệt lại' : 'Gửi duyệt'}
        cancelLabel="Kiểm tra lại"
        variant="info"
      />
    </>
  );
}

// ────────────────────────────────────────────────────────────────
// Trang chính: Quản lý POI của mình (Chủ gian hàng chỉ có 1 POI)
// ────────────────────────────────────────────────────────────────
export default function MyPOI() {
  const { setCurrentPage } = useApp();
  const [poi, setPoi] = useState<MerchantPoi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const loadPoi = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await getMerchantPois();
      setPoi(list.length > 0 ? list[0] : null);
    } catch (cause) {
      const message = cause instanceof ApiError ? cause.message : 'Không tải được thông tin POI.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPoi();
  }, [loadPoi]);

  const handleSaved = () => {
    setModalOpen(false);
    void loadPoi();
  };

  const isApproved = poi?.approvalStatus === 'APPROVED';
  const isPending = poi?.approvalStatus === 'PENDING';
  const isRejected = poi?.approvalStatus === 'REJECTED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#7c3aed] uppercase tracking-wider mb-1">
            <Store className="w-4 h-4" />
            <span>Điểm tham quan duy nhất của gian hàng</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Quản lý POI của tôi
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Mỗi chủ gian hàng được gắn với duy nhất 1 điểm thuyết minh (POI) tại Phố Cổ Hội An.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={() => void loadPoi()}
            disabled={loading}
            icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Làm mới
          </Button>
          {!poi && !loading && (
            <Button
              onClick={() => setModalOpen(true)}
              icon={<Plus className="h-4 w-4" />}
            >
              Thiết lập POI
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <Card>
          <div className="px-4 py-16 text-center">
            <div className="inline-block w-8 h-8 border-4 border-purple-200 border-t-[#7c3aed] rounded-full animate-spin mb-2" />
            <p className="text-sm text-slate-500 font-medium">Đang tải thông tin điểm tham quan của gian hàng…</p>
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className="px-4 py-12 text-center">
            <p role="alert" className="mb-3 text-sm text-red-600 font-medium">{error}</p>
            <Button variant="secondary" size="sm" onClick={() => void loadPoi()}>Thử lại</Button>
          </div>
        </Card>
      ) : !poi ? (
        /* Trường hợp 1: Chưa tạo POI nào -> Hướng dẫn tạo POI duy nhất (2.1) */
        <Card>
          <div className="px-6 py-16 text-center max-w-lg mx-auto">
            <h2 className="text-lg font-bold text-slate-900">
              Gian hàng của bạn chưa thiết lập điểm tham quan (POI)
            </h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Hãy nhập thông tin điểm đến, vị trí định vị GPS và bán kính quét. Sau khi ban quản lý thẩm định, du khách khi ghé thăm gian hàng sẽ tự động nghe bài thuyết minh audio đa ngôn ngữ.
            </p>
            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => setModalOpen(true)}
                icon={<Plus className="h-4 w-4" />}
              >
                Gửi hồ sơ POI ngay
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        /* Trường hợp 2: Đã có POI duy nhất -> Hiển thị trung tâm quản lý POI này */
        <div className="space-y-6">
          {/* Status Alert Banner */}
          {isRejected && (
            <div className="rounded-2xl border border-red-200 bg-red-50/90 p-4 text-red-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-red-700">Hồ sơ POI bị từ chối kiểm duyệt</p>
                  <p className="text-xs text-red-900 mt-0.5">
                    <strong>Lý do từ ban quản lý:</strong> {poi.rejectionReason || 'Vui lòng kiểm tra lại tính chính xác của tọa độ GPS hoặc bổ sung mô tả.'}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setModalOpen(true)}
                icon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Chỉnh sửa & Gửi duyệt lại
              </Button>
            </div>
          )}

          {isPending && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-800 shadow-sm flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-amber-900 text-sm">Hồ sơ POI đang trong quá trình xét duyệt</p>
                <p className="text-amber-800 mt-0.5">
                  Ban quản lý đang thẩm định tính hợp lệ của điểm tham quan. Bạn sẽ nhận được thông báo qua email khi có kết quả.
                </p>
              </div>
            </div>
          )}

          {isApproved && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-800 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-emerald-900 text-sm">POI đang hoạt động công khai</p>
                  <p className="text-emerald-800 mt-0.5">
                    Hệ thống đã kích hoạt Geofencing và sẵn sàng phát thuyết minh tự động khi du khách đến gần.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCurrentPage('dashboard')}
                icon={<Headphones className="w-3.5 h-3.5 text-[#7c3aed]" />}
              >
                Xem lượt nghe
              </Button>
            </div>
          )}

          {/* Main POI Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Details & Media */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-extrabold text-slate-900">{poi.name}</h2>
                    <Badge
                      variant={
                        isApproved ? 'active' : isPending ? 'partial' : 'skipped'
                      }
                    >
                      {approvalLabels[poi.approvalStatus] ?? poi.approvalStatus}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setModalOpen(true)}
                      icon={<Edit3 className="w-3.5 h-3.5" />}
                    >
                      Chỉnh sửa POI
                    </Button>
                  </div>
                </div>

                {/* Photo Gallery (2.3.1) */}
                <div className="mt-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Hình ảnh điểm tham quan ({poi.images.length}/5)
                  </p>
                  {poi.images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {poi.images.map((img, i) => (
                        <div key={i} className="relative group overflow-hidden rounded-xl border border-slate-200 shadow-sm aspect-video">
                          <img
                            src={resolveMerchantPoiImage(img)}
                            alt={`${poi.name} - ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-32 rounded-xl bg-purple-50/50 border border-purple-100 flex flex-col items-center justify-center text-[#a855f7]">
                      <ImagePlus className="w-8 h-8 mb-1 opacity-60" />
                      <span className="text-xs text-slate-400">Chưa tải ảnh lên cho điểm tham quan</span>
                    </div>
                  )}
                </div>

                {/* Description Content (2.3.2) */}
                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Nội dung thuyết minh / Giới thiệu điểm đến
                  </p>
                  <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {poi.originalDescription || 'Chưa cập nhật nội dung thuyết minh cho điểm đến.'}
                  </div>
                </div>
              </Card>
            </div>

            {/* Right 1 Col: GPS Coordinates & Specifications (2.1.2) */}
            <div className="space-y-6">
              <Card>
                <div className="flex items-center gap-2 text-xs font-bold text-[#7c3aed] uppercase tracking-wider pb-3 border-b border-slate-100">
                  <MapPin className="w-4 h-4" />
                  <span>Thông số kỹ thuật & Vị trí</span>
                </div>

                <div className="mt-4 space-y-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Tọa độ GPS (Vĩ độ / Kinh độ):</span>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">
                      {poi.latitude.toFixed(6)}, {poi.longitude.toFixed(6)}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Bán kính quét kích hoạt (Geofence):</span>
                    <p className="text-sm font-bold text-[#7c3aed] mt-0.5">
                      {poi.radius} mét
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Khi du khách đi vào vòng tròn bán kính {poi.radius}m, audio sẽ phát tự động.
                    </p>
                  </div>

                  {poi.directionLink && (
                    <div>
                      <span className="text-slate-400 block font-medium">Bản đồ chỉ đường:</span>
                      <a
                        href={poi.directionLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-bold text-[#7c3aed] hover:underline mt-0.5"
                      >
                        Mở Google Maps <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-slate-400 block font-medium">Mã nhận diện POI:</span>
                    <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">#{poi.id}</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                  <Button
                    className="w-full"
                    onClick={() => setModalOpen(true)}
                    icon={<Edit3 className="w-3.5 h-3.5" />}
                  >
                    Chỉnh sửa thông tin
                  </Button>
                </div>
              </Card>

              {/* Policy note */}
              <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/60 text-xs text-slate-600 space-y-1.5">
                <p className="font-bold text-[#7c3aed] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Quy tắc gian hàng
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Mỗi tài khoản chủ gian hàng quản lý duy nhất 1 POI tương ứng với vị trí kinh doanh thực tế tại phố cổ.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa / Tạo POI */}
      {modalOpen && (
        <PoiModal
          initialPoi={poi}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
