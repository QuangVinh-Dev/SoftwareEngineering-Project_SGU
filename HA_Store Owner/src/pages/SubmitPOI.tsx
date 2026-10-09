import { useState } from 'react';
import { MapPin, Send, Image, Phone, Clock, Save } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useApp } from '@/hooks/useApp';
import { useToast } from '@/components/toast/ToastProvider';
import { poiCategories } from '@/data/mockData';
import ConfirmDialog from '@/components/modals/ConfirmDialog';

export default function SubmitPOI() {
  const { showToast } = useToast();
  const { setCurrentPage } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    nameEn: '',
    category: '',
    description: '',
    intro: '',
    address: '',
    lat: '',
    lng: '',
    radius: '50',
    image: '',
    phone: '',
    hours: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Vui lòng nhập tên POI';
    if (!form.category) e.category = 'Vui lòng chọn danh mục';
    if (!form.description.trim()) e.description = 'Vui lòng nhập mô tả';
    if (!form.address.trim()) e.address = 'Vui lòng nhập địa chỉ';
    if (!form.lat.trim()) e.lat = 'Vui lòng nhập vĩ độ';
    if (!form.lng.trim()) e.lng = 'Vui lòng nhập kinh độ';
    if (form.lat && isNaN(Number(form.lat))) e.lat = 'Vĩ độ không hợp lệ';
    if (form.lng && isNaN(Number(form.lng))) e.lng = 'Kinh độ không hợp lệ';
    if (form.phone && !/^[+0-9\s-]+$/.test(form.phone)) e.phone = 'Số điện thoại không hợp lệ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      showToast('error', 'Vui lòng kiểm tra lại thông tin POI.');
      return;
    }
    setConfirmOpen(true);
  };

  const confirmSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setConfirmOpen(false);
      showToast('success', 'POI đã được gửi duyệt thành công. Vui lòng chờ xét duyệt.');
      setForm({ name: '', nameEn: '', category: '', description: '', intro: '', address: '', lat: '', lng: '', radius: '50', image: '', phone: '', hours: '' });
      setCurrentPage('my-poi');
    }, 1200);
  };

  const set = (k: string, v: string) => { setForm({ ...form, [k]: v }); if (errors[k]) setErrors({ ...errors, [k]: '' }); };

  const inputCls = 'w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all';
  const errBorder = 'border-red-300 focus:border-red-400 focus:ring-red-100';
  const okBorder = 'border-brown-200';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brown-900">Gửi POI mới</h1>
        <p className="text-sm text-brown-400 mt-1">Điền thông tin điểm tham quan và gửi để quản trị viên xét duyệt.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-base font-semibold text-brown-900 mb-4">Thông tin POI</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brown-700 mb-1">Tên POI (Tiếng Việt) <span className="text-red-500">*</span></label>
                  <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                    className={`${inputCls} ${errors.name ? errBorder : okBorder}`}
                    placeholder="VD: Chùa Cầu" />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-brown-700 mb-1">Tên POI (Tiếng Anh)</label>
                  <input type="text" value={form.nameEn} onChange={e => set('nameEn', e.target.value)}
                    className={`${inputCls} ${okBorder}`}
                    placeholder="VD: Japanese Covered Bridge" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">Danh mục <span className="text-red-500">*</span></label>
                <select value={form.category} onChange={e => set('category', e.target.value)}
                  className={`${inputCls} ${errors.category ? errBorder : okBorder} bg-white`}>
                  <option value="">Chọn danh mục</option>
                  {poiCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">Mô tả <span className="text-red-500">*</span></label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                  className={`${inputCls} ${errors.description ? errBorder : okBorder} resize-none`}
                  placeholder="Mô tả ngắn gọn về điểm tham quan" />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">Thông tin giới thiệu</label>
                <textarea value={form.intro} onChange={e => set('intro', e.target.value)} rows={4}
                  className={`${inputCls} ${okBorder} resize-none`}
                  placeholder="Thông tin chi tiết, lịch sử, điểm nổi bật..." />
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-base font-semibold text-brown-900 mb-4">Vị trí</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">Địa chỉ <span className="text-red-500">*</span></label>
                <input type="text" value={form.address} onChange={e => set('address', e.target.value)}
                  className={`${inputCls} ${errors.address ? errBorder : okBorder}`}
                  placeholder="VD: Nguyễn Thị Minh Khai, Cẩm Châu, Hội An" />
                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brown-700 mb-1">Vĩ độ <span className="text-red-500">*</span></label>
                  <input type="text" value={form.lat} onChange={e => set('lat', e.target.value)}
                    className={`${inputCls} ${errors.lat ? errBorder : okBorder}`}
                    placeholder="15.8805" />
                  {errors.lat && <p className="text-xs text-red-500 mt-1">{errors.lat}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-brown-700 mb-1">Kinh độ <span className="text-red-500">*</span></label>
                  <input type="text" value={form.lng} onChange={e => set('lng', e.target.value)}
                    className={`${inputCls} ${errors.lng ? errBorder : okBorder}`}
                    placeholder="108.3380" />
                  {errors.lng && <p className="text-xs text-red-500 mt-1">{errors.lng}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-brown-700 mb-1">Bán kính (m)</label>
                  <input type="number" value={form.radius} onChange={e => set('radius', e.target.value)}
                    className={`${inputCls} ${okBorder}`} placeholder="50" />
                </div>
              </div>

              <div className="relative h-48 rounded-lg border border-brown-200 bg-brown-50 flex items-center justify-center overflow-hidden">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                  <p className="text-sm text-brown-400">Bản đồ vị trí POI</p>
                  <p className="text-xs text-brown-300 mt-1">Nhập tọa độ để hiển thị vị trí trên bản đồ</p>
                </div>
                {form.lat && form.lng && !errors.lat && !errors.lng && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <MapPin className="w-8 h-8 text-primary-600 fill-primary-100" />
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-base font-semibold text-brown-900 mb-4">Thông tin bổ sung</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">URL hình ảnh</label>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
                  <input type="text" value={form.image} onChange={e => set('image', e.target.value)}
                    className={`${inputCls} ${okBorder} pl-10`}
                    placeholder="https://..." />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brown-700 mb-1">Thông tin liên hệ</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
                    <input type="text" value={form.phone} onChange={e => set('phone', e.target.value)}
                      className={`${inputCls} ${errors.phone ? errBorder : okBorder} pl-10`}
                      placeholder="Số điện thoại" />
                  </div>
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-brown-700 mb-1">Thời gian hoạt động</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
                    <input type="text" value={form.hours} onChange={e => set('hours', e.target.value)}
                      className={`${inputCls} ${okBorder} pl-10`}
                      placeholder="VD: 8:00 - 17:00" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="text-base font-semibold text-brown-900 mb-3">Gửi duyệt</h3>
            <p className="text-sm text-brown-500 mb-4">Sau khi gửi, POI sẽ chuyển sang trạng thái "Chờ duyệt". Quản trị viên sẽ xem xét và phê duyệt trong vòng 1-3 ngày làm việc.</p>
            <Button onClick={handleSubmit} className="w-full justify-center" icon={<Send className="w-4 h-4" />}>Gửi duyệt</Button>
            <Button variant="ghost" onClick={() => { setForm({ name: '', nameEn: '', category: '', description: '', intro: '', address: '', lat: '', lng: '', radius: '50', image: '', phone: '', hours: '' }); setErrors({}); showToast('info', 'Đã đặt lại form.'); }}
              className="w-full justify-center mt-2">Đặt lại form</Button>
          </Card>

          <Card>
            <h3 className="text-base font-semibold text-brown-900 mb-3">Lưu ý</h3>
            <ul className="space-y-2 text-sm text-brown-500">
              <li className="flex gap-2"><span className="text-primary-500 mt-0.5">•</span> Tên POI không được trùng lặp.</li>
              <li className="flex gap-2"><span className="text-primary-500 mt-0.5">•</span> Tọa độ GPS phải chính xác.</li>
              <li className="flex gap-2"><span className="text-primary-500 mt-0.5">•</span> Mô tả nên ngắn gọn, súc tích.</li>
              <li className="flex gap-2"><span className="text-primary-500 mt-0.5">•</span> POI bị từ chối có thể gửi lại sau khi chỉnh sửa.</li>
            </ul>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmSubmit}
        title="Gửi duyệt POI"
        message="Bạn có chắc chắn muốn gửi POI này để xét duyệt không?"
        confirmLabel={submitting ? 'Đang gửi...' : 'Gửi duyệt'}
        cancelLabel="Hủy"
        variant="info"
      />
    </div>
  );
}
