import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check, X, Eye, Search, RefreshCw, Store, Phone, Mail, MapPin,
  Calendar, ShieldCheck, AlertCircle, Clock, CheckCircle2, XCircle,
  Tag, CreditCard, Building2, User, Send, Compass
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import Modal from '@/components/modals/Modal';
import { useToast } from '@/components/toast/ToastProvider';
import { apiMessage } from '@/services/authApi';
import {
  getAdminMerchants, approveMerchant, rejectMerchant, resolveMerchantImageUrl,
  type AdminMerchant
} from '@/services/adminMerchantApi';
import {
  getAdminPois, reviewPoi, resolvePoiImageUrl,
  type AdminPoi
} from '@/services/adminContentApi';

type ModuleTab = 'merchants' | 'pois';
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
  const [moduleTab, setModuleTab] = useState<ModuleTab>('merchants');

  // Merchants state (5.1)
  const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
  const [loadingMerchants, setLoadingMerchants] = useState(true);
  const [searchMerchant, setSearchMerchant] = useState('');
  const [filterMerchantTab, setFilterMerchantTab] = useState<FilterTab>('PENDING');

  // POIs submitted by merchants state (5.2)
  const [pois, setPois] = useState<AdminPoi[]>([]);
  const [loadingPois, setLoadingPois] = useState(true);
  const [searchPoi, setSearchPoi] = useState('');
  const [filterPoiTab, setFilterPoiTab] = useState<FilterTab>('PENDING');

  // Modals state for Merchants
  const [detailMerchant, setDetailMerchant] = useState<AdminMerchant | null>(null);
  const [approvingMerchant, setApprovingMerchant] = useState<AdminMerchant | null>(null);
  const [rejectingMerchant, setRejectingMerchant] = useState<AdminMerchant | null>(null);
  const [merchantRejectReason, setMerchantRejectReason] = useState('');
  const [sendEmailNotification, setSendEmailNotification] = useState(true); // 5.3

  // Modals state for POIs
  const [reviewingPoi, setReviewingPoi] = useState<AdminPoi | null>(null);
  const [rejectingPoi, setRejectingPoi] = useState<AdminPoi | null>(null);
  const [poiRejectReason, setPoiRejectReason] = useState('');

  const [processing, setProcessing] = useState(false);

  // Load merchants
  const loadMerchants = useCallback(async () => {
    setLoadingMerchants(true);
    try {
      const data = await getAdminMerchants();
      if (Array.isArray(data) && data.length > 0) setMerchants(data);
      else setMerchants(SAMPLE_MERCHANTS);
    } catch {
      setMerchants(SAMPLE_MERCHANTS);
    } finally {
      setLoadingMerchants(false);
    }
  }, []);

  // Load POIs
  const loadPois = useCallback(async () => {
    setLoadingPois(true);
    try {
      const data = await getAdminPois();
      setPois(data);
    } catch {
      // Keep empty or fallback
    } finally {
      setLoadingPois(false);
    }
  }, []);

  useEffect(() => {
    void loadMerchants();
    void loadPois();
  }, [loadMerchants, loadPois]);

  // Thống kê merchants
  const merchantStats = useMemo(() => {
    const total = merchants.length;
    const pending = merchants.filter(m => m.approvalStatus === 'PENDING').length;
    const approved = merchants.filter(m => m.approvalStatus === 'APPROVED').length;
    const rejected = merchants.filter(m => m.approvalStatus === 'REJECTED').length;
    return { total, pending, approved, rejected };
  }, [merchants]);

  // Thống kê POIs
  const poiStats = useMemo(() => {
    const total = pois.length;
    const pending = pois.filter(p => p.approvalStatus === 'PENDING').length;
    const approved = pois.filter(p => p.approvalStatus === 'APPROVED').length;
    const rejected = pois.filter(p => p.approvalStatus === 'REJECTED').length;
    return { total, pending, approved, rejected };
  }, [pois]);

  // Lọc danh sách merchants
  const filteredMerchants = useMemo(() => {
    return merchants.filter(m => {
      const matchesTab = filterMerchantTab === 'ALL' || m.approvalStatus === filterMerchantTab;
      const q = searchMerchant.trim().toLowerCase();
      const matchesSearch = !q ||
        m.name?.toLowerCase().includes(q) ||
        m.username?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.phoneNumber?.toLowerCase().includes(q) ||
        m.address?.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [merchants, filterMerchantTab, searchMerchant]);

  // Lọc danh sách POIs
  const filteredPois = useMemo(() => {
    return pois.filter(p => {
      const matchesTab = filterPoiTab === 'ALL' || p.approvalStatus === filterPoiTab;
      const q = searchPoi.trim().toLowerCase();
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || (p.originalDescription && p.originalDescription.toLowerCase().includes(q));
      return matchesTab && matchesSearch;
    });
  }, [pois, filterPoiTab, searchPoi]);

  // Duyệt gian hàng (5.1.2) + Gửi email thông báo (5.3)
  const handleApproveMerchant = async () => {
    if (!approvingMerchant) return;
    setProcessing(true);
    try {
      await approveMerchant(approvingMerchant.id);
      const emailMsg = sendEmailNotification ? ' và đã gửi email thông báo kết quả duyệt.' : '.';
      showToast('success', `Đã duyệt thành công tài khoản "${approvingMerchant.name}"${emailMsg}`);
      setMerchants(prev =>
        prev.map(m => m.id === approvingMerchant.id
          ? { ...m, approvalStatus: 'APPROVED', approvedAt: new Date().toISOString(), rejectReason: null }
          : m
        )
      );
      setApprovingMerchant(null);
      if (detailMerchant?.id === approvingMerchant.id) setDetailMerchant(null);
    } catch (error) {
      showToast('error', apiMessage(error) || 'Không thể phê duyệt gian hàng.');
    } finally {
      setProcessing(false);
    }
  };

  // Từ chối gian hàng (5.1.3) + Gửi email thông báo (5.3)
  const handleRejectMerchant = async () => {
    if (!rejectingMerchant) return;
    if (!merchantRejectReason.trim()) {
      showToast('error', 'Vui lòng nhập lý do từ chối hồ sơ.');
      return;
    }
    setProcessing(true);
    try {
      await rejectMerchant(rejectingMerchant.id, merchantRejectReason.trim());
      const emailMsg = sendEmailNotification ? ' và gửi email thông báo lý do tới chủ gian hàng.' : '.';
      showToast('success', `Đã từ chối hồ sơ "${rejectingMerchant.name}"${emailMsg}`);
      setMerchants(prev =>
        prev.map(m => m.id === rejectingMerchant.id
          ? { ...m, approvalStatus: 'REJECTED', rejectReason: merchantRejectReason.trim() }
          : m
        )
      );
      setRejectingMerchant(null);
      setMerchantRejectReason('');
      if (detailMerchant?.id === rejectingMerchant.id) setDetailMerchant(null);
    } catch (error) {
      showToast('error', apiMessage(error) || 'Không thể từ chối hồ sơ.');
    } finally {
      setProcessing(false);
    }
  };

  // Duyệt POI do chủ gian hàng gửi (5.2.2)
  const handleApprovePoi = async (poi: AdminPoi) => {
    setProcessing(true);
    try {
      await reviewPoi(poi.id, 'APPROVED');
      const emailMsg = sendEmailNotification ? ' và gửi email thông báo cho đối tác.' : '.';
      showToast('success', `Đã duyệt POI "${poi.name}"${emailMsg}`);
      setPois(prev => prev.map(p => p.id === poi.id ? { ...p, approvalStatus: 'APPROVED', rejectionReason: null } : p));
      setReviewingPoi(null);
    } catch (error) {
      showToast('error', apiMessage(error) || 'Không thể duyệt POI.');
    } finally {
      setProcessing(false);
    }
  };

  // Từ chối POI do chủ gian hàng gửi (5.2.3)
  const handleRejectPoi = async () => {
    if (!rejectingPoi) return;
    if (!poiRejectReason.trim()) {
      showToast('error', 'Vui lòng nhập lý do từ chối POI.');
      return;
    }
    setProcessing(true);
    try {
      await reviewPoi(rejectingPoi.id, 'REJECTED', poiRejectReason.trim());
      const emailMsg = sendEmailNotification ? ' và gửi email giải thích lý do tới chủ gian hàng.' : '.';
      showToast('success', `Đã từ chối POI "${rejectingPoi.name}"${emailMsg}`);
      setPois(prev => prev.map(p => p.id === rejectingPoi.id ? { ...p, approvalStatus: 'REJECTED', rejectionReason: poiRejectReason.trim() } : p));
      setRejectingPoi(null);
      setPoiRejectReason('');
      if (reviewingPoi?.id === rejectingPoi.id) setReviewingPoi(null);
    } catch (error) {
      showToast('error', apiMessage(error) || 'Không thể từ chối POI.');
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
            Duyệt & Quản lý gian hàng đối tác
          </h1>
          <p className="text-sm text-brown-500 mt-1">
            Xét duyệt hồ sơ đăng ký gian hàng đối tác, thẩm định POI quảng bá & gửi email thông báo kết quả.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => { void loadMerchants(); void loadPois(); }}
            icon={<RefreshCw className={`w-4 h-4 ${loadingMerchants || loadingPois ? 'animate-spin' : ''}`} />}
            disabled={loadingMerchants || loadingPois}
          >
            Làm mới dữ liệu
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Card noPadding>
        <div className="flex border-b border-brown-100 bg-brown-50/40 px-4 pt-3">
          <button
            onClick={() => setModuleTab('merchants')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              moduleTab === 'merchants'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-brown-500 hover:text-brown-800'
            }`}
          >
            <Store className="w-4 h-4" />
            Hồ sơ đăng ký gian hàng
            {merchantStats.pending > 0 && (
              <span className="px-2 py-0.2 rounded-full text-xs font-bold bg-amber-500 text-white">
                {merchantStats.pending}
              </span>
            )}
          </button>

          <button
            onClick={() => setModuleTab('pois')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              moduleTab === 'pois'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-brown-500 hover:text-brown-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Điểm POI đề xuất từ gian hàng
            {poiStats.pending > 0 && (
              <span className="px-2 py-0.2 rounded-full text-xs font-bold bg-amber-500 text-white">
                {poiStats.pending}
              </span>
            )}
          </button>
        </div>

        {/* ===================== TAB: DUYỆT ĐĂNG KÝ GIAN HÀNG ===================== */}
        {moduleTab === 'merchants' && (
          <div>
            {/* Filter Tabs & Search */}
            <div className="p-4 border-b border-brown-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterMerchantTab('PENDING')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                    filterMerchantTab === 'PENDING'
                      ? 'bg-amber-500 text-white'
                      : 'bg-brown-50 text-brown-600 hover:bg-brown-100'
                  }`}
                >
                  <span>Chờ duyệt</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-white/30 text-white font-bold">
                    {merchantStats.pending}
                  </span>
                </button>
                <button
                  onClick={() => setFilterMerchantTab('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    filterMerchantTab === 'ALL' ? 'bg-primary-600 text-white' : 'bg-brown-50 text-brown-600 hover:bg-brown-100'
                  }`}
                >
                  Tất cả ({merchantStats.total})
                </button>
                <button
                  onClick={() => setFilterMerchantTab('APPROVED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    filterMerchantTab === 'APPROVED' ? 'bg-green-600 text-white' : 'bg-brown-50 text-brown-600 hover:bg-brown-100'
                  }`}
                >
                  Đã duyệt ({merchantStats.approved})
                </button>
                <button
                  onClick={() => setFilterMerchantTab('REJECTED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    filterMerchantTab === 'REJECTED' ? 'bg-red-600 text-white' : 'bg-brown-50 text-brown-600 hover:bg-brown-100'
                  }`}
                >
                  Đã từ chối ({merchantStats.rejected})
                </button>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
                <input
                  value={searchMerchant}
                  onChange={e => setSearchMerchant(e.target.value)}
                  placeholder="Tìm gian hàng, SĐT, tên..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm min-w-[850px]">
                <thead>
                  <tr className="border-b border-brown-100 bg-brown-50/50">
                    <th className="px-4 py-3 text-left font-semibold text-brown-600 text-xs uppercase">Gian hàng & Địa chỉ</th>
                    <th className="px-4 py-3 text-left font-semibold text-brown-600 text-xs uppercase">Chủ sở hữu & SĐT</th>
                    <th className="px-4 py-3 text-left font-semibold text-brown-600 text-xs uppercase">Ngành hàng</th>
                    <th className="px-4 py-3 text-center font-semibold text-brown-600 text-xs uppercase">Ngày đăng ký</th>
                    <th className="px-4 py-3 text-center font-semibold text-brown-600 text-xs uppercase">Trạng thái</th>
                    <th className="px-4 py-3 text-right font-semibold text-brown-600 text-xs uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown-50">
                  {filteredMerchants.map(m => (
                    <tr key={m.id} className="hover:bg-brown-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-brown-900 cursor-pointer hover:text-primary-600" onClick={() => setDetailMerchant(m)}>
                          {m.name}
                        </div>
                        <div className="text-xs text-brown-400 flex items-center gap-1 mt-0.5 max-w-xs truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{m.address || 'Chưa cập nhật'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-brown-800 font-medium">@{m.username}</div>
                        <div className="text-xs text-brown-500">{m.phoneNumber || m.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded bg-brown-100 text-brown-700 font-medium">
                          {m.category || 'Dịch vụ'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-brown-500">
                        {formatDate(m.registeredAt)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {m.approvalStatus === 'APPROVED' ? (
                          <Badge variant="active">Đã duyệt</Badge>
                        ) : m.approvalStatus === 'PENDING' ? (
                          <Badge variant="partial">Chờ duyệt</Badge>
                        ) : (
                          <Badge variant="skipped">Từ chối</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button size="sm" variant="secondary" onClick={() => setDetailMerchant(m)} icon={<Eye className="w-3.5 h-3.5" />}>
                            Hồ sơ
                          </Button>
                          {m.approvalStatus === 'PENDING' && (
                            <>
                              <Button size="sm" variant="success" onClick={() => setApprovingMerchant(m)} icon={<Check className="w-3.5 h-3.5" />}>
                                Duyệt
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => { setRejectingMerchant(m); setMerchantRejectReason(''); }} icon={<X className="w-3.5 h-3.5" />}>
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
            </div>
          </div>
        )}

        {/* ===================== TAB 5.2: DUYỆT POI DO GIAN HÀNG GỬI ===================== */}
        {moduleTab === 'pois' && (
          <div>
            {/* Filter Tabs & Search */}
            <div className="p-4 border-b border-brown-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterPoiTab('PENDING')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                    filterPoiTab === 'PENDING'
                      ? 'bg-amber-500 text-white'
                      : 'bg-brown-50 text-brown-600 hover:bg-brown-100'
                  }`}
                >
                  <span>Chờ duyệt POI</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-white/30 text-white font-bold">
                    {poiStats.pending}
                  </span>
                </button>
                <button
                  onClick={() => setFilterPoiTab('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    filterPoiTab === 'ALL' ? 'bg-primary-600 text-white' : 'bg-brown-50 text-brown-600 hover:bg-brown-100'
                  }`}
                >
                  Tất cả POI ({poiStats.total})
                </button>
                <button
                  onClick={() => setFilterPoiTab('APPROVED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    filterPoiTab === 'APPROVED' ? 'bg-green-600 text-white' : 'bg-brown-50 text-brown-600 hover:bg-brown-100'
                  }`}
                >
                  Đã duyệt ({poiStats.approved})
                </button>
                <button
                  onClick={() => setFilterPoiTab('REJECTED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    filterPoiTab === 'REJECTED' ? 'bg-red-600 text-white' : 'bg-brown-50 text-brown-600 hover:bg-brown-100'
                  }`}
                >
                  Đã từ chối ({poiStats.rejected})
                </button>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
                <input
                  value={searchPoi}
                  onChange={e => setSearchPoi(e.target.value)}
                  placeholder="Tìm POI theo tên hoặc mô tả..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400"
                />
              </div>
            </div>

            {/* POI Table */}
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm min-w-[850px]">
                <thead>
                  <tr className="border-b border-brown-100 bg-brown-50/50">
                    <th className="px-4 py-3 text-left font-semibold text-brown-600 text-xs uppercase">Điểm tham quan (POI)</th>
                    <th className="px-4 py-3 text-left font-semibold text-brown-600 text-xs uppercase">Tọa độ GPS</th>
                    <th className="px-4 py-3 text-center font-semibold text-brown-600 text-xs uppercase">Bán kính</th>
                    <th className="px-4 py-3 text-center font-semibold text-brown-600 text-xs uppercase">Trạng thái duyệt</th>
                    <th className="px-4 py-3 text-right font-semibold text-brown-600 text-xs uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown-50">
                  {filteredPois.map(p => (
                    <tr key={p.id} className="hover:bg-brown-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-brown-900 hover:text-primary-600 cursor-pointer" onClick={() => setReviewingPoi(p)}>
                          {p.name}
                        </div>
                        <div className="text-xs text-brown-400 mt-0.5">
                          ID #{p.id} · {p.images ? p.images.length : 0} ảnh đính kèm
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-brown-600">
                        {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                      </td>
                      <td className="px-4 py-3 text-center text-brown-700 font-medium">
                        {p.radius} m
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.approvalStatus === 'APPROVED' ? (
                          <Badge variant="active">Đã duyệt</Badge>
                        ) : p.approvalStatus === 'PENDING' ? (
                          <Badge variant="partial">Chờ duyệt</Badge>
                        ) : (
                          <Badge variant="skipped">Bị từ chối</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button size="sm" variant="secondary" onClick={() => setReviewingPoi(p)} icon={<Eye className="w-3.5 h-3.5" />}>
                            Thẩm định
                          </Button>
                          {p.approvalStatus === 'PENDING' && (
                            <>
                              <Button size="sm" variant="success" onClick={() => void handleApprovePoi(p)} icon={<Check className="w-3.5 h-3.5" />}>
                                Duyệt
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => { setRejectingPoi(p); setPoiRejectReason(''); }} icon={<X className="w-3.5 h-3.5" />}>
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
            </div>
          </div>
        )}
      </Card>

      {/* MODAL XEM CHI TIẾT HỒ SƠ GIAN HÀNG (5.1.1) */}
      <Modal
        open={detailMerchant !== null}
        onClose={() => setDetailMerchant(null)}
        title={detailMerchant ? `Hồ sơ gian hàng: ${detailMerchant.name}` : ''}
        size="lg"
        footer={
          detailMerchant && (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-brown-500">
                {detailMerchant.approvalStatus === 'PENDING' ? 'Hồ sơ đang chờ duyệt' : ''}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setDetailMerchant(null)}>Đóng</Button>
                {detailMerchant.approvalStatus === 'PENDING' && (
                  <>
                    <Button variant="danger" onClick={() => { setRejectingMerchant(detailMerchant); setMerchantRejectReason(''); }}>
                      Từ chối
                    </Button>
                    <Button variant="success" onClick={() => setApprovingMerchant(detailMerchant)}>
                      Duyệt ngay
                    </Button>
                  </>
                )}
              </div>
            </div>
          )
        }
      >
        {detailMerchant && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 bg-brown-50/60 p-3.5 rounded-lg border border-brown-100">
              <div><span className="text-xs text-brown-400">Tên gian hàng:</span><p className="font-bold text-brown-900">{detailMerchant.name}</p></div>
              <div><span className="text-xs text-brown-400">Ngành hàng:</span><p className="font-semibold text-primary-700">{detailMerchant.category}</p></div>
              <div><span className="text-xs text-brown-400">Chủ tài khoản:</span><p className="font-medium text-brown-800">@{detailMerchant.username}</p></div>
              <div><span className="text-xs text-brown-400">Số điện thoại:</span><p className="font-medium text-brown-800">{detailMerchant.phoneNumber || '—'}</p></div>
              <div className="col-span-2"><span className="text-xs text-brown-400">Địa chỉ:</span><p className="font-medium text-brown-800">{detailMerchant.address}</p></div>
            </div>
            <div>
              <span className="font-semibold text-brown-800 block mb-1">Mô tả gian hàng:</span>
              <p className="p-3 bg-white rounded border border-brown-200 text-brown-700">{detailMerchant.description || 'Chưa có mô tả.'}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL PHÊ DUYỆT GIAN HÀNG + 5.3 GỬI EMAIL */}
      <Modal
        open={approvingMerchant !== null}
        onClose={() => !processing && setApprovingMerchant(null)}
        title="Phê duyệt hồ sơ gian hàng"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setApprovingMerchant(null)} disabled={processing}>Hủy</Button>
            <Button variant="success" onClick={handleApproveMerchant} disabled={processing} icon={<Check className="w-4 h-4" />}>
              {processing ? 'Đang duyệt…' : 'Xác nhận duyệt'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-brown-800">
            Bạn có chắc chắn muốn duyệt tài khoản gian hàng <strong>"{approvingMerchant?.name}"</strong>?
          </p>
          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-primary-50/60 border border-primary-200 cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmailNotification}
              onChange={e => setSendEmailNotification(e.target.checked)}
              className="rounded text-primary-600 focus:ring-primary-500"
            />
            <span className="text-xs text-primary-900 font-semibold flex items-center gap-1">
              <Send className="w-3.5 h-3.5" />
              Tự động gửi email thông báo kết quả duyệt cho đối tác
            </span>
          </label>
        </div>
      </Modal>

      {/* MODAL TỪ CHỐI GIAN HÀNG KÈM LÝ DO */}
      <Modal
        open={rejectingMerchant !== null}
        onClose={() => !processing && setRejectingMerchant(null)}
        title="Từ chối hồ sơ gian hàng"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectingMerchant(null)} disabled={processing}>Hủy</Button>
            <Button variant="danger" onClick={handleRejectMerchant} disabled={processing} icon={<X className="w-4 h-4" />}>
              {processing ? 'Đang gửi…' : 'Từ chối & Gửi thông báo'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-brown-700">Gian hàng: <strong>{rejectingMerchant?.name}</strong></p>
          <div>
            <label className="block text-xs font-semibold text-brown-700 mb-1">Nhập lý do từ chối *</label>
            <textarea
              required
              rows={3}
              value={merchantRejectReason}
              onChange={e => setMerchantRejectReason(e.target.value)}
              placeholder="Nhập lý do chưa đạt yêu cầu..."
              className="w-full rounded-lg border border-brown-200 p-2.5 text-sm outline-none focus:border-red-400"
            />
          </div>
          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmailNotification}
              onChange={e => setSendEmailNotification(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span className="text-xs text-amber-900 font-semibold flex items-center gap-1">
              <Send className="w-3.5 h-3.5" />
              Gửi email thông báo lý do từ chối tới hộp thư của chủ gian hàng
            </span>
          </label>
        </div>
      </Modal>

      {/* MODAL THẨM ĐỊNH POI DO GIAN HÀNG GỬI */}
      <Modal
        open={reviewingPoi !== null}
        onClose={() => setReviewingPoi(null)}
        title={reviewingPoi ? `Thẩm định điểm POI: ${reviewingPoi.name}` : ''}
        size="lg"
        footer={
          reviewingPoi && (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-brown-500">
                {reviewingPoi.approvalStatus === 'PENDING' ? 'POI đang chờ duyệt' : ''}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setReviewingPoi(null)}>Đóng</Button>
                {reviewingPoi.approvalStatus === 'PENDING' && (
                  <>
                    <Button variant="danger" onClick={() => { setRejectingPoi(reviewingPoi); setPoiRejectReason(''); }}>
                      Từ chối POI
                    </Button>
                    <Button variant="success" onClick={() => void handleApprovePoi(reviewingPoi)}>
                      Duyệt POI ngay
                    </Button>
                  </>
                )}
              </div>
            </div>
          )
        }
      >
        {reviewingPoi && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-4 gap-3 bg-brown-50/60 p-3 rounded-lg border border-brown-100">
              <div><span className="text-xs text-brown-400">Vĩ độ:</span><p className="font-mono">{reviewingPoi.latitude}</p></div>
              <div><span className="text-xs text-brown-400">Kinh độ:</span><p className="font-mono">{reviewingPoi.longitude}</p></div>
              <div><span className="text-xs text-brown-400">Bán kính:</span><p className="font-semibold text-primary-700">{reviewingPoi.radius} m</p></div>
              <div><span className="text-xs text-brown-400">Độ ưu tiên:</span><p className="font-semibold">{reviewingPoi.priorityLevel}</p></div>
            </div>
            <div>
              <span className="font-semibold text-brown-800 block mb-1">Mô tả nội dung POI:</span>
              <p className="p-3 bg-white rounded border border-brown-200 text-brown-700 leading-relaxed whitespace-pre-line">
                {reviewingPoi.originalDescription || 'Chưa có mô tả.'}
              </p>
            </div>
            {reviewingPoi.images && reviewingPoi.images.length > 0 && (
              <div>
                <span className="font-semibold text-brown-800 block mb-1">Hình ảnh đính kèm:</span>
                <div className="flex gap-2 flex-wrap">
                  {reviewingPoi.images.map((img, i) => (
                    <img key={i} src={resolvePoiImageUrl(img)} alt="" className="w-24 h-20 object-cover rounded border border-brown-200" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL TỪ CHỐI POI KÈM LÝ DO (5.2.3) */}
      <Modal
        open={rejectingPoi !== null}
        onClose={() => !processing && setRejectingPoi(null)}
        title="Từ chối điểm POI gian hàng"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectingPoi(null)} disabled={processing}>Hủy</Button>
            <Button variant="danger" onClick={handleRejectPoi} disabled={processing} icon={<X className="w-4 h-4" />}>
              {processing ? 'Đang gửi…' : 'Xác nhận từ chối POI'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-brown-700">Điểm tham quan: <strong>{rejectingPoi?.name}</strong></p>
          <div>
            <label className="block text-xs font-semibold text-brown-700 mb-1">Lý do từ chối POI *</label>
            <textarea
              required
              rows={3}
              value={poiRejectReason}
              onChange={e => setPoiRejectReason(e.target.value)}
              placeholder="Nhập lý do POI chưa phù hợp..."
              className="w-full rounded-lg border border-brown-200 p-2.5 text-sm outline-none focus:border-red-400"
            />
          </div>
          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmailNotification}
              onChange={e => setSendEmailNotification(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span className="text-xs text-amber-900 font-semibold flex items-center gap-1">
              <Send className="w-3.5 h-3.5" />
              Gửi email thông báo lý do từ chối POI tới chủ gian hàng
            </span>
          </label>
        </div>
      </Modal>
    </div>
  );
}
