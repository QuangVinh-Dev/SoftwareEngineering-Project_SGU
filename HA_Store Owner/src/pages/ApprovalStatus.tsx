import { CheckCircle2, Clock, XCircle, FileText, Send, Eye } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { useApp } from '@/hooks/useApp';
import { useToast } from '@/components/toast/ToastProvider';
import { stallOwnerProfile, myPois } from '@/data/mockData';
import type { ApprovalStatus } from '@/types';
import { classNames } from '@/utils/helpers';

const statusLabels: Record<ApprovalStatus, string> = {
  approved: 'Đã duyệt',
  pending: 'Đang chờ duyệt',
  rejected: 'Từ chối',
};

interface TimelineStep {
  label: string;
  description: string;
  icon: typeof CheckCircle2;
  done: boolean;
  current?: boolean;
}

export default function ApprovalStatus() {
  const { setCurrentPage } = useApp();
  const { showToast } = useToast();

  const accountStatus = stallOwnerProfile.accountStatus;

  const timeline: TimelineStep[] = [
    { label: 'Đã gửi hồ sơ', description: `Đăng ký tài khoản vào ngày ${stallOwnerProfile.createdAt}`, icon: Send, done: true },
    { label: 'Đang xét duyệt', description: 'Quản trị viên đang xem xét hồ sơ của bạn', icon: Clock, done: accountStatus !== 'pending', current: accountStatus === 'pending' },
    {
      label: accountStatus === 'rejected' ? 'Bị từ chối' : 'Đã duyệt',
      description: accountStatus === 'approved' ? 'Tài khoản đã được phê duyệt' : accountStatus === 'rejected' ? 'Hồ sơ chưa được duyệt' : 'Chờ kết quả xét duyệt',
      icon: accountStatus === 'rejected' ? XCircle : CheckCircle2,
      done: accountStatus === 'approved' || accountStatus === 'rejected',
      current: false,
    },
  ];

  const poiStatuses = myPois.map(p => ({
    id: p.id,
    name: p.name,
    status: p.approvalStatus,
    submittedAt: p.submittedAt,
    reviewedAt: p.reviewedAt,
    rejectionReason: p.rejectionReason,
  }));

  const handleViewPoi = (name: string) => {
    setCurrentPage('my-poi');
    showToast('info', `Xem chi tiết POI: ${name}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brown-900">Trạng thái duyệt</h1>
        <p className="text-sm text-brown-400 mt-1">Theo dõi trạng thái phê duyệt tài khoản và các POI của bạn.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-brown-900">Trạng thái tài khoản</h3>
            <Badge variant={accountStatus === 'approved' ? 'approved' : accountStatus === 'pending' ? 'pending' : 'rejected'}>
              {statusLabels[accountStatus]}
            </Badge>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-3 bg-brown-50 rounded-lg">
              <FileText className="w-5 h-5 text-brown-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-brown-400">Tên gian hàng</p>
                <p className="text-sm font-medium text-brown-800">{stallOwnerProfile.stallName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-brown-50 rounded-lg">
              <FileText className="w-5 h-5 text-brown-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-brown-400">Chủ gian hàng</p>
                <p className="text-sm font-medium text-brown-800">{stallOwnerProfile.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-brown-50 rounded-lg">
              <FileText className="w-5 h-5 text-brown-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-brown-400">Ngày đăng ký</p>
                <p className="text-sm font-medium text-brown-800">{stallOwnerProfile.createdAt}</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-brown-100" />
            <div className="space-y-6">
              {timeline.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="flex items-start gap-4 relative">
                    <div className={classNames(
                      'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 bg-white',
                      step.done ? (step.label === 'Bị từ chối' ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50') :
                      step.current ? 'border-orange-300 bg-orange-50 animate-pulse' : 'border-brown-200 bg-brown-50'
                    )}>
                      <Icon className={classNames(
                        'w-5 h-5',
                        step.done ? (step.label === 'Bị từ chối' ? 'text-red-500' : 'text-green-500') :
                        step.current ? 'text-orange-500' : 'text-brown-300'
                      )} />
                    </div>
                    <div className="pt-1.5">
                      <p className={classNames('text-sm font-medium', step.done || step.current ? 'text-brown-900' : 'text-brown-400')}>
                        {step.label}
                        {step.current && <span className="ml-2 text-xs text-orange-500 font-normal">(hiện tại)</span>}
                      </p>
                      <p className="text-xs text-brown-400 mt-0.5">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {accountStatus === 'approved' && (
            <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-700">Chúc mừng! Tài khoản của bạn đã được duyệt.</p>
            </div>
          )}
          {accountStatus === 'pending' && (
            <div className="mt-6 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <p className="text-sm text-orange-700">Hồ sơ đăng ký đang chờ xét duyệt. Vui lòng kiên nhẫn chờ đợi.</p>
            </div>
          )}
          {accountStatus === 'rejected' && (
            <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">Hồ sơ đăng ký chưa được duyệt. Vui lòng liên hệ quản trị viên.</p>
            </div>
          )}
        </Card>

        <Card noPadding>
          <div className="p-5 pb-3">
            <h3 className="text-base font-semibold text-brown-900">Trạng thái duyệt POI</h3>
            <p className="text-xs text-brown-400 mt-0.5">Tất cả POI và trạng thái phê duyệt</p>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-y border-brown-100 bg-brown-50/50">
                  <th className="px-4 py-2.5 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">Tên POI</th>
                  <th className="px-4 py-2.5 text-center font-medium text-brown-500 text-xs uppercase tracking-wider">Trạng thái</th>
                  <th className="px-4 py-2.5 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">Ngày gửi</th>
                  <th className="px-4 py-2.5 text-center font-medium text-brown-500 text-xs uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {poiStatuses.map(poi => (
                  <tr key={poi.id} className="border-b border-brown-50 hover:bg-brown-50/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-brown-800">{poi.name}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={poi.status === 'approved' ? 'approved' : poi.status === 'pending' ? 'pending' : 'rejected'}>
                        {statusLabels[poi.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-brown-600">{poi.submittedAt}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleViewPoi(poi.name)} className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors" title="Xem chi tiết">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-brown-100">
            <Button variant="secondary" size="sm" onClick={() => setCurrentPage('submit-poi')} icon={<Send className="w-3.5 h-3.5" />}>Gửi POI mới</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
