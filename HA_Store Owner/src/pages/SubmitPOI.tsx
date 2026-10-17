import { useState } from 'react';
import { ImagePlus, MapPin, Send } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useApp } from '@/hooks/useApp';
import { useToast } from '@/components/toast/ToastProvider';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { ApiError } from '@/services/authApi';
import { createMerchantPoi, type MerchantPoiInput } from '@/services/poiApi';

const emptyForm = { name: '', description: '', latitude: '', longitude: '', radius: '30', directionLink: '' };

export default function SubmitPOI() {
  const { showToast } = useToast();
  const { setCurrentPage } = useApp();
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState<File[]>([]);
  const [formError, setFormError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const setField = (field: keyof typeof emptyForm, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
    setFormError('');
  };

  const handleImages = (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (selected.length > 5) {
      setFormError('Mỗi POI được tải tối đa 5 hình ảnh.');
      return;
    }
    if (selected.some(file => file.size > 10 * 1024 * 1024)) {
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
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return 'Vĩ độ phải nằm trong khoảng -90 đến 90.';
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
      setForm(emptyForm);
      setImages([]);
      showToast('success', 'POI đã được gửi và đang chờ quản trị viên duyệt.');
      setCurrentPage('my-poi');
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Không gửi được POI. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'mt-1 w-full rounded-lg border border-brown-200 px-3 py-2 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brown-900">Gửi POI mới</h1>
        <p className="mt-1 text-sm text-brown-400">POI và hình ảnh sẽ chờ quản trị viên duyệt trước khi hiển thị cho người dùng.</p>
      </div>

      <Card className="max-w-3xl space-y-5">
        {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
        <label className="block text-sm font-medium text-brown-700">Tên POI *
          <input required maxLength={200} value={form.name} onChange={event => setField('name', event.target.value)} className={inputClass} placeholder="Ví dụ: Chùa Cầu" />
        </label>
        <label className="block text-sm font-medium text-brown-700">Nội dung giới thiệu
          <textarea maxLength={10000} rows={4} value={form.description} onChange={event => setField('description', event.target.value)} className={`${inputClass} resize-y`} placeholder="Mô tả điểm đến để hiển thị cho người dùng" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-brown-700">Vĩ độ *<input type="number" min={-90} max={90} step="0.000001" value={form.latitude} onChange={event => setField('latitude', event.target.value)} className={inputClass} /></label>
          <label className="block text-sm font-medium text-brown-700">Kinh độ *<input type="number" min={-180} max={180} step="0.000001" value={form.longitude} onChange={event => setField('longitude', event.target.value)} className={inputClass} /></label>
          <label className="block text-sm font-medium text-brown-700">Bán kính (m) *<input type="number" min={1} max={10000} step={1} value={form.radius} onChange={event => setField('radius', event.target.value)} className={inputClass} /></label>
          <label className="block text-sm font-medium text-brown-700">Liên kết chỉ đường
            <input maxLength={500} value={form.directionLink} onChange={event => setField('directionLink', event.target.value)} className={inputClass} placeholder="https://maps.google.com/..." />
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-brown-700"><span className="inline-flex items-center gap-2"><ImagePlus className="h-4 w-4" /> Hình ảnh (tối đa 5)</span>
            <input type="file" accept="image/jpeg,image/png,image/gif,image/bmp" multiple onChange={event => handleImages(event.target.files)} className="mt-2 block w-full text-sm" />
          </label>
          <p className="mt-1 text-xs text-brown-400">Chấp nhận JPG, PNG, GIF hoặc BMP; tối đa 10 MB mỗi file.</p>
          {images.length > 0 && <ul className="mt-2 list-inside list-disc text-xs text-brown-600">{images.map(file => <li key={`${file.name}-${file.lastModified}`}>{file.name}</li>)}</ul>}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={submitting} icon={<Send className="h-4 w-4" />}>{submitting ? 'Đang gửi…' : 'Gửi duyệt'}</Button>
        </div>
      </Card>

      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={() => void confirmSubmit()}
        title="Gửi duyệt POI" message="POI sẽ chưa xuất hiện công khai cho tới khi quản trị viên duyệt. Bạn muốn gửi POI này không?"
        confirmLabel={submitting ? 'Đang gửi…' : 'Gửi duyệt'} cancelLabel="Hủy" variant="info" />
      <div className="flex items-center gap-2 text-xs text-brown-400"><MapPin className="h-4 w-4" /> POI phải có tọa độ hợp lệ để hiển thị trên bản đồ.</div>
    </div>
  );
}
