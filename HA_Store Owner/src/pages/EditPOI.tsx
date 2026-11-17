import { useCallback, useEffect, useState, useRef } from 'react';
import {
  MapPin, Send, ImagePlus, ArrowLeft, RefreshCw, AlertCircle,
  Clock, Eye, Store, Sparkles, Navigation
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useApp } from '@/hooks/useApp';
import { useToast } from '@/components/toast/ToastProvider';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import {
  getMerchantPois,
  updateMerchantPoi,
  resolveMerchantPoiImage,
  type MerchantPoi,
  type MerchantPoiInput,
} from '@/services/poiApi';
import { ApiError } from '@/services/authApi';

const approvalLabels: Record<string, string> = {
  APPROVED: 'Đã duyệt',
  PENDING: 'Chờ duyệt',
  REJECTED: 'Từ chối',
};

export default function EditPOI() {
  const { showToast } = useToast();
  const { setCurrentPage } = useApp();
  const [poi, setPoi] = useState<MerchantPoi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form edit fields (2.2.1 Sửa thông tin, 2.3.2 Nhập mô tả)
  const [form, setForm] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    radius: '30',
    directionLink: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [gettingGPS, setGettingGPS] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const submitStarted = useRef(false);

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
        let msg = 'Không thể lấy vị trí GPS hiện tại.';
        if (err.code === 1) msg = 'Bạn đã từ chối quyền truy cập vị trí trên trình duyệt. Vui lòng cấp quyền hoặc nhập thủ công.';
        else if (err.code === 2) msg = 'Không tìm thấy tín hiệu vị trí GPS.';
        else if (err.code === 3) msg = 'Quá thời gian xác định vị trí GPS. Vui lòng thử lại hoặc nhập thủ công.';
        setFormError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const loadPoi = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMerchantPois();
      if (data.length > 0) {
        const item = data[0];
        setPoi(item);
        setForm({
          name: item.name || '',
          description: item.originalDescription || '',
          latitude: String(item.latitude ?? '15.8805'),
          longitude: String(item.longitude ?? '108.3380'),
          radius: String(item.radius ?? '30'),
          directionLink: item.directionLink || '',
        });
      } else {
        setPoi(null);
      }
    } catch (cause) {
      const message = cause instanceof ApiError ? cause.message : 'Không thể tải thông tin POI.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPoi();
  }, [loadPoi]);

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
    if (!form.name.trim()) return 'Vui lòng nhập tên điểm tham quan.';
    if (!form.latitude) return 'Vui lòng nhập vĩ độ GPS.';
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return 'Vĩ độ phải từ -90 đến 90.';
    if (!form.longitude) return 'Vui lòng nhập kinh độ GPS.';
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return 'Kinh độ phải từ -180 đến 180.';
    if (!Number.isInteger(radius) || radius < 1 || radius > 10000) return 'Bán kính phải từ 1 đến 10.000 mét.';
    return '';
  };

  const handlePromptSubmit = () => {
    const err = validate();
    setFormError(err);
    if (!err) setConfirmOpen(true);
  };

  const confirmResubmit = async () => {
    if (!poi || submitStarted.current) return;
    submitStarted.current = true;
    setSaving(true);
    setFormError('');

    const payload: MerchantPoiInput = {
      name: form.name.trim(),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      radius: Number(form.radius),
      priorityLevel: poi.priorityLevel || 0,
      originalDescription: form.description.trim(),
      directionLink: form.directionLink.trim(),
      status: 'ACTIVE',
    };

    try {
      await updateMerchantPoi(poi.id, payload, images);
      setConfirmOpen(false);
      showToast('success', 'Đã lưu chỉnh sửa và gửi duyệt lại cho ban quản lý!');
      void loadPoi();
      setCurrentPage('my-poi');
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Không gửi được POI. Vui lòng thử lại.');
      setConfirmOpen(false);
    } finally {
      submitStarted.current = false;
      setSaving(false);
    }
  };

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#7c3aed] uppercase tracking-wider mb-1">
            <Store className="w-4 h-4" />
            <span>2.2 Chỉnh sửa POI & 2.2.2 Gửi duyệt lại</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Chỉnh sửa điểm tham quan (POI)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cập nhật nội dung giới thiệu, hình ảnh, tọa độ và gửi lại để ban quản lý xem xét phê duyệt.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setCurrentPage('my-poi')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Quay lại POI
          </Button>
          <Button
            variant="secondary"
            onClick={() => void loadPoi()}
            disabled={loading}
            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <div className="px-4 py-16 text-center">
            <div className="inline-block w-8 h-8 border-4 border-purple-200 border-t-[#7c3aed] rounded-full animate-spin mb-2" />
            <p className="text-sm text-slate-500">Đang tải thông tin điểm tham quan…</p>
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-red-600 mb-2 font-medium">{error}</p>
            <Button size="sm" variant="secondary" onClick={() => void loadPoi()}>Thử lại</Button>
          </div>
        </Card>
      ) : !poi ? (
        <Card>
          <div className="px-6 py-16 text-center max-w-md mx-auto">
            <MapPin className="w-12 h-12 text-purple-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Gian hàng chưa thiết lập điểm tham quan</h3>
            <p className="text-xs text-slate-400 mt-1">
              Bạn cần tạo điểm tham quan (POI) trước khi thực hiện chỉnh sửa.
            </p>
            <Button className="mt-4" onClick={() => setCurrentPage('my-poi')}>
              Thiết lập POI ngay
            </Button>
          </div>
        </Card>
      ) : (
        /* Edit Form for the 1 POI */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Edit Form (2.2.1 Sửa thông tin, 2.3.2 Nhập mô tả) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Cập nhật thông tin điểm đến
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Mã POI: #{poi.id} · Trạng thái hiện tại:{' '}
                    <span className="font-semibold text-[#7c3aed]">
                      {approvalLabels[poi.approvalStatus] ?? poi.approvalStatus}
                    </span>
                  </p>
                </div>
                <Badge
                  variant={
                    poi.approvalStatus === 'APPROVED'
                      ? 'active'
                      : poi.approvalStatus === 'PENDING'
                      ? 'partial'
                      : 'skipped'
                  }
                >
                  {approvalLabels[poi.approvalStatus] ?? poi.approvalStatus}
                </Badge>
              </div>

              {formError && (
                <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {poi.rejectionReason && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-800 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    Lý do ban quản lý từ chối trước đó:
                  </p>
                  <p className="pl-5 text-red-900 font-medium">{poi.rejectionReason}</p>
                </div>
              )}

              <div className="mt-5 space-y-4">
                {/* 2.2.1 Sửa tên */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Tên điểm tham quan (POI) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className={inputCls}
                    placeholder="Tên điểm đến..."
                  />
                </div>

                {/* 2.3.2 Nhập mô tả POI */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Nội dung thuyết minh / Giới thiệu chi tiết
                  </label>
                  <textarea
                    rows={5}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className={`${inputCls} resize-y leading-relaxed`}
                    placeholder="Mô tả trải nghiệm, câu chuyện lịch sử, văn hóa hoặc điểm đặc sắc..."
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Hệ thống sẽ chuyển ngữ và phát thuyết minh audio tự động khi du khách đến gần gian hàng.
                  </p>
                </div>

                {/* 2.1.2 / 2.2.1 Sửa tọa độ GPS & Bán kính (2 cách nhập) */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#7c3aed] flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> Tọa độ GPS & Bán kính kích hoạt
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleGetCurrentGPS}
                        disabled={gettingGPS || saving}
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
                        disabled={saving}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline"
                      >
                        Mặc định Hội An
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-100/80 text-[11px] text-purple-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span>
                      <strong>2 cách định vị:</strong> Bấm <em>"Lấy GPS hiện tại"</em> để tự động bắt tọa độ nơi bạn đang đứng, hoặc <em>nhập trực tiếp Vĩ độ & Kinh độ</em> vào các ô bên dưới.
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Vĩ độ (Latitude) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        step="0.000001"
                        value={form.latitude}
                        onChange={e => setForm({ ...form, latitude: e.target.value })}
                        className={inputCls}
                        placeholder="15.880500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Kinh độ (Longitude) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        step="0.000001"
                        value={form.longitude}
                        onChange={e => setForm({ ...form, longitude: e.target.value })}
                        className={inputCls}
                        placeholder="108.338000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Bán kính quét (mét) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        min={1}
                        max={10000}
                        value={form.radius}
                        onChange={e => setForm({ ...form, radius: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Liên kết bản đồ chỉ đường</label>
                      <input
                        type="text"
                        value={form.directionLink}
                        onChange={e => setForm({ ...form, directionLink: e.target.value })}
                        className={inputCls}
                        placeholder="https://maps.google.com/..."
                      />
                    </div>
                  </div>
                </div>

                {/* 2.3.1 Tải ảnh lên */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    <span className="inline-flex items-center gap-1.5">
                      <ImagePlus className="h-4 w-4 text-[#7c3aed]" /> Cập nhật hình ảnh (Tải thêm tối đa 5 ảnh)
                    </span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => handleImages(e.target.files)}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-[#7c3aed] hover:file:bg-purple-100 transition-all cursor-pointer"
                  />
                  {images.length > 0 && (
                    <p className="mt-2 text-xs font-semibold text-[#7c3aed]">
                      Đã chọn {images.length} ảnh mới để tải lên cùng bản cập nhật.
                    </p>
                  )}
                </div>
              </div>

              {/* 2.2.2 Gửi duyệt lại */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage('my-poi')}
                  disabled={saving}
                >
                  Hủy bỏ
                </Button>
                <Button
                  onClick={handlePromptSubmit}
                  disabled={saving}
                  icon={<Send className="w-4 h-4" />}
                >
                  {saving ? 'Đang gửi…' : 'Lưu & Gửi duyệt lại'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Preview Card */}
          <div className="space-y-4">
            <Card>
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#7c3aed]" /> Xem trước hiển thị
              </h4>

              <div className="space-y-3">
                {poi.images && poi.images.length > 0 ? (
                  <div>
                    <img
                      src={resolveMerchantPoiImage(poi.images[0])}
                      alt={form.name}
                      className="w-full h-40 object-cover rounded-xl border border-slate-200"
                    />
                    <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                      {poi.images.map((img, i) => (
                        <img
                          key={i}
                          src={resolveMerchantPoiImage(img)}
                          alt=""
                          className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-40 bg-purple-50 rounded-xl flex items-center justify-center text-purple-400">
                    <ImagePlus className="w-8 h-8" />
                  </div>
                )}

                <div>
                  <h5 className="font-bold text-slate-900 text-sm">
                    {form.name || 'Tên điểm tham quan'}
                  </h5>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-4 leading-relaxed">
                    {form.description || 'Chưa có nội dung mô tả...'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#7c3aed]" />
                    Tọa độ: {form.latitude || '0'}, {form.longitude || '0'}
                  </p>
                  <p>Bán kính quét: {form.radius} mét</p>
                </div>
              </div>
            </Card>

            <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/50 text-xs text-slate-600 space-y-2">
              <p className="font-bold text-[#7c3aed] flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Quy trình xét duyệt
              </p>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Sau khi gửi duyệt lại, POI duy nhất của gian hàng sẽ chuyển sang trạng thái <strong>Chờ duyệt</strong>. Ban quản lý sẽ thẩm định và phản hồi qua email của bạn trong 24 giờ làm việc.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Resubmit Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void confirmResubmit()}
        title="Gửi duyệt lại POI"
        message="Các thông tin chỉnh sửa sẽ được lưu và chuyển trạng thái sang Chờ duyệt. Bạn có muốn tiếp tục gửi duyệt lại không?"
        confirmLabel={saving ? 'Đang gửi…' : 'Gửi duyệt lại'}
        cancelLabel="Kiểm tra lại"
        variant="info"
      />
    </div>
  );
}
