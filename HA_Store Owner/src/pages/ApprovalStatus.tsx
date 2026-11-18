import { useEffect, useState } from 'react';
import {
  CheckCircle2, Clock, XCircle, Send,
  Mail, Store, User, MapPin, AlertCircle, RefreshCw,
  ExternalLink, Edit3, ShieldCheck, Sparkles, ChevronRight,
  Headphones, ArrowUpRight
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { useApp } from '@/hooks/useApp';
import { useToast } from '@/components/toast/ToastProvider';
import { classNames } from '@/utils/helpers';
import { getMerchantPois, resolveMerchantPoiImage, type MerchantPoi } from '@/services/poiApi';

const statusConfig: Record<string, { label: string; badgeVariant: 'active' | 'partial' | 'skipped'; bg: string; text: string; border: string }> = {
  APPROVED: {
    label: 'Đã phê duyệt',
    badgeVariant: 'active',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  PENDING: {
    label: 'Đang thẩm định',
    badgeVariant: 'partial',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  REJECTED: {
    label: 'Bị từ chối',
    badgeVariant: 'skipped',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
};

export default function ApprovalStatus() {
  const { setCurrentPage, authUser } = useApp();
  const { showToast } = useToast();

  const [poi, setPoi] = useState<MerchantPoi | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Trạng thái tài khoản gian hàng (1.3)
  const accountStatus = (authUser?.approvalStatus || 'APPROVED').toUpperCase();
  const accountMeta = statusConfig[accountStatus] || statusConfig.APPROVED;

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    if (!authUser?.merchantId) {
      setPoi(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const list = await getMerchantPois();
      setPoi(list.length > 0 ? list[0] : null);
      if (isManual) showToast('success', 'Đã cập nhật trạng thái mới nhất từ hệ thống!');
    } catch {
      if (isManual) showToast('error', 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const poiStatus = (poi?.approvalStatus || 'PENDING').toUpperCase();
  const poiMeta = statusConfig[poiStatus] || statusConfig.PENDING;

  // Timeline tài khoản (1.3)
  const accountTimeline = [
    {
      title: 'Nộp hồ sơ gian hàng',
      desc: 'Điền thông tin doanh nghiệp, đại diện và hồ sơ pháp lý.',
      time: 'Đã hoàn tất',
      done: true,
      current: false,
    },
    {
      title: 'Ban quản lý thẩm định',
      desc: 'Đối chiếu thông tin thực tế tại Phố Cổ Hội An.',
      time: accountStatus === 'PENDING'
        ? 'Đang xử lý'
        : accountStatus === 'REJECTED' ? 'Đã thẩm định' : 'Đã duyệt',
      done: accountStatus !== 'PENDING',
      current: accountStatus === 'PENDING',
    },
    {
      title: accountStatus === 'REJECTED' ? 'Hồ sơ bị từ chối' : 'Kích hoạt tài khoản chính thức',
      desc: accountStatus === 'REJECTED'
        ? 'Hồ sơ chưa đạt tiêu chuẩn. Vui lòng kiểm tra lý do và nộp lại.'
        : 'Chủ gian hàng được cấp quyền gửi và quản lý POI thuyết minh.',
      time: accountStatus === 'APPROVED' ? 'Chính thức kích hoạt' : 'Chờ hoàn tất',
      done: accountStatus === 'APPROVED',
      rejected: accountStatus === 'REJECTED',
      current: false,
    },
  ];

  // Timeline POI (2.4)
  const poiTimeline = [
    {
      title: 'Gửi hồ sơ POI điểm tham quan',
      desc: 'Nhập thông tin giới thiệu, định vị GPS, bán kính và ảnh chụp.',
      done: Boolean(poi),
      current: false,
    },
    {
      title: 'Khảo sát tọa độ Geofence & Nội dung',
      desc: 'Ban quản lý kiểm tra vị trí GPS trên bản đồ số Hội An.',
      done: poiStatus === 'APPROVED' || poiStatus === 'REJECTED',
      current: poiStatus === 'PENDING',
    },
    {
      title: poiStatus === 'REJECTED' ? 'POI bị từ chối kiểm duyệt' : 'Phát sóng audio thuyết minh',
      desc: poiStatus === 'REJECTED'
        ? (poi?.rejectionReason || 'Vui lòng chỉnh sửa tọa độ hoặc nội dung để gửi duyệt lại.')
        : 'Hệ thống tự động phát thuyết minh đa ngôn ngữ khi du khách đến gần.',
      done: poiStatus === 'APPROVED',
      rejected: poiStatus === 'REJECTED',
      current: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#240c52] via-[#2e1065] to-[#4c1d95] p-6 lg:p-8 text-white shadow-xl shadow-purple-950/20 border border-purple-800/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-xs font-bold uppercase tracking-wider text-purple-200">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
              <span>Tiến trình xét duyệt Ban Quản Lý</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Trạng thái phê duyệt
            </h1>
            <p className="text-sm text-purple-200/80 max-w-2xl leading-relaxed">
              Theo dõi trực tiếp quá trình thẩm định tài khoản gian hàng và điểm tham quan (POI) duy nhất của bạn trên hệ thống thuyết minh Hội An Heritage.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => void loadData(true)}
              disabled={refreshing}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-purple-300' : ''}`} />
              {refreshing ? 'Đang làm mới…' : 'Cập nhật trạng thái'}
            </Button>
          </div>
        </div>

        {/* Top Summary Bar */}
        <div className="mt-6 pt-5 border-t border-purple-800/60 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 backdrop-blur-sm">
            <p className="text-[11px] font-semibold text-purple-300/80 uppercase tracking-wide">Tài khoản gian hàng</p>
            <p className="text-xs font-bold text-white truncate flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {accountMeta.label}
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 backdrop-blur-sm">
            <p className="text-[11px] font-semibold text-purple-300/80 uppercase tracking-wide">POI Điểm tham quan</p>
            <p className="text-xs font-bold text-white truncate flex items-center gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full ${
                poiStatus === 'APPROVED' ? 'bg-emerald-400' :
                poiStatus === 'PENDING' ? 'bg-amber-400' : 'bg-red-400'
              }`} />
              {poi ? poiMeta.label : 'Chưa thiết lập'}
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 backdrop-blur-sm">
            <p className="text-[11px] font-semibold text-purple-300/80 uppercase tracking-wide">Hộp thư nhận kết quả</p>
            <p className="text-xs font-bold text-white truncate mt-1">
              {authUser?.email || 'email@hoianheritage.vn'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ======================================================== */}
        {/* Card 1: 1.3 Trạng thái phê duyệt Tài khoản Chủ Gian Hàng */}
        {/* ======================================================== */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  1. Tài khoản Chủ gian hàng
                </h2>
                <p className="text-xs text-slate-400">Tư cách pháp nhân & Quyền kinh doanh</p>
              </div>
              <Badge variant={accountMeta.badgeVariant}>{accountMeta.label}</Badge>
            </div>

            {/* Merchant Details Box */}
            <div className="my-5 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#9333ea] text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-purple-900/10 flex-shrink-0">
                  {authUser?.stallName ? authUser.stallName.charAt(0).toUpperCase() : 'GH'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-slate-900 truncate">
                    {authUser?.stallName || 'Gian hàng Hội An'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    Đại diện: <strong className="text-slate-700">{authUser?.fullName || 'Chủ gian hàng'}</strong>
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCurrentPage('account')}
                className="flex-shrink-0 text-xs"
              >
                Hồ sơ
              </Button>
            </div>

            {/* Timeline Stepper (1.3.1) */}
            <div className="space-y-4 my-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Lộ trình xét duyệt tài khoản
              </p>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {accountTimeline.map((step, idx) => (
                  <div key={idx} className="relative group">
                    <span
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                        step.rejected
                          ? 'border-red-500 bg-red-500 text-white shadow-sm shadow-red-500/30'
                          : step.done
                          ? 'border-[#7c3aed] bg-[#7c3aed] text-white shadow-sm shadow-purple-900/30'
                          : step.current
                          ? 'border-amber-400 bg-amber-50 text-amber-600 animate-pulse'
                          : 'border-slate-300 bg-white text-slate-400'
                      }`}
                    >
                      {step.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-xs font-bold ${
                          step.rejected ? 'text-red-700' : step.done ? 'text-slate-900' : 'text-slate-500'
                        }`}>
                          {step.title}
                        </h4>
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          {step.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rejection notice if any */}
            {accountStatus === 'REJECTED' && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1 mb-4">
                <p className="font-bold flex items-center gap-1.5 text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  Lý do tài khoản chưa được duyệt:
                </p>
                <p className="text-red-900 pl-5">
                  {authUser?.rejectionReason || 'Thông tin giấy phép kinh doanh hoặc định danh chưa trùng khớp. Vui lòng liên hệ quản trị viên để được hướng dẫn.'}
                </p>
              </div>
            )}
          </div>

          {/* 1.3.2 Email Notification Footer */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-purple-50/40 -mx-6 -mb-6 p-4 rounded-b-3xl">
            <span className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#7c3aed]" />
              Email xác thực: <strong className="text-slate-800">{authUser?.email}</strong>
            </span>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Tự động gửi kết quả
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* Card 2: 2.4 Trạng thái kiểm duyệt Điểm Tham Quan (POI) */}
        {/* ======================================================== */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  2. Trạng thái kiểm duyệt POI
                </h2>
                <p className="text-xs text-slate-400">Điểm thuyết minh tự động duy nhất của gian hàng</p>
              </div>
              {poi ? (
                <Badge variant={poiMeta.badgeVariant}>{poiMeta.label}</Badge>
              ) : (
                <Badge variant="pending">Chưa thiết lập</Badge>
              )}
            </div>

            {loading ? (
              <div className="py-14 text-center">
                <div className="inline-block w-8 h-8 border-4 border-purple-200 border-t-[#7c3aed] rounded-full animate-spin mb-2" />
                <p className="text-xs text-slate-500">Đang tải trạng thái điểm tham quan…</p>
              </div>
            ) : !poi ? (
              /* Chưa có POI */
              <div className="my-8 text-center p-6 rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/30">
                <MapPin className="w-10 h-10 text-[#7c3aed] mx-auto mb-2 opacity-70" />
                <h3 className="text-sm font-bold text-slate-800">Gian hàng chưa gửi POI nào</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Bạn cần thiết lập điểm tham quan đầu tiên để ban quản lý thẩm định vị trí Geofence.
                </p>
                <Button className="mt-4" onClick={() => setCurrentPage('my-poi')}>
                  Thiết lập POI ngay
                </Button>
              </div>
            ) : (
              /* Đã có POI duy nhất */
              <div className="space-y-5 my-5">
                {/* POI Preview Card */}
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    {poi.images[0] ? (
                      <img
                        src={resolveMerchantPoiImage(poi.images[0])}
                        alt={poi.name}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-purple-100 text-[#7c3aed] flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-900 truncate">{poi.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{poi.originalDescription || 'Chưa có mô tả'}</p>
                      <p className="text-[11px] text-[#7c3aed] font-medium mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {poi.latitude.toFixed(4)}, {poi.longitude.toFixed(4)} · Bán kính: {poi.radius}m
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setCurrentPage('edit-poi')}
                    icon={<Edit3 className="w-3.5 h-3.5 text-[#7c3aed]" />}
                    className="flex-shrink-0 text-xs"
                  >
                    Chỉnh sửa
                  </Button>
                </div>

                {/* 2.4.1 Lý do từ chối nếu có */}
                {poiStatus === 'REJECTED' && (
                  <div className="p-4 rounded-2xl bg-red-50/90 border border-red-200 text-xs text-red-800 space-y-1.5 shadow-xs">
                    <p className="font-extrabold flex items-center gap-1.5 text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      Lý do từ chối từ Ban Quản Lý:
                    </p>
                    <p className="text-red-900 pl-5 leading-relaxed font-medium">
                      {poi.rejectionReason || 'Tọa độ GPS bị trùng lặp hoặc chưa xác thực được vị trí gian hàng trên thực tế. Vui lòng kiểm tra lại.'}
                    </p>
                    <div className="pt-2 pl-5">
                      <Button
                        size="sm"
                        onClick={() => setCurrentPage('edit-poi')}
                        icon={<ArrowUpRight className="w-3.5 h-3.5" />}
                      >
                        Chỉnh sửa & Gửi duyệt lại ngay
                      </Button>
                    </div>
                  </div>
                )}

                {/* Timeline Stepper POI (2.4) */}
                <div className="space-y-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Lộ trình kiểm định điểm tham quan
                  </p>
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                    {poiTimeline.map((step, idx) => (
                      <div key={idx} className="relative group">
                        <span
                          className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                            step.rejected
                              ? 'border-red-500 bg-red-500 text-white shadow-sm shadow-red-500/30'
                              : step.done
                              ? 'border-[#7c3aed] bg-[#7c3aed] text-white shadow-sm shadow-purple-900/30'
                              : step.current
                              ? 'border-amber-400 bg-amber-50 text-amber-600 animate-pulse'
                              : 'border-slate-300 bg-white text-slate-400'
                          }`}
                        >
                          {step.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold ${
                            step.rejected ? 'text-red-700' : step.done ? 'text-slate-900' : 'text-slate-500'
                          }`}>
                            {step.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {poiStatus === 'APPROVED' && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                    <span className="flex items-center gap-2 font-semibold">
                      <Headphones className="w-4 h-4 text-emerald-600" />
                      POI đang phát thuyết minh tự động khi du khách đến gần
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setCurrentPage('dashboard')}
                      className="text-xs text-emerald-700 hover:bg-emerald-100"
                    >
                      Xem lượt nghe
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2.4.2 Email Notification Footer */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-purple-50/40 -mx-6 -mb-6 p-4 rounded-b-3xl">
            <span className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#7c3aed]" />
              Kết quả kiểm duyệt POI được gửi qua email gian hàng
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCurrentPage('my-poi')}
              className="text-xs"
            >
              Quản lý POI
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
