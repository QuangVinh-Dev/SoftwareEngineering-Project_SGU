import { useState } from 'react';
import { Search, MapPin, Headphones, Edit2, Eye, FileCheck } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { useApp } from '@/hooks/useApp';
import { useToast } from '@/components/toast/ToastProvider';
import { myPois as initialPois } from '@/data/mockData';
import type { StallOwnerPOI, ApprovalStatus } from '@/types';
import { formatNumber } from '@/utils/helpers';

const statusLabels: Record<ApprovalStatus, string> = {
  approved: 'Đã duyệt',
  pending: 'Chờ duyệt',
  rejected: 'Từ chối',
};

export default function MyPOI() {
  const { showToast } = useToast();
  const { setCurrentPage } = useApp();
  const [items] = useState<StallOwnerPOI[]>(initialPois);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [detailItem, setDetailItem] = useState<StallOwnerPOI | null>(null);

  const filtered = items.filter(p =>
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.nameEn.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === 'all' || p.approvalStatus === statusFilter)
  );

  const handleEditRedirect = (poi: StallOwnerPOI) => {
    if (poi.approvalStatus === 'pending') {
      showToast('warning', 'POI đang chờ duyệt, không thể chỉnh sửa lúc này.');
      return;
    }
    setCurrentPage('edit-poi');
    showToast('info', `Đang chuyển đến chỉnh sửa POI: ${poi.name}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brown-900">POI của tôi</h1>
          <p className="text-sm text-brown-400 mt-1">Quản lý các điểm tham quan thuộc gian hàng của bạn.</p>
        </div>
        <Button onClick={() => setCurrentPage('submit-poi')} icon={<MapPin className="w-4 h-4" />}>Gửi POI mới</Button>
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-brown-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm POI theo tên..."
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-brown-200 text-sm text-brown-700 outline-none focus:border-primary-400 bg-white">
            <option value="all">Tất cả trạng thái</option>
            <option value="approved">Đã duyệt</option>
            <option value="pending">Chờ duyệt</option>
            <option value="rejected">Từ chối</option>
          </select>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-brown-100 bg-brown-50/50">
                <th className="px-4 py-3 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">Tên POI</th>
                <th className="px-4 py-3 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">Danh mục</th>
                <th className="px-4 py-3 text-right font-medium text-brown-500 text-xs uppercase tracking-wider">Lượt nghe</th>
                <th className="px-4 py-3 text-right font-medium text-brown-500 text-xs uppercase tracking-wider">Thời gian TB</th>
                <th className="px-4 py-3 text-center font-medium text-brown-500 text-xs uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-center font-medium text-brown-500 text-xs uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(poi => (
                <tr key={poi.id} className="border-b border-brown-50 hover:bg-brown-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-brown-800">{poi.name}</p>
                    <p className="text-xs text-brown-400">{poi.nameEn}</p>
                  </td>
                  <td className="px-4 py-3 text-brown-600">{poi.category}</td>
                  <td className="px-4 py-3 text-right text-brown-700">{formatNumber(poi.listeningSessions)}</td>
                  <td className="px-4 py-3 text-right text-brown-600 font-mono">{poi.avgTime}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={poi.approvalStatus === 'approved' ? 'approved' : poi.approvalStatus === 'pending' ? 'pending' : 'rejected'}>
                      {statusLabels[poi.approvalStatus]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setDetailItem(poi)} className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors" title="Xem chi tiết">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEditRedirect(poi)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Chỉnh sửa">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-brown-400">Không tìm thấy POI nào.</div>
        )}

        <div className="px-4 py-3 border-t border-brown-100 text-sm text-brown-500">
          Hiển thị {filtered.length} trong tổng số {items.length} POI
        </div>
      </Card>

      {detailItem && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in" onClick={() => setDetailItem(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-scale-in overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-brown-100">
              <h2 className="text-lg font-semibold text-brown-900">Chi tiết POI</h2>
              <button onClick={() => setDetailItem(null)} className="p-1 rounded-lg hover:bg-brown-50 text-brown-400 hover:text-brown-700">
                <Eye className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-brown-900">{detailItem.name}</p>
                  <p className="text-xs text-brown-400">{detailItem.nameEn}</p>
                </div>
                <div className="ml-auto">
                  <Badge variant={detailItem.approvalStatus === 'approved' ? 'approved' : detailItem.approvalStatus === 'pending' ? 'pending' : 'rejected'}>
                    {statusLabels[detailItem.approvalStatus]}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-brown-50 rounded-lg">
                  <p className="text-xs text-brown-400">Danh mục</p>
                  <p className="text-sm font-medium text-brown-800">{detailItem.category}</p>
                </div>
                <div className="p-3 bg-brown-50 rounded-lg">
                  <p className="text-xs text-brown-400">Địa chỉ</p>
                  <p className="text-sm font-medium text-brown-800">{detailItem.address}</p>
                </div>
                <div className="p-3 bg-brown-50 rounded-lg">
                  <p className="text-xs text-brown-400">Tọa độ GPS</p>
                  <p className="text-sm font-medium text-brown-800 font-mono">{detailItem.lat}, {detailItem.lng}</p>
                </div>
                <div className="p-3 bg-brown-50 rounded-lg">
                  <p className="text-xs text-brown-400">Bán kính</p>
                  <p className="text-sm font-medium text-brown-800">{detailItem.radius} m</p>
                </div>
                <div className="p-3 bg-brown-50 rounded-lg">
                  <p className="text-xs text-brown-400">Lượt nghe</p>
                  <p className="text-sm font-medium text-brown-800">{formatNumber(detailItem.listeningSessions)}</p>
                </div>
                <div className="p-3 bg-brown-50 rounded-lg">
                  <p className="text-xs text-brown-400">Thời gian nghe TB</p>
                  <p className="text-sm font-medium text-brown-800 font-mono">{detailItem.avgTime}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-brown-400 mb-1">Mô tả</p>
                <p className="text-sm text-brown-700">{detailItem.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-brown-50 rounded-lg">
                  <p className="text-xs text-brown-400">Ngày gửi</p>
                  <p className="text-sm font-medium text-brown-800">{detailItem.submittedAt}</p>
                </div>
                <div className="p-3 bg-brown-50 rounded-lg">
                  <p className="text-xs text-brown-400">Ngày duyệt</p>
                  <p className="text-sm font-medium text-brown-800">{detailItem.reviewedAt || 'Chưa duyệt'}</p>
                </div>
              </div>
              {detailItem.rejectionReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-400 mb-1">Lý do từ chối</p>
                  <p className="text-sm text-red-700">{detailItem.rejectionReason}</p>
                </div>
              )}
              <div className="flex items-center gap-2 pt-2">
                <Headphones className="w-4 h-4 text-brown-400" />
                <span className="text-xs text-brown-400">Xem nội dung audio trong mục "Nội dung audio"</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brown-100">
              <Button variant="secondary" onClick={() => setDetailItem(null)}>Đóng</Button>
              {detailItem.approvalStatus === 'approved' && (
                <Button onClick={() => { handleEditRedirect(detailItem); setDetailItem(null); }} icon={<Edit2 className="w-4 h-4" />}>Chỉnh sửa</Button>
              )}
              {detailItem.approvalStatus === 'rejected' && (
                <Button onClick={() => { setCurrentPage('submit-poi'); setDetailItem(null); showToast('info', 'Vui lòng gửi lại POI với thông tin đã cập nhật.'); }} icon={<FileCheck className="w-4 h-4" />}>Gửi lại</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
