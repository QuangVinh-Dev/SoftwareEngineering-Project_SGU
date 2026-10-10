import { useState } from 'react';
import { MapPin, Save, Send, Image, Phone, Clock } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useApp } from '@/hooks/useApp';
import { useToast } from '@/components/toast/ToastProvider';
import { myPois, poiCategories } from '@/data/mockData';
import type { StallOwnerPOI } from '@/types';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { formatNumber } from '@/utils/helpers';

const statusLabels: Record<string, string> = {
  approved: 'Đã duyệt',
  pending: 'Chờ duyệt',
  rejected: 'Từ chối',
};

export default function EditPOI() {
  const { showToast } = useToast();
  const { setCurrentPage } = useApp();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showResubmit, setShowResubmit] = useState(false);
  const [saving, setSaving] = useState(false);

  const editablePois = myPois.filter(p => p.approvalStatus === 'approved' || p.approvalStatus === 'rejected');
  const selectedPoi = editablePois.find(p => p.id === selectedId) || null;

  const [form, setForm] = useState({
    name: '', nameEn: '', category: '', description: '', intro: '', address: '', lat: '', lng: '', radius: '', image: '', phone: '', hours: '',
  });

  const selectPoi = (poi: StallOwnerPOI) => {
    setSelectedId(poi.id);
    setForm({
      name: poi.name, nameEn: poi.nameEn, category: poi.category, description: poi.description, intro: poi.description,
      address: poi.address, lat: String(poi.lat), lng: String(poi.lng), radius: String(poi.radius),
      image: poi.image, phone: '', hours: '',
    });
  };

  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  const handleSave = () => {
    if (!form.name.trim() || !form.category || !form.address.trim()) {
      showToast('error', 'Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('success', 'Cập nhật POI thành công.');
    }, 800);
  };

  const handleResubmit = () => {
    setShowResubmit(true);
  };

  const doResubmit = () => {
    setShowResubmit(false);
    showToast('success', 'POI đã được gửi duyệt lại. Vui lòng chờ xét duyệt.');
    setCurrentPage('my-poi');
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brown-900">Chỉnh sửa POI</h1>
        <p className="text-sm text-brown-400 mt-1">Chỉnh sửa thông tin các điểm tham quan đã được duyệt hoặc bị từ chối.</p>
      </div>

      {!selectedPoi && (
        <Card noPadding>
          <div className="p-4 border-b border-brown-100">
            <h3 className="text-base font-semibold text-brown-900">Chọn POI để chỉnh sửa</h3>
            <p className="text-xs text-brown-400 mt-0.5">Chỉ hiển thị POI đã duyệt hoặc bị từ chối</p>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-brown-100 bg-brown-50/50">
                  <th className="px-4 py-3 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">Tên POI</th>
                  <th className="px-4 py-3 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">Danh mục</th>
                  <th className="px-4 py-3 text-right font-medium text-brown-500 text-xs uppercase tracking-wider">Lượt nghe</th>
                  <th className="px-4 py-3 text-center font-medium text-brown-500 text-xs uppercase tracking-wider">Trạng thái</th>
                  <th className="px-4 py-3 text-center font-medium text-brown-500 text-xs uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {editablePois.map(poi => (
                  <tr key={poi.id} className="border-b border-brown-50 hover:bg-brown-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-brown-800">{poi.name}</p>
                      <p className="text-xs text-brown-400">{poi.nameEn}</p>
                    </td>
                    <td className="px-4 py-3 text-brown-600">{poi.category}</td>
                    <td className="px-4 py-3 text-right text-brown-700">{formatNumber(poi.listeningSessions)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={poi.approvalStatus === 'approved' ? 'approved' : 'rejected'}>
                        {statusLabels[poi.approvalStatus]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button size="sm" variant="secondary" onClick={() => selectPoi(poi)}>Chỉnh sửa</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {editablePois.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-brown-400">Không có POI nào có thể chỉnh sửa.</div>
          )}
        </Card>
      )}

      {selectedPoi && (
        <>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>← Quay lại danh sách</Button>
            <div className="flex items-center gap-2">
              <Badge variant={selectedPoi.approvalStatus === 'approved' ? 'approved' : 'rejected'}>
                {statusLabels[selectedPoi.approvalStatus]}
              </Badge>
            </div>
          </div>

          {selectedPoi.approvalStatus === 'rejected' && selectedPoi.rejectionReason && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-700 mb-1">Lý do từ chối:</p>
              <p className="text-sm text-red-600">{selectedPoi.rejectionReason}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <h3 className="text-base font-semibold text-brown-900 mb-4">Thông tin POI</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-brown-700 mb-1">Tên POI (Tiếng Việt) <span className="text-red-500">*</span></label>
                      <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brown-700 mb-1">Tên POI (Tiếng Anh)</label>
                      <input type="text" value={form.nameEn} onChange={e => set('nameEn', e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brown-700 mb-1">Danh mục <span className="text-red-500">*</span></label>
                    <select value={form.category} onChange={e => set('category', e.target.value)} className={`${inputCls} bg-white`}>
                      <option value="">Chọn danh mục</option>
                      {poiCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brown-700 mb-1">Mô tả <span className="text-red-500">*</span></label>
                    <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className={`${inputCls} resize-none`} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brown-700 mb-1">Thông tin giới thiệu</label>
                    <textarea value={form.intro} onChange={e => set('intro', e.target.value)} rows={4} className={`${inputCls} resize-none`} />
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-base font-semibold text-brown-900 mb-4">Vị trí</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-brown-700 mb-1">Địa chỉ <span className="text-red-500">*</span></label>
                    <input type="text" value={form.address} onChange={e => set('address', e.target.value)} className={inputCls} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-brown-700 mb-1">Vĩ độ <span className="text-red-500">*</span></label>
                      <input type="text" value={form.lat} onChange={e => set('lat', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brown-700 mb-1">Kinh độ <span className="text-red-500">*</span></label>
                      <input type="text" value={form.lng} onChange={e => set('lng', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brown-700 mb-1">Bán kính (m)</label>
                      <input type="number" value={form.radius} onChange={e => set('radius', e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div className="relative h-40 rounded-lg border border-brown-200 bg-brown-50 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-7 h-7 text-primary-400 mx-auto mb-1" />
                      <p className="text-xs text-brown-400">Vị trí POI trên bản đồ</p>
                    </div>
                    {form.lat && form.lng && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <MapPin className="w-7 h-7 text-primary-600 fill-primary-100" />
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
                      <input type="text" value={form.image} onChange={e => set('image', e.target.value)} className={`${inputCls} pl-10`} placeholder="https://..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-brown-700 mb-1">Thông tin liên hệ</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
                        <input type="text" value={form.phone} onChange={e => set('phone', e.target.value)} className={`${inputCls} pl-10`} placeholder="Số điện thoại" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brown-700 mb-1">Thời gian hoạt động</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
                        <input type="text" value={form.hours} onChange={e => set('hours', e.target.value)} className={`${inputCls} pl-10`} placeholder="8:00 - 17:00" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <h3 className="text-base font-semibold text-brown-900 mb-3">Lưu thay đổi</h3>
                <p className="text-sm text-brown-500 mb-4">Lưu các thay đổi thông tin POI. Nếu POI bị từ chối, bạn có thể gửi duyệt lại sau khi chỉnh sửa.</p>
                <Button onClick={handleSave} className="w-full justify-center" icon={<Save className="w-4 h-4" />}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
                {selectedPoi.approvalStatus === 'rejected' && (
                  <Button variant="primary" onClick={handleResubmit} className="w-full justify-center mt-2" icon={<Send className="w-4 h-4" />}>Gửi duyệt lại</Button>
                )}
              </Card>

              <Card>
                <h3 className="text-base font-semibold text-brown-900 mb-3">Thống kê POI</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-brown-500">Tổng lượt nghe</span>
                    <span className="font-medium text-brown-800">{formatNumber(selectedPoi.listeningSessions)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brown-500">Thời gian nghe TB</span>
                    <span className="font-medium text-brown-800 font-mono">{selectedPoi.avgTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brown-500">Ngày gửi</span>
                    <span className="font-medium text-brown-800">{selectedPoi.submittedAt}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brown-500">Ngày duyệt</span>
                    <span className="font-medium text-brown-800">{selectedPoi.reviewedAt || 'Chưa duyệt'}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={showResubmit}
        onClose={() => setShowResubmit(false)}
        onConfirm={doResubmit}
        title="Gửi duyệt lại"
        message="Bạn có chắc chắn muốn gửi POI này để duyệt lại không?"
        confirmLabel="Gửi duyệt lại"
        cancelLabel="Hủy"
        variant="info"
      />
    </div>
  );
}
