import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check, X, Eye, Search, RefreshCw, Store, Phone, Mail, MapPin,
  Calendar, ShieldCheck, AlertCircle, Clock, CheckCircle2, XCircle,
  Tag, CreditCard, Building2, User
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import Modal from '@/components/modals/Modal';
import { useToast } from '@/components/toast/ToastProvider';
import { apiMessage } from '@/services/authApi';
import {
  getAdminMerchants, approveMerchant, rejectMerchant, resolveMerchantImageUrl,
  type AdminMerchant
} from '@/services/adminMerchantApi';

type FilterTab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const SAMPLE_MERCHANTS: AdminMerchant[] = [
  {
    id: 1,
    accountId: 101,
    username: 'quan_cao_lau_ha',
    email: 'caolau.hoian@gmail.com',
    name: 'Quán Cao Lầu Thanh',
    phoneNumber: '0905123456',
    address: '26 Thái Phiên, P. Minh An, Hội An',
    category: 'Ẩm thực truyền thống',
    description: 'Chuyên phục vụ món Cao Lầu truyền thống Hội An với hơn 30 năm gia truyền, nước dùng nấu bằng giếng cổ Bá Lễ.',
    planId: 'PRO_YEARLY',
    billingCycle: 'YEARLY',
    images: [],
    approvalStatus: 'PENDING',
    rejectReason: null,
    registeredAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    approvedAt: null,
  },
  {
    id: 2,
    accountId: 102,
    username: 'denlong_pho_hoi',
    email: 'denlong.phohoi@gmail.com',
    name: 'Xưởng Đèn Lồng Phố Hội',
    phoneNumber: '0913987654',
    address: '57 Trần Phú, P. Cẩm Châu, Hội An',
    category: 'Quà lưu niệm & Thủ công',
    description: 'Cơ sở sản xuất và chế tác đèn lồng thủ công mỹ nghệ bằng lụa Hà Đông và khung tre già truyền thống.',
    planId: 'BASIC_MONTHLY',
    billingCycle: 'MONTHLY',
    images: [],
    approvalStatus: 'PENDING',
    rejectReason: null,
    registeredAt: new Date(Date.now() - 3600000 * 26).toISOString(),
    approvedAt: null,
  },
  {
    id: 3,
    accountId: 103,
    username: 'cafe_faifo_rooftop',
    email: 'contact@faifocoffee.vn',
    name: 'Faifo Coffee Rooftop',
    phoneNumber: '02353921555',
    address: '130 Trần Phú, P. Minh An, Hội An',
    category: 'Quán cà phê & Giải khát',
    description: 'Quán cà phê tầng thượng view ngắm toàn cảnh mái ngói âm dương phố cổ Hội An nổi tiếng.',
    planId: 'PREMIUM_YEARLY',
    billingCycle: 'YEARLY',
    images: [],
    approvalStatus: 'APPROVED',
    rejectReason: null,
    registeredAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    approvedAt: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
  },
  {
    id: 4,
    accountId: 104,
    username: 'tiem_gom_thanhha',
    email: 'gomthanhha.shop@gmail.com',
    name: 'Gốm Sứ Mỹ Nghệ Thanh Hà',
    phoneNumber: '0935112233',
    address: 'Khu 5, Làng gốm Thanh Hà, Hội An',
    category: 'Gốm sứ & Thủ công',
    description: 'Trưng bày và bán sản phẩm gốm đất nung truyền thống Thanh Hà.',
    planId: 'BASIC_MONTHLY',
    billingCycle: 'MONTHLY',
    images: [],
    approvalStatus: 'REJECTED',
    rejectReason: 'Hình ảnh giấy phép kinh doanh tải lên bị mờ, không xác minh được địa chỉ đăng ký.',
    registeredAt: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
    approvedAt: null,
  },
];

export default function MerchantManagement() {
  const { showToast } = useToast();
  const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('PENDING');

  // Modal states
  const [detailMerchant, setDetailMerchant] = useState<AdminMerchant | null>(null);
  const [approvingMerchant, setApprovingMerchant] = useState<AdminMerchant | null>(null);
  const [rejectingMerchant, setRejectingMerchant] = useState<AdminMerchant | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadMerchants = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminMerchants();
      if (Array.isArray(data) && data.length > 0) {
        setMerchants(data);
      } else {
        // Nếu backend chưa có data, dùng dữ liệu mẫu khởi tạo để UI luôn sẵn sàng
        setMerchants(SAMPLE_MERCHANTS);
      }
    } catch {
      // Fallback dữ liệu demo nếu backend chưa bật
      setMerchants(SAMPLE_MERCHANTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMerchants();
  }, [loadMerchants]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = merchants.length;
    const pending = merchants.filter(m => m.approvalStatus === 'PENDING').length;
    const approved = merchants.filter(m => m.approvalStatus === 'APPROVED').length;
    const rejected = merchants.filter(m => m.approvalStatus === 'REJECTED').length;
    return { total, pending, approved, rejected };
  }, [merchants]);

  // Bộ lọc theo tab và ô tìm kiếm
  const filteredMerchants = useMemo(() => {
    return merchants.filter(m => {
      const matchesTab = activeTab === 'ALL' || m.approvalStatus === activeTab;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q ||
        m.name?.toLowerCase().includes(q) ||
        m.username?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.phoneNumber?.toLowerCase().includes(q) ||
        m.address?.toLowerCase().includes(q) ||
        m.category?.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [merchants, activeTab, search]);

  // Xử lý duyệt
  const handleApprove = async () => {
    if (!approvingMerchant) return;
    setProcessing(true);
    try {
      await approveMerchant(approvingMerchant.id);
      showToast('success', `Đã duyệt thành công tài khoản "${approvingMerchant.name}".`);
      setMerchants(prev =>
        prev.map(m => m.id === approvingMerchant.id
          ? { ...m, approvalStatus: 'APPROVED', approvedAt: new Date().toISOString(), rejectReason: null }
          : m
        )
      );
      if (detailMerchant?.id === approvingMerchant.id) {
        setDetailMerchant(prev => prev ? { ...prev, approvalStatus: 'APPROVED', approvedAt: new Date().toISOString() } : null);
      }
      setApprovingMerchant(null);
    } catch (error) {
      showToast('error', apiMessage(error) || 'Không thể phê duyệt gian hàng.');
    } finally {
      setProcessing(false);
    }
  };

  // Xử lý từ chối
  const handleReject = async () => {
    if (!rejectingMerchant) return;
    if (!rejectReason.trim()) {
      showToast('error', 'Vui lòng nhập lý do từ chối.');
      return;
    }
    setProcessing(true);
    try {
      await rejectMerchant(rejectingMerchant.id, rejectReason.trim());
      showToast('success', `Đã từ chối hồ sơ "${rejectingMerchant.name}".`);
      setMerchants(prev =>
        prev.map(m => m.id === rejectingMerchant.id
          ? { ...m, approvalStatus: 'REJECTED', rejectReason: rejectReason.trim() }
          : m
        )
      );
      if (detailMerchant?.id === rejectingMerchant.id) {
        setDetailMerchant(prev => prev ? { ...prev, approvalStatus: 'REJECTED', rejectReason: rejectReason.trim() } : null);
      }
      setRejectingMerchant(null);
      setRejectReason('');
    } catch (error) {
      showToast('error', apiMessage(error) || 'Không thể từ chối hồ sơ.');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brown-900 flex items-center gap-2">
            <Store className="w-7 h-7 text-primary-600" />
            Duyệt & Quản lý Chủ gian hàng
          </h1>
          <p className="text-sm text-brown-500 mt-1">
            Phê duyệt hồ sơ đăng ký gian hàng đối tác kinh doanh và điểm dịch vụ tại phố cổ Hội An.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => void loadMerchants()}
            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            disabled={loading}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card noPadding className="p-4 flex items-center gap-4 border-l-4 border-l-brown-400">
          <div className="w-12 h-12 rounded-xl bg-brown-50 flex items-center justify-center text-brown-600">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-brown-400 uppercase tracking-wider">Tổng gian hàng</p>
            <p className="text-2xl font-bold text-brown-900 mt-0.5">{stats.total}</p>
          </div>
        </Card>

        <Card noPadding className="p-4 flex items-center gap-4 border-l-4 border-l-amber-500 bg-amber-50/20">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">Chờ xét duyệt</p>
            <p className="text-2xl font-bold text-amber-900 mt-0.5">{stats.pending}</p>
          </div>
        </Card>

        <Card noPadding className="p-4 flex items-center gap-4 border-l-4 border-l-green-500">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-green-600 uppercase tracking-wider">Đã kích hoạt</p>
            <p className="text-2xl font-bold text-green-900 mt-0.5">{stats.approved}</p>
          </div>
        </Card>

        <Card noPadding className="p-4 flex items-center gap-4 border-l-4 border-l-red-400">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-red-500 uppercase tracking-wider">Đã từ chối</p>
            <p className="text-2xl font-bold text-red-900 mt-0.5">{stats.rejected}</p>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card noPadding>
        {/* Filter Tabs & Search */}
        <div className="p-4 border-b border-brown-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'PENDING'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-brown-50 text-brown-600 hover:bg-brown-100'
              }`}
            >
              <span>Chờ xét duyệt</span>
              {stats.pending > 0 && (
                <span className={`px-2 py-0.2 rounded-full text-xs font-bold ${
                  activeTab === 'PENDING' ? 'bg-white text-amber-700' : 'bg-amber-100 text-amber-800'
                }`}>
                  {stats.pending}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'ALL'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-brown-50 text-brown-600 hover:bg-brown-100'
              }`}
            >
              Tất cả ({stats.total})
            </button>

            <button
              onClick={() => setActiveTab('APPROVED')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'APPROVED'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-brown-50 text-brown-600 hover:bg-brown-100'
              }`}
            >
              Đã duyệt ({stats.approved})
            </button>

            <button
              onClick={() => setActiveTab('REJECTED')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'REJECTED'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-brown-50 text-brown-600 hover:bg-brown-100'
              }`}
            >
              Đã từ chối ({stats.rejected})
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tên, SĐT, email..."
              className="w-full pl-10 pr-3 py-1.5 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="px-4 py-16 text-center text-sm text-brown-400">
            <div className="inline-block w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p>Đang tải danh sách hồ sơ gian hàng…</p>
          </div>
        ) : filteredMerchants.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-brown-400">
            <Store className="w-10 h-10 mx-auto text-brown-300 mb-2" />
            <p>Không tìm thấy hồ sơ gian hàng nào phù hợp với bộ lọc.</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm min-w-[950px]">
              <thead>
                <tr className="border-b border-brown-100 bg-brown-50/60">
                  <th className="px-4 py-3.5 text-left font-semibold text-brown-600 text-xs uppercase tracking-wider">
                    Gian hàng & Địa chỉ
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold text-brown-600 text-xs uppercase tracking-wider">
                    Người đại diện
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold text-brown-600 text-xs uppercase tracking-wider">
                    Ngành hàng
                  </th>
                  <th className="px-4 py-3.5 text-center font-semibold text-brown-600 text-xs uppercase tracking-wider">
                    Gói dịch vụ
                  </th>
                  <th className="px-4 py-3.5 text-center font-semibold text-brown-600 text-xs uppercase tracking-wider">
                    Ngày đăng ký
                  </th>
                  <th className="px-4 py-3.5 text-center font-semibold text-brown-600 text-xs uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3.5 text-right font-semibold text-brown-600 text-xs uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown-50">
                {filteredMerchants.map(merchant => (
                  <tr key={merchant.id} className="hover:bg-brown-50/40 transition-colors">
                    {/* Tên & Địa chỉ */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-base flex-shrink-0 border border-primary-200">
                          {merchant.images && merchant.images.length > 0 ? (
                            <img
                              src={resolveMerchantImageUrl(merchant.images[0])}
                              alt=""
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Store className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-brown-900 hover:text-primary-600 cursor-pointer" onClick={() => setDetailMerchant(merchant)}>
                            {merchant.name}
                          </div>
                          <div className="text-xs text-brown-500 flex items-center gap-1 mt-0.5 max-w-xs truncate">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-brown-400" />
                            <span className="truncate">{merchant.address || 'Chưa cập nhật địa chỉ'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Người đại diện */}
                    <td className="px-4 py-3.5">
                      <div className="text-brown-800 font-medium flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-brown-400" />
                        <span>{merchant.username}</span>
                      </div>
                      <div className="text-xs text-brown-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-brown-400" />
                        <span>{merchant.phoneNumber || '—'}</span>
                      </div>
                    </td>

                    {/* Ngành hàng */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-brown-100/80 text-brown-700 font-medium">
                        <Tag className="w-3 h-3 text-brown-500" />
                        {merchant.category || 'Dịch vụ'}
                      </span>
                    </td>

                    {/* Gói dịch vụ */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        {merchant.planId || 'TIÊU CHUẨN'}
                      </span>
                      {merchant.billingCycle && (
                        <div className="text-[11px] text-brown-400 mt-0.5">{merchant.billingCycle}</div>
                      )}
                    </td>

                    {/* Ngày đăng ký */}
                    <td className="px-4 py-3.5 text-center text-xs text-brown-500">
                      {formatDate(merchant.registeredAt)}
                    </td>

                    {/* Trạng thái */}
                    <td className="px-4 py-3.5 text-center">
                      {merchant.approvalStatus === 'APPROVED' ? (
                        <Badge variant="active">Đã kích hoạt</Badge>
                      ) : merchant.approvalStatus === 'PENDING' ? (
                        <Badge variant="partial">Chờ xét duyệt</Badge>
                      ) : (
                        <div className="inline-flex flex-col items-center">
                          <Badge variant="skipped">Bị từ chối</Badge>
                        </div>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setDetailMerchant(merchant)}
                          icon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Chi tiết
                        </Button>

                        {merchant.approvalStatus === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => setApprovingMerchant(merchant)}
                              icon={<Check className="w-3.5 h-3.5" />}
                            >
                              Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                setRejectingMerchant(merchant);
                                setRejectReason('');
                              }}
                              icon={<X className="w-3.5 h-3.5" />}
                            >
                              Từ chối
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-4 py-3 border-t border-brown-100 text-xs text-brown-500 flex justify-between items-center">
              <span>Hiển thị {filteredMerchants.length} / {merchants.length} gian hàng</span>
            </div>
          </div>
        )}
      </Card>

      {/* MODAL 1: CHI TIẾT HỒ SƠ GIAN HÀNG */}
      <Modal
        open={detailMerchant !== null}
        onClose={() => setDetailMerchant(null)}
        title={detailMerchant ? `Hồ sơ gian hàng: ${detailMerchant.name}` : ''}
        size="lg"
        footer={
          detailMerchant && (
            <div className="flex items-center justify-between w-full">
              <div>
                {detailMerchant.approvalStatus === 'PENDING' && (
                  <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                    Hồ sơ đang chờ phê duyệt
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setDetailMerchant(null)}>
                  Đóng
                </Button>
                {detailMerchant.approvalStatus === 'PENDING' && (
                  <>
                    <Button
                      variant="danger"
                      onClick={() => {
                        setRejectingMerchant(detailMerchant);
                        setRejectReason('');
                      }}
                      icon={<X className="w-4 h-4" />}
                    >
                      Từ chối
                    </Button>
                    <Button
                      variant="success"
                      onClick={() => setApprovingMerchant(detailMerchant)}
                      icon={<Check className="w-4 h-4" />}
                    >
                      Phê duyệt ngay
                    </Button>
                  </>
                )}
              </div>
            </div>
          )
        }
      >
        {detailMerchant && (
          <div className="space-y-5">
            {/* Cảnh báo lý do từ chối nếu có */}
            {detailMerchant.approvalStatus === 'REJECTED' && detailMerchant.rejectReason && (
              <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 flex gap-3 text-red-800 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Lý do từ chối trước đó:</p>
                  <p className="mt-0.5 text-red-700">{detailMerchant.rejectReason}</p>
                </div>
              </div>
            )}

            {/* Thông tin cốt lõi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-brown-50/50 p-4 rounded-xl border border-brown-100">
              <div>
                <span className="text-xs text-brown-400 font-medium">Tên gian hàng / điểm dịch vụ</span>
                <p className="text-base font-bold text-brown-900 mt-0.5">{detailMerchant.name}</p>
              </div>
              <div>
                <span className="text-xs text-brown-400 font-medium">Ngành hàng đăng ký</span>
                <p className="text-sm font-semibold text-primary-700 mt-0.5">{detailMerchant.category || 'Chưa cập nhật'}</p>
              </div>
              <div>
                <span className="text-xs text-brown-400 font-medium">Tên tài khoản quản lý (Username)</span>
                <p className="text-sm font-medium text-brown-800 mt-0.5">{detailMerchant.username}</p>
              </div>
              <div>
                <span className="text-xs text-brown-400 font-medium">Số điện thoại liên hệ</span>
                <p className="text-sm font-medium text-brown-800 mt-0.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-brown-400" />
                  {detailMerchant.phoneNumber || 'Chưa cung cấp'}
                </p>
              </div>
              <div>
                <span className="text-xs text-brown-400 font-medium">Email</span>
                <p className="text-sm font-medium text-brown-800 mt-0.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-brown-400" />
                  {detailMerchant.email || 'Chưa cung cấp'}
                </p>
              </div>
              <div>
                <span className="text-xs text-brown-400 font-medium">Địa chỉ cơ sở tại Hội An</span>
                <p className="text-sm font-medium text-brown-800 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brown-400" />
                  {detailMerchant.address || 'Chưa cung cấp'}
                </p>
              </div>
              <div>
                <span className="text-xs text-brown-400 font-medium">Gói dịch vụ đăng ký</span>
                <p className="text-sm font-semibold text-amber-700 mt-0.5">
                  {detailMerchant.planId || 'Mặc định'} ({detailMerchant.billingCycle || 'Theo tháng'})
                </p>
              </div>
              <div>
                <span className="text-xs text-brown-400 font-medium">Thời gian nộp hồ sơ</span>
                <p className="text-sm text-brown-600 mt-0.5">{formatDate(detailMerchant.registeredAt)}</p>
              </div>
            </div>

            {/* Mô tả cửa hàng */}
            <div>
              <h4 className="text-sm font-semibold text-brown-800 mb-1.5">Mô tả & Giới thiệu gian hàng</h4>
              <p className="text-sm text-brown-600 bg-white p-3 rounded-lg border border-brown-200 leading-relaxed whitespace-pre-line">
                {detailMerchant.description || 'Chưa có thông tin giới thiệu chi tiết.'}
              </p>
            </div>

            {/* Hình ảnh cơ sở / Giấy tờ */}
            <div>
              <h4 className="text-sm font-semibold text-brown-800 mb-2">Hình ảnh cửa hàng & hồ sơ đính kèm</h4>
              {detailMerchant.images && detailMerchant.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {detailMerchant.images.map((img, idx) => (
                    <a
                      key={idx}
                      href={resolveMerchantImageUrl(img)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg overflow-hidden border border-brown-200 hover:opacity-90 transition-opacity aspect-video bg-brown-50"
                    >
                      <img
                        src={resolveMerchantImageUrl(img)}
                        alt={`Ảnh ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center rounded-lg border border-dashed border-brown-200 text-xs text-brown-400">
                  Gian hàng chưa tải lên hình ảnh đính kèm.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: XÁC NHẬN PHÊ DUYỆT */}
      <Modal
        open={approvingMerchant !== null}
        onClose={() => !processing && setApprovingMerchant(null)}
        title="Xác nhận phê duyệt gian hàng"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setApprovingMerchant(null)}
              disabled={processing}
            >
              Hủy
            </Button>
            <Button
              variant="success"
              onClick={() => void handleApprove()}
              disabled={processing}
              icon={<Check className="w-4 h-4" />}
            >
              {processing ? 'Đang duyệt…' : 'Xác nhận duyệt'}
            </Button>
          </>
        }
      >
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 text-green-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-brown-800 leading-relaxed">
              Bạn có chắc chắn muốn phê duyệt gian hàng <strong>"{approvingMerchant?.name}"</strong>?
            </p>
            <p className="text-xs text-brown-500 mt-2">
              Sau khi duyệt, chủ gian hàng sẽ có quyền đăng nhập vào hệ thống dành cho đối tác để tạo điểm tham quan POI và tải nội dung âm thanh quảng bá.
            </p>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: TỪ CHỐI KÈM LÝ DO */}
      <Modal
        open={rejectingMerchant !== null}
        onClose={() => !processing && setRejectingMerchant(null)}
        title="Từ chối hồ sơ gian hàng"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setRejectingMerchant(null)}
              disabled={processing}
            >
              Đóng
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleReject()}
              disabled={processing}
              icon={<X className="w-4 h-4" />}
            >
              {processing ? 'Đang xử lý…' : 'Xác nhận từ chối'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-brown-700">
            Hồ sơ gian hàng: <strong>{rejectingMerchant?.name}</strong>
          </p>
          <div>
            <label className="block text-xs font-semibold text-brown-700 mb-1">
              Lý do từ chối * (sẽ gửi phản hồi cho chủ quán)
            </label>
            <textarea
              required
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Nhập lý do hồ sơ chưa đạt chuẩn (vd: ảnh giấy phép mờ, địa chỉ không khớp...)"
              className="w-full rounded-lg border border-brown-200 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div>
            <span className="text-xs text-brown-400 block mb-1.5">Gợi ý lý do nhanh:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Hình ảnh giấy tờ/cửa hàng không rõ nét',
                'Địa chỉ không thuộc khu vực quy hoạch phố cổ',
                'Số điện thoại liên hệ không chính xác',
                'Ngành hàng chưa phù hợp với quy chuẩn du lịch'
              ].map(reason => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectReason(reason)}
                  className="text-xs px-2.5 py-1 rounded bg-brown-50 hover:bg-brown-100 text-brown-700 border border-brown-200 transition-colors"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
